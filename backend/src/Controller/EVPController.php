<?php

namespace App\Controller;

use App\Entity\EVPSubmission;
use App\Entity\Employee;
use App\Entity\User;
use App\Repository\EVPSubmissionRepository;
use App\Repository\EmployeeRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/evp', name: 'api_evp_')]
#[IsGranted('ROLE_USER')]
class EVPController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private SerializerInterface $serializer,
        private ValidatorInterface $validator,
        private EVPSubmissionRepository $evpRepository,
        private EmployeeRepository $employeeRepository
    ) {
    }

    #[Route('/submissions', name: 'list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return new JsonResponse(['error' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        // Filtrage selon le rôle
        $submissions = $this->evpRepository->findAll();
        
        // TODO: Implémenter le filtrage selon le rôle de l'utilisateur
        
        $data = $this->serializer->serialize($submissions, 'json', ['groups' => 'evp:read']);
        
        return new JsonResponse(json_decode($data, true), Response::HTTP_OK);
    }

    #[Route('/submissions', name: 'create', methods: ['POST'])]
    #[IsGranted('ROLE_GESTIONNAIRE')]
    public function create(Request $request): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return new JsonResponse(['error' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        $data = json_decode($request->getContent(), true);

        // Validation des données
        if (!isset($data['employeeId']) || !isset($data['type'])) {
            return new JsonResponse(['error' => 'Missing required fields'], Response::HTTP_BAD_REQUEST);
        }

        $employee = $this->employeeRepository->find($data['employeeId']);
        if (!$employee) {
            return new JsonResponse(['error' => 'Employee not found'], Response::HTTP_NOT_FOUND);
        }

        $submission = new EVPSubmission();
        $submission->setEmployee($employee);
        $submission->setSubmittedBy($user);
        $submission->setType($data['type']);

        // Traitement selon le type
        if ($data['type'] === 'Prime') {
            $this->handlePrimeSubmission($submission, $data);
        } elseif ($data['type'] === 'Congé') {
            $this->handleCongeSubmission($submission, $data);
        }

        $errors = $this->validator->validate($submission);
        if (count($errors) > 0) {
            return new JsonResponse(['error' => (string) $errors], Response::HTTP_BAD_REQUEST);
        }

        $this->em->persist($submission);
        $this->em->flush();

        $data = $this->serializer->serialize($submission, 'json', ['groups' => 'evp:read']);
        
        return new JsonResponse(json_decode($data, true), Response::HTTP_CREATED);
    }

    private function handlePrimeSubmission(EVPSubmission $submission, array $data): void
    {
        $submission->setTauxMonetaire($data['tauxMonetaire'] ?? null);
        $submission->setGroupe($data['groupe'] ?? null);
        $submission->setNombrePostes($data['nombrePostes'] ?? null);
        $submission->setScoreEquipe($data['scoreEquipe'] ?? null);
        $submission->setNoteHierarchique($data['noteHierarchique'] ?? null);
        $submission->setScoreCollectif($data['scoreCollectif'] ?? null);

        // Calcul du montant selon la formule
        if ($submission->getTauxMonetaire() && $submission->getNombrePostes()) {
            $totalScores = ($submission->getScoreEquipe() ?? 0) + 
                          ($submission->getNoteHierarchique() ?? 0) + 
                          ($submission->getScoreCollectif() ?? 0);
            
            $montant = (floatval($submission->getTauxMonetaire()) * 
                       $submission->getNombrePostes() * 
                       $totalScores) / 100;
            
            $submission->setMontantCalcule((string) ceil($montant));
        }
    }

    private function handleCongeSubmission(EVPSubmission $submission, array $data): void
    {
        if (isset($data['dateDebut']) && isset($data['dateFin'])) {
            $dateDebut = new \DateTime($data['dateDebut']);
            $dateFin = new \DateTime($data['dateFin']);
            
            $submission->setDateDebut($dateDebut);
            $submission->setDateFin($dateFin);
            
            // Calcul du nombre de jours
            $diff = $dateDebut->diff($dateFin);
            $nombreJours = $diff->days + 1;
            $submission->setNombreJours($nombreJours);
        }

        $submission->setTranche($data['tranche'] ?? null);
        $submission->setAvanceSurConge($data['avanceSurConge'] ?? false);
        $submission->setMontantAvance($data['montantAvance'] ?? null);
        $submission->setIndemniteForfaitaire($data['indemniteForfaitaire'] ?? null);

        // Calcul de l'indemnité
        if ($submission->getNombreJours() && $submission->getIndemniteForfaitaire() && $submission->getTranche()) {
            $indemnite = ($submission->getNombreJours() * 
                         floatval($submission->getIndemniteForfaitaire()) * 
                         $submission->getTranche()) / 10;
            
            $submission->setIndemniteCalculee((string) ceil($indemnite));
        }
    }
}








