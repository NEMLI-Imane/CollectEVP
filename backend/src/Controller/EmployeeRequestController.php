<?php

namespace App\Controller;

use App\Entity\EmployeeRequest;
use App\Entity\Employee;
use App\Entity\User;
use App\Repository\EmployeeRequestRepository;
use App\Repository\EmployeeRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/employee-requests')]
class EmployeeRequestController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private EmployeeRequestRepository $requestRepository,
        private EmployeeRepository $employeeRepository,
        private ValidatorInterface $validator
    ) {}

    /**
     * Créer une nouvelle demande d'ajout d'employé
     */
    #[Route('', name: 'create_employee_request', methods: ['POST'])]
    #[IsGranted('ROLE_GESTIONNAIRE')]
    public function create(Request $request): JsonResponse
    {
        try {
            $user = $this->getUser();
            if (!$user instanceof User) {
                return new JsonResponse(['error' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
            }

            $data = json_decode($request->getContent(), true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                return new JsonResponse(['error' => 'Invalid JSON'], Response::HTTP_BAD_REQUEST);
            }

            // Validation des champs requis
            if (empty($data['matricule']) || empty($data['nom']) || empty($data['prenom']) || empty($data['raison'])) {
                return new JsonResponse([
                    'error' => 'Missing required fields',
                    'message' => 'matricule, nom, prenom, and raison are required'
                ], Response::HTTP_BAD_REQUEST);
            }

            // Vérifier si un employé avec ce matricule existe déjà
            $existingEmployee = $this->employeeRepository->findOneBy(['matricule' => $data['matricule']]);
            if ($existingEmployee) {
                return new JsonResponse([
                    'error' => 'Employee already exists',
                    'message' => 'Un employé avec ce matricule existe déjà'
                ], Response::HTTP_CONFLICT);
            }

            // Vérifier si une demande en attente existe déjà pour ce matricule
            $existingRequest = $this->requestRepository->findOneBy([
                'matricule' => $data['matricule'],
                'statut' => 'En attente'
            ]);
            if ($existingRequest) {
                return new JsonResponse([
                    'error' => 'Request already exists',
                    'message' => 'Une demande en attente existe déjà pour ce matricule'
                ], Response::HTTP_CONFLICT);
            }

            // Créer la demande
            $employeeRequest = new EmployeeRequest();
            $employeeRequest->setMatricule($data['matricule']);
            $employeeRequest->setNom($data['nom']);
            $employeeRequest->setPrenom($data['prenom']);
            $employeeRequest->setRaison($data['raison']);
            $employeeRequest->setRequestedBy($user);
            $employeeRequest->setStatut('En attente');

            // Valider
            $errors = $this->validator->validate($employeeRequest);
            if (count($errors) > 0) {
                $errorMessages = [];
                foreach ($errors as $error) {
                    $errorMessages[] = $error->getPropertyPath() . ': ' . $error->getMessage();
                }
                return new JsonResponse([
                    'error' => 'Validation failed',
                    'details' => $errorMessages
                ], Response::HTTP_BAD_REQUEST);
            }

            $this->em->persist($employeeRequest);
            $this->em->flush();

            // Construire la réponse
            $responseData = [
                'id' => $employeeRequest->getId(),
                'matricule' => $employeeRequest->getMatricule(),
                'nom' => $employeeRequest->getNom(),
                'prenom' => $employeeRequest->getPrenom(),
                'raison' => $employeeRequest->getRaison(),
                'requestedBy' => [
                    'id' => $user->getId(),
                    'name' => $user->getName(),
                    'email' => $user->getEmail(),
                ],
                'requestDate' => $employeeRequest->getRequestDate()->format(\DateTimeImmutable::ATOM),
                'statut' => $employeeRequest->getStatut(),
            ];

            return new JsonResponse($responseData, Response::HTTP_CREATED);

        } catch (\Exception $e) {
            error_log('EmployeeRequest Create Error: ' . $e->getMessage());
            error_log('Stack trace: ' . $e->getTraceAsString());
            return new JsonResponse([
                'error' => 'Unexpected error',
                'message' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Lister toutes les demandes (pour le RH)
     */
    #[Route('', name: 'list_employee_requests', methods: ['GET'])]
    #[IsGranted('ROLE_RH')]
    public function list(): JsonResponse
    {
        try {
            $requests = $this->requestRepository->findBy([], ['requestDate' => 'DESC']);

            $responseData = [];
            foreach ($requests as $req) {
                $requestedBy = $req->getRequestedBy();
                $processedBy = $req->getProcessedBy();

                $responseData[] = [
                    'id' => $req->getId(),
                    'matricule' => $req->getMatricule(),
                    'nom' => $req->getNom(),
                    'prenom' => $req->getPrenom(),
                    'raison' => $req->getRaison(),
                    'requestedBy' => $requestedBy ? [
                        'id' => $requestedBy->getId(),
                        'name' => $requestedBy->getName(),
                        'email' => $requestedBy->getEmail(),
                    ] : null,
                    'requestDate' => $req->getRequestDate()->format(\DateTimeImmutable::ATOM),
                    'processedBy' => $processedBy ? [
                        'id' => $processedBy->getId(),
                        'name' => $processedBy->getName(),
                        'email' => $processedBy->getEmail(),
                    ] : null,
                    'processedDate' => $req->getProcessedDate() ? $req->getProcessedDate()->format(\DateTimeImmutable::ATOM) : null,
                    'statut' => $req->getStatut(),
                ];
            }

            return new JsonResponse($responseData, Response::HTTP_OK);

        } catch (\Exception $e) {
            error_log('EmployeeRequest List Error: ' . $e->getMessage());
            return new JsonResponse([
                'error' => 'Unexpected error',
                'message' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Traiter une demande (Ajouter ou Rejeter)
     */
    #[Route('/{id}/process', name: 'process_employee_request', methods: ['PUT'])]
    #[IsGranted('ROLE_RH')]
    public function process(int $id, Request $request): JsonResponse
    {
        try {
            $user = $this->getUser();
            if (!$user instanceof User) {
                return new JsonResponse(['error' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
            }

            $employeeRequest = $this->requestRepository->find($id);
            if (!$employeeRequest) {
                return new JsonResponse(['error' => 'Request not found'], Response::HTTP_NOT_FOUND);
            }

            if ($employeeRequest->getStatut() !== 'En attente') {
                return new JsonResponse([
                    'error' => 'Request already processed',
                    'message' => 'Cette demande a déjà été traitée'
                ], Response::HTTP_BAD_REQUEST);
            }

            $data = json_decode($request->getContent(), true);
            $action = $data['action'] ?? null; // 'approve' ou 'reject'

            if ($action === 'reject') {
                // Rejeter la demande
                $employeeRequest->setStatut('Rejeté');
                $employeeRequest->setProcessedBy($user);
                $employeeRequest->setProcessedDate(new \DateTimeImmutable());

                $this->em->flush();

                return new JsonResponse([
                    'message' => 'Demande rejetée avec succès',
                    'statut' => 'Rejeté'
                ], Response::HTTP_OK);

            } elseif ($action === 'approve') {
                // Vérifier que les données complémentaires sont fournies
                if (empty($data['poste']) || empty($data['service']) || empty($data['division'])) {
                    return new JsonResponse([
                        'error' => 'Missing required fields',
                        'message' => 'poste, service, and division are required when approving'
                    ], Response::HTTP_BAD_REQUEST);
                }

                // Vérifier si un employé avec ce matricule existe déjà
                $existingEmployee = $this->employeeRepository->findOneBy(['matricule' => $employeeRequest->getMatricule()]);
                if ($existingEmployee) {
                    return new JsonResponse([
                        'error' => 'Employee already exists',
                        'message' => 'Un employé avec ce matricule existe déjà'
                    ], Response::HTTP_CONFLICT);
                }

                // Créer l'employé
                $employee = new Employee();
                $employee->setMatricule($employeeRequest->getMatricule());
                $employee->setNom($employeeRequest->getNom());
                $employee->setPrenom($employeeRequest->getPrenom());
                $employee->setPoste($data['poste']);
                $employee->setService($data['service']);
                $employee->setDivision($data['division']);

                // Valider
                $errors = $this->validator->validate($employee);
                if (count($errors) > 0) {
                    $errorMessages = [];
                    foreach ($errors as $error) {
                        $errorMessages[] = $error->getPropertyPath() . ': ' . $error->getMessage();
                    }
                    return new JsonResponse([
                        'error' => 'Validation failed',
                        'details' => $errorMessages
                    ], Response::HTTP_BAD_REQUEST);
                }

                $this->em->persist($employee);

                // Mettre à jour la demande
                $employeeRequest->setStatut('Traité');
                $employeeRequest->setProcessedBy($user);
                $employeeRequest->setProcessedDate(new \DateTimeImmutable());

                $this->em->flush();

                // Construire la réponse
                $responseData = [
                    'message' => 'Employé créé avec succès',
                    'employee' => [
                        'id' => $employee->getId(),
                        'matricule' => $employee->getMatricule(),
                        'nom' => $employee->getNom(),
                        'prenom' => $employee->getPrenom(),
                        'poste' => $employee->getPoste(),
                        'service' => $employee->getService(),
                        'division' => $employee->getDivision(),
                    ],
                    'request' => [
                        'id' => $employeeRequest->getId(),
                        'statut' => $employeeRequest->getStatut(),
                    ]
                ];

                return new JsonResponse($responseData, Response::HTTP_OK);

            } else {
                return new JsonResponse([
                    'error' => 'Invalid action',
                    'message' => 'Action must be "approve" or "reject"'
                ], Response::HTTP_BAD_REQUEST);
            }

        } catch (\Exception $e) {
            error_log('EmployeeRequest Process Error: ' . $e->getMessage());
            error_log('Stack trace: ' . $e->getTraceAsString());
            return new JsonResponse([
                'error' => 'Unexpected error',
                'message' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}

