<?php

namespace App\Controller;

use App\Entity\EVPSubmission;
use App\Entity\Employee;
use App\Entity\User;
use App\Entity\Prime;
use App\Entity\Conge;
use App\Repository\EVPSubmissionRepository;
use App\Repository\EmployeeRepository;
use Doctrine\DBAL\Exception\NotNullConstraintViolationException;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\ORMException;
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

        try {
            // Récupérer les soumissions
        $submissions = $this->evpRepository->findAll();
        
        // TODO: Implémenter le filtrage selon le rôle de l'utilisateur
        
            // Construire manuellement un tableau de données pour éviter les références circulaires
            $data = [];
            foreach ($submissions as $submission) {
                try {
                    $employee = $submission->getEmployee();
                    
                    // Construire les données de l'employé sans les soumissions (éviter la boucle)
                    $employeeData = null;
                    if ($employee) {
                        $employeeData = [
                            'id' => $employee->getId(),
                            'matricule' => $employee->getMatricule() ?? '',
                            'nom' => $employee->getNom() ?? '',
                            'prenom' => $employee->getPrenom() ?? '',
                            'poste' => $employee->getPoste() ?? '',
                            'service' => $employee->getService() ?? '',
                            'division' => $employee->getDivision() ?? '',
                        ];
                    }
                    
                    // Récupérer les entités Prime et Conge
                    $prime = $submission->getPrime();
                    $conge = $submission->getConge();
                    
                    // Construire les données Prime si présentes
                    $primeData = null;
                    if ($prime) {
                        $primeData = [
                            'id' => $prime->getId(),
                            'tauxMonetaire' => $prime->getTauxMonetaire(),
                            'groupe' => $prime->getGroupe(),
                            'nombrePostes' => $prime->getNombrePostes(),
                            'scoreEquipe' => $prime->getScoreEquipe(),
                            'noteHierarchique' => $prime->getNoteHierarchique(),
                            'scoreCollectif' => $prime->getScoreCollectif(),
                            'montantCalcule' => $prime->getMontantCalcule(),
                            'statut' => $prime->getStatut() ?? 'En attente',
                            'submittedAt' => $prime->getSubmittedAt() ? $prime->getSubmittedAt()->format('Y-m-d\TH:i:s') : null,
                            'commentaire' => $prime->getCommentaire(),
                        ];
                    }
                    
                    // Construire les données Conge si présentes
                    $congeData = null;
                    if ($conge) {
                        $congeData = [
                            'id' => $conge->getId(),
                            'dateDebut' => $conge->getDateDebut() ? $conge->getDateDebut()->format('Y-m-d') : null,
                            'dateFin' => $conge->getDateFin() ? $conge->getDateFin()->format('Y-m-d') : null,
                            'nombreJours' => $conge->getNombreJours(),
                            'tranche' => $conge->getTranche(),
                            'avanceSurConge' => $conge->isAvanceSurConge() ?? false,
                            'montantAvance' => $conge->getMontantAvance(),
                            'indemniteForfaitaire' => $conge->getIndemniteForfaitaire(),
                            'indemniteCalculee' => $conge->getIndemniteCalculee(),
                            'statut' => $conge->getStatut() ?? 'En attente',
                            'submittedAt' => $conge->getSubmittedAt() ? $conge->getSubmittedAt()->format('Y-m-d\TH:i:s') : null,
                            'commentaire' => $conge->getCommentaire(),
                        ];
                    }
                    
                    // Construire les données de la soumission
                    $submissionData = [
                        'id' => $submission->getId(),
                        'employee' => $employeeData,
                        'isPrime' => $submission->isPrime(),
                        'isConge' => $submission->isConge(),
                        'montantCalcule' => $submission->getMontantCalcule() ?? '0.00',
                        'indemniteCalculee' => $submission->getIndemniteCalculee(),
                        'valideService' => $submission->isValideService(),
                        'valideDivision' => $submission->isValideDivision(),
                        // Entités Prime et Conge complètes
                        'prime' => $primeData,
                        'conge' => $congeData,
                    ];
                    
                    $data[] = $submissionData;
                } catch (\Exception $e) {
                    // Logger l'erreur pour cette soumission mais continuer avec les autres
                    error_log('Error processing submission ID ' . $submission->getId() . ': ' . $e->getMessage());
                    continue;
                }
            }
            
            return new JsonResponse($data, Response::HTTP_OK);
            
        } catch (\Exception $e) {
            error_log('Error listing EVP submissions: ' . $e->getMessage());
            error_log('Stack trace: ' . $e->getTraceAsString());
            return new JsonResponse([
                'error' => 'Error retrieving submissions',
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/submissions', name: 'create', methods: ['POST'])]
    #[IsGranted('ROLE_GESTIONNAIRE')]
    public function create(Request $request): JsonResponse
    {
        try {
            // Vérifier l'authentification
        $user = $this->getUser();
        if (!$user instanceof User) {
            return new JsonResponse(['error' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

            // Parser les données JSON
        $data = json_decode($request->getContent(), true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                return new JsonResponse(['error' => 'Invalid JSON: ' . json_last_error_msg()], Response::HTTP_BAD_REQUEST);
            }

            // Validation des données requises
            if (!isset($data['employeeId']) || empty($data['employeeId'])) {
                return new JsonResponse(['error' => 'Missing required field: employeeId'], Response::HTTP_BAD_REQUEST);
            }

            // Récupérer l'employé depuis la base de données avec EntityManager
            $employeeId = (int) $data['employeeId'];
            $employee = $this->em->find(Employee::class, $employeeId);
            
        if (!$employee) {
                return new JsonResponse(['error' => 'Employee not found with ID: ' . $employeeId], Response::HTTP_NOT_FOUND);
        }

            // Créer la soumission
        $submission = new EVPSubmission();
            
            // Définir TOUS les champs obligatoires AVANT toute autre opération
            // 1. Liaison avec l'employé (OBLIGATOIRE - nullable: false)
        $submission->setEmployee($employee);
            
            // 2. Liaison avec l'utilisateur/gestionnaire (OBLIGATOIRE - nullable: false)
        $submission->setSubmittedBy($user);
            
            // 3. Déterminer le type de soumission via les booléens
            // IMPORTANT: Un employé peut avoir à la fois une Prime ET un Congé (les deux booléens peuvent être true)
            
            // Vérifier le type depuis le paramètre 'type' ou les données fournies
            $typeFromParam = isset($data['type']) ? $data['type'] : null;
            
            // Si des données Prime sont fournies, mettre isPrime à true
            $isPrime = isset($data['tauxMonetaire']) || isset($data['nombrePostes']) || isset($data['scoreEquipe']) ||
                      isset($data['groupe']) || isset($data['noteHierarchique']) || isset($data['scoreCollectif']) ||
                      ($typeFromParam === 'Prime');
            
            // Si des données Congé sont fournies, mettre isConge à true
            $isConge = isset($data['dateDebut']) || isset($data['dateFin']) || isset($data['indemniteForfaitaire']) ||
                      isset($data['tranche']) || isset($data['avanceSurConge']) || isset($data['montantAvance']) ||
                      ($typeFromParam === 'Congé');
            
            // Permettre les deux à true en même temps (Prime + Congé)
            $submission->setIsPrime($isPrime);
            $submission->setIsConge($isConge);
            
            // 4. Montant calculé (OBLIGATOIRE - NOT NULL dans la BDD)
            $submission->setMontantCalcule('0.00');

            // Traitement selon les booléens isPrime et isConge
            // Si le type est spécifié (Prime ou Congé), créer immédiatement l'entité correspondante
            if ($submission->isPrime()) {
                // Créer une entité Prime vide si le type est Prime (les données seront ajoutées plus tard)
            $this->handlePrimeSubmission($submission, $data);
            }
            if ($submission->isConge()) {
                // Créer une entité Conge vide si le type est Congé (les données seront ajoutées plus tard)
            $this->handleCongeSubmission($submission, $data);
        }

            // Valider l'entité AVANT de persister
        $errors = $this->validator->validate($submission);
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

            // Persister et sauvegarder avec gestion d'erreur robuste
            try {
        $this->em->persist($submission);
                
                // Persister aussi Prime et Conge si elles existent
                if ($submission->getPrime()) {
                    $this->em->persist($submission->getPrime());
                }
                if ($submission->getConge()) {
                    $this->em->persist($submission->getConge());
                }
                
        $this->em->flush();
            } catch (\Exception $e) {
                // Logger l'erreur complète pour le débogage
                error_log('EVP Submission Error: ' . $e->getMessage());
                error_log('Stack trace: ' . $e->getTraceAsString());
                
                // Vérifier le type d'erreur
                $errorMessage = $e->getMessage();
                $errorCode = Response::HTTP_INTERNAL_SERVER_ERROR;
                
                if (strpos($errorMessage, 'NOT NULL') !== false || strpos($errorMessage, 'null value') !== false) {
                    $errorCode = Response::HTTP_BAD_REQUEST;
                    $errorMessage = 'Un champ obligatoire est manquant: ' . $errorMessage;
                } elseif (strpos($errorMessage, 'UNIQUE') !== false || strpos($errorMessage, 'duplicate') !== false) {
                    $errorCode = Response::HTTP_CONFLICT;
                    $errorMessage = 'Entrée en double: ' . $errorMessage;
                }
                
                return new JsonResponse([
                    'error' => 'Database error',
                    'message' => $errorMessage,
                    'type' => get_class($e)
                ], $errorCode);
            }

            // Construire manuellement les données pour éviter les références circulaires
            $employee = $submission->getEmployee();
            $employeeData = null;
            if ($employee) {
                $employeeData = [
                    'id' => $employee->getId(),
                    'matricule' => $employee->getMatricule(),
                    'nom' => $employee->getNom(),
                    'prenom' => $employee->getPrenom(),
                    'poste' => $employee->getPoste(),
                    'service' => $employee->getService(),
                    'division' => $employee->getDivision(),
                ];
            }
            
            $prime = $submission->getPrime();
            $conge = $submission->getConge();
            
            // Construire les données Prime si présentes
            $primeData = null;
            if ($prime) {
                $primeData = [
                    'id' => $prime->getId(),
                    'tauxMonetaire' => $prime->getTauxMonetaire(),
                    'groupe' => $prime->getGroupe(),
                    'nombrePostes' => $prime->getNombrePostes(),
                    'scoreEquipe' => $prime->getScoreEquipe(),
                    'noteHierarchique' => $prime->getNoteHierarchique(),
                    'scoreCollectif' => $prime->getScoreCollectif(),
                    'montantCalcule' => $prime->getMontantCalcule(),
                    'statut' => $prime->getStatut() ?? 'En attente',
                    'submittedAt' => $prime->getSubmittedAt() ? $prime->getSubmittedAt()->format(\DateTimeImmutable::ATOM) : null,
                    'commentaire' => $prime->getCommentaire(),
                ];
            }
            
            // Construire les données Conge si présentes
            $congeData = null;
            if ($conge) {
                $congeData = [
                    'id' => $conge->getId(),
                    'dateDebut' => $conge->getDateDebut() ? $conge->getDateDebut()->format('Y-m-d') : null,
                    'dateFin' => $conge->getDateFin() ? $conge->getDateFin()->format('Y-m-d') : null,
                    'nombreJours' => $conge->getNombreJours(),
                    'tranche' => $conge->getTranche(),
                    'avanceSurConge' => $conge->isAvanceSurConge() ?? false,
                    'montantAvance' => $conge->getMontantAvance(),
                    'indemniteForfaitaire' => $conge->getIndemniteForfaitaire(),
                    'indemniteCalculee' => $conge->getIndemniteCalculee(),
                    'statut' => $conge->getStatut() ?? 'En attente',
                    'submittedAt' => $conge->getSubmittedAt() ? $conge->getSubmittedAt()->format(\DateTimeImmutable::ATOM) : null,
                    'commentaire' => $conge->getCommentaire(),
                ];
            }
            
            $responseData = [
                'id' => $submission->getId(),
                'employee' => $employeeData,
                'isPrime' => $submission->isPrime(),
                'isConge' => $submission->isConge(),
                'montantCalcule' => $submission->getMontantCalcule(),
                'indemniteCalculee' => $submission->getIndemniteCalculee(),
                'valideService' => $submission->isValideService(),
                'valideDivision' => $submission->isValideDivision(),
                // Entités Prime et Conge complètes
                'prime' => $primeData,
                'conge' => $congeData,
            ];
            
            return new JsonResponse($responseData, Response::HTTP_CREATED);
            
        } catch (\Exception $e) {
            // Catch-all pour les erreurs inattendues
            return new JsonResponse([
                'error' => 'Unexpected error',
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    private function handlePrimeSubmission(EVPSubmission $submission, array $data): void
    {
        // S'assurer que isPrime est à true
        $submission->setIsPrime(true);
        
        // Créer ou récupérer l'entité Prime
        $prime = $submission->getPrime();
        if (!$prime) {
            $prime = new Prime();
            $prime->setEvpSubmission($submission);
            $submission->setPrime($prime);
        }

        // Mettre à jour les champs (ignorer les valeurs vides)
        if (isset($data['tauxMonetaire']) && $data['tauxMonetaire'] !== '' && $data['tauxMonetaire'] !== null) {
            $prime->setTauxMonetaire($data['tauxMonetaire']);
        }
        if (isset($data['groupe']) && $data['groupe'] !== '' && $data['groupe'] !== null) {
            $prime->setGroupe((int) $data['groupe']);
        }
        if (isset($data['nombrePostes']) && $data['nombrePostes'] !== '' && $data['nombrePostes'] !== null) {
            $prime->setNombrePostes((int) $data['nombrePostes']);
        }
        if (isset($data['scoreEquipe']) && $data['scoreEquipe'] !== '' && $data['scoreEquipe'] !== null) {
            $prime->setScoreEquipe((int) $data['scoreEquipe']);
        }
        if (isset($data['noteHierarchique']) && $data['noteHierarchique'] !== '' && $data['noteHierarchique'] !== null) {
            $prime->setNoteHierarchique((int) $data['noteHierarchique']);
        }
        if (isset($data['scoreCollectif']) && $data['scoreCollectif'] !== '' && $data['scoreCollectif'] !== null) {
            $prime->setScoreCollectif((int) $data['scoreCollectif']);
        }

        // Le calcul du montant est fait automatiquement dans Prime::calculateMontant()
        $prime->calculateMontant();
    }

    private function handleCongeSubmission(EVPSubmission $submission, array $data): void
    {
        // S'assurer que isConge est à true
        $submission->setIsConge(true);
        
        // Créer ou récupérer l'entité Conge
        $conge = $submission->getConge();
        if (!$conge) {
            $conge = new Conge();
            $conge->setEvpSubmission($submission);
            $submission->setConge($conge);
        }

        // Mettre à jour les dates (ignorer les valeurs vides)
        if (isset($data['dateDebut']) && $data['dateDebut'] !== '' && $data['dateDebut'] !== null) {
            try {
                $dateDebut = new \DateTime($data['dateDebut']);
                $conge->setDateDebut($dateDebut);
            } catch (\Exception $e) {
                error_log('Erreur parsing dateDebut: ' . $e->getMessage());
            }
        }
        if (isset($data['dateFin']) && $data['dateFin'] !== '' && $data['dateFin'] !== null) {
            try {
                $dateFin = new \DateTime($data['dateFin']);
                $conge->setDateFin($dateFin);
            } catch (\Exception $e) {
                error_log('Erreur parsing dateFin: ' . $e->getMessage());
            }
        }

        // Mettre à jour les autres champs (ignorer les valeurs vides)
        if (isset($data['tranche']) && $data['tranche'] !== '' && $data['tranche'] !== null) {
            $conge->setTranche((int) $data['tranche']);
        }
        if (isset($data['avanceSurConge'])) {
            $conge->setAvanceSurConge((bool) $data['avanceSurConge']);
        }
        if (isset($data['montantAvance']) && $data['montantAvance'] !== '' && $data['montantAvance'] !== null) {
            $conge->setMontantAvance($data['montantAvance']);
        }
        if (isset($data['indemniteForfaitaire']) && $data['indemniteForfaitaire'] !== '' && $data['indemniteForfaitaire'] !== null) {
            $conge->setIndemniteForfaitaire($data['indemniteForfaitaire']);
        }

        // Le calcul du nombre de jours et de l'indemnité est fait automatiquement dans Conge
        $conge->calculateNombreJours();
        $conge->calculateIndemnite();
    }

    #[Route('/submissions/{id}', name: 'update', methods: ['PUT'])]
    #[IsGranted('ROLE_GESTIONNAIRE')]
    public function update(int $id, Request $request): JsonResponse
    {
        try {
            // Vérifier l'authentification
            $user = $this->getUser();
            if (!$user instanceof User) {
                return new JsonResponse(['error' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
            }

            // Récupérer la soumission existante
            $submission = $this->evpRepository->find($id);
            if (!$submission) {
                return new JsonResponse(['error' => 'Submission not found'], Response::HTTP_NOT_FOUND);
            }

            // Vérifier que l'utilisateur a le droit de modifier cette soumission
            if ($submission->getSubmittedBy() !== $user && !in_array('ROLE_ADMIN', $user->getRoles())) {
                return new JsonResponse(['error' => 'Unauthorized'], Response::HTTP_FORBIDDEN);
            }

            // Parser les données JSON
            $data = json_decode($request->getContent(), true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                return new JsonResponse(['error' => 'Invalid JSON: ' . json_last_error_msg()], Response::HTTP_BAD_REQUEST);
            }
            
            // Log pour débogage
            error_log('EVP Update - Received data: ' . json_encode($data));

            // Mettre à jour valideService et valideDivision si fournis
            if (isset($data['valideService'])) {
                $submission->setValideService((bool) $data['valideService']);
            }
            if (isset($data['valideDivision'])) {
                $submission->setValideDivision((bool) $data['valideDivision']);
            }
            
            // Déterminer le type de soumission via les booléens
            // IMPORTANT: Un employé peut avoir à la fois une Prime ET un Congé
            
            // Gérer les données imbriquées dans 'prime' ou 'conge'
            $primeData = $data['prime'] ?? [];
            $congeData = $data['conge'] ?? [];
            
            // Si des données Prime sont fournies (directement ou imbriquées), mettre isPrime à true
            // Ne pas considérer statut, submittedAt, commentaire comme des données Prime
            $hasPrimeData = isset($data['tauxMonetaire']) || isset($data['nombrePostes']) || isset($data['scoreEquipe']) ||
                           isset($data['groupe']) || isset($data['noteHierarchique']) || isset($data['scoreCollectif']) ||
                           (isset($data['type']) && $data['type'] === 'Prime') ||
                           (isset($primeData['tauxMonetaire']) || isset($primeData['nombrePostes']) || isset($primeData['scoreEquipe']) ||
                            isset($primeData['groupe']) || isset($primeData['noteHierarchique']) || isset($primeData['scoreCollectif']));
            
            // Si des données Congé sont fournies (directement ou imbriquées), mettre isConge à true
            // Ne pas considérer statut, submittedAt, commentaire comme des données Conge
            $hasCongeData = isset($data['dateDebut']) || isset($data['dateFin']) || isset($data['indemniteForfaitaire']) ||
                           isset($data['tranche']) || isset($data['avanceSurConge']) || isset($data['montantAvance']) ||
                           (isset($data['type']) && $data['type'] === 'Congé') ||
                           (isset($congeData['dateDebut']) || isset($congeData['dateFin']) || isset($congeData['indemniteForfaitaire']) ||
                            isset($congeData['tranche']) || isset($congeData['avanceSurConge']) || isset($congeData['montantAvance']));
            
            // Mettre à jour les booléens indépendamment (peuvent être tous les deux true)
            if ($hasPrimeData) {
                $submission->setIsPrime(true);
            }
            if ($hasCongeData) {
                $submission->setIsConge(true);
            }

            // Traitement selon les booléens (peut traiter les deux si nécessaire)
            // Ne traiter les données Prime que s'il y a vraiment des données Prime (pas seulement statut/submittedAt)
            if ($hasPrimeData) {
                $mergedPrimeData = array_merge($data, $primeData);
                // Exclure les champs qui ne sont pas des champs Prime
                unset($mergedPrimeData['statut'], $mergedPrimeData['submittedAt'], $mergedPrimeData['commentaire']);
                $this->handlePrimeSubmission($submission, $mergedPrimeData);
            }
            // Ne traiter les données Conge que s'il y a vraiment des données Conge (pas seulement statut/submittedAt)
            if ($hasCongeData) {
                $mergedCongeData = array_merge($data, $congeData);
                // Exclure les champs qui ne sont pas des champs Conge
                unset($mergedCongeData['statut'], $mergedCongeData['submittedAt'], $mergedCongeData['commentaire']);
                $this->handleCongeSubmission($submission, $mergedCongeData);
            }
            
            // Mettre à jour le statut et submittedAt dans Prime/Conge si fourni
            // Gérer le cas où les données sont imbriquées dans 'prime' ou 'conge'
            if (isset($data['prime']['statut'])) {
                // S'assurer que l'entité Prime existe (elle doit exister si on soumet)
                if ($submission->isPrime()) {
                    if (!$submission->getPrime()) {
                        // Si l'entité Prime n'existe pas, c'est une erreur - on ne peut pas soumettre sans données Prime
                        return new JsonResponse([
                            'error' => 'Prime entity not found',
                            'message' => 'Cannot submit Prime without Prime data. Please add Prime data first.'
                        ], Response::HTTP_BAD_REQUEST);
                    }
                    $submission->getPrime()->setStatut($data['prime']['statut']);
                    if ($data['prime']['statut'] === 'Soumis' || $data['prime']['statut'] === 'Modifié') {
                        if (isset($data['prime']['submittedAt']) && !empty($data['prime']['submittedAt'])) {
                            try {
                                // Le frontend envoie une date ISO string, on la convertit en DateTimeImmutable
                                $submittedAt = \DateTimeImmutable::createFromFormat(\DateTimeImmutable::ATOM, $data['prime']['submittedAt']);
                                if ($submittedAt === false) {
                                    // Essayer un autre format si ATOM ne fonctionne pas
                                    $submittedAt = new \DateTimeImmutable($data['prime']['submittedAt']);
                                }
                                $submission->getPrime()->setSubmittedAt($submittedAt);
                            } catch (\Exception $e) {
                                // Si la date est invalide, utiliser la date actuelle
                                error_log('Erreur parsing date Prime: ' . $e->getMessage());
                                $submission->getPrime()->setSubmittedAt(new \DateTimeImmutable());
                            }
                        } else {
                            $submission->getPrime()->setSubmittedAt(new \DateTimeImmutable());
                        }
                    }
                    // Gérer le commentaire si fourni (peut être null pour supprimer)
                    if (array_key_exists('commentaire', $data['prime'])) {
                        $submission->getPrime()->setCommentaire($data['prime']['commentaire']);
                    }
                }
            } elseif (isset($data['statut']) && $submission->isPrime() && $submission->getPrime()) {
                // Compatibilité avec l'ancien format
                $submission->getPrime()->setStatut($data['statut']);
                if ($data['statut'] === 'Soumis') {
                    $submission->getPrime()->setSubmittedAt(new \DateTimeImmutable());
                }
            }
            
            if (isset($data['conge']['statut'])) {
                // S'assurer que l'entité Conge existe (elle doit exister si on soumet)
                if ($submission->isConge()) {
                    if (!$submission->getConge()) {
                        // Si l'entité Conge n'existe pas, c'est une erreur - on ne peut pas soumettre sans données Conge
                        return new JsonResponse([
                            'error' => 'Conge entity not found',
                            'message' => 'Cannot submit Conge without Conge data. Please add Conge data first.'
                        ], Response::HTTP_BAD_REQUEST);
                    }
                    $submission->getConge()->setStatut($data['conge']['statut']);
                    if ($data['conge']['statut'] === 'Soumis' || $data['conge']['statut'] === 'Modifié') {
                        if (isset($data['conge']['submittedAt']) && !empty($data['conge']['submittedAt'])) {
                            try {
                                // Le frontend envoie une date ISO string, on la convertit en DateTimeImmutable
                                $submittedAt = \DateTimeImmutable::createFromFormat(\DateTimeImmutable::ATOM, $data['conge']['submittedAt']);
                                if ($submittedAt === false) {
                                    // Essayer un autre format si ATOM ne fonctionne pas
                                    $submittedAt = new \DateTimeImmutable($data['conge']['submittedAt']);
                                }
                                $submission->getConge()->setSubmittedAt($submittedAt);
                            } catch (\Exception $e) {
                                // Si la date est invalide, utiliser la date actuelle
                                error_log('Erreur parsing date Conge: ' . $e->getMessage());
                                $submission->getConge()->setSubmittedAt(new \DateTimeImmutable());
                            }
                        } else {
                            $submission->getConge()->setSubmittedAt(new \DateTimeImmutable());
                        }
                    }
                    // Gérer le commentaire si fourni (peut être null pour supprimer)
                    if (array_key_exists('commentaire', $data['conge'])) {
                        $submission->getConge()->setCommentaire($data['conge']['commentaire']);
                    }
                }
            } elseif (isset($data['statut']) && $submission->isConge() && $submission->getConge()) {
                // Compatibilité avec l'ancien format
                $submission->getConge()->setStatut($data['statut']);
                if ($data['statut'] === 'Soumis') {
                    $submission->getConge()->setSubmittedAt(new \DateTimeImmutable());
                }
            }

            // Valider l'entité
            $errors = $this->validator->validate($submission);
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

            // Sauvegarder
            try {
                // Persister aussi Prime et Conge si elles existent
                if ($submission->getPrime()) {
                    $this->em->persist($submission->getPrime());
                }
                if ($submission->getConge()) {
                    $this->em->persist($submission->getConge());
                }
                
                $this->em->flush();
            } catch (\Exception $e) {
                error_log('EVP Update Error: ' . $e->getMessage());
                error_log('Stack trace: ' . $e->getTraceAsString());
                
                $errorMessage = $e->getMessage();
                $errorCode = Response::HTTP_INTERNAL_SERVER_ERROR;
                
                if (strpos($errorMessage, 'NOT NULL') !== false || strpos($errorMessage, 'null value') !== false) {
                    $errorCode = Response::HTTP_BAD_REQUEST;
                    $errorMessage = 'Un champ obligatoire est manquant: ' . $errorMessage;
                }
                
                return new JsonResponse([
                    'error' => 'Database error',
                    'message' => $errorMessage,
                    'details' => $e->getTraceAsString()
                ], $errorCode);
            }

            // Construire la réponse manuellement pour éviter les références circulaires
            $employee = $submission->getEmployee();
            $submittedBy = $submission->getSubmittedBy();
            $prime = $submission->getPrime();
            $conge = $submission->getConge();
            
            // Construire les données Prime si présentes
            $primeData = null;
            if ($prime) {
                $primeData = [
                    'id' => $prime->getId(),
                    'tauxMonetaire' => $prime->getTauxMonetaire(),
                    'groupe' => $prime->getGroupe(),
                    'nombrePostes' => $prime->getNombrePostes(),
                    'scoreEquipe' => $prime->getScoreEquipe(),
                    'noteHierarchique' => $prime->getNoteHierarchique(),
                    'scoreCollectif' => $prime->getScoreCollectif(),
                    'montantCalcule' => $prime->getMontantCalcule(),
                    'statut' => $prime->getStatut() ?? 'En attente',
                    'submittedAt' => $prime->getSubmittedAt() ? $prime->getSubmittedAt()->format(\DateTimeImmutable::ATOM) : null,
                    'commentaire' => $prime->getCommentaire(),
                ];
            }
            
            // Construire les données Conge si présentes
            $congeData = null;
            if ($conge) {
                $congeData = [
                    'id' => $conge->getId(),
                    'dateDebut' => $conge->getDateDebut() ? $conge->getDateDebut()->format('Y-m-d') : null,
                    'dateFin' => $conge->getDateFin() ? $conge->getDateFin()->format('Y-m-d') : null,
                    'nombreJours' => $conge->getNombreJours(),
                    'tranche' => $conge->getTranche(),
                    'avanceSurConge' => $conge->isAvanceSurConge() ?? false,
                    'montantAvance' => $conge->getMontantAvance(),
                    'indemniteForfaitaire' => $conge->getIndemniteForfaitaire(),
                    'indemniteCalculee' => $conge->getIndemniteCalculee(),
                    'statut' => $conge->getStatut() ?? 'En attente',
                    'submittedAt' => $conge->getSubmittedAt() ? $conge->getSubmittedAt()->format(\DateTimeImmutable::ATOM) : null,
                    'commentaire' => $conge->getCommentaire(),
                ];
            }

            $responseData = [
                'id' => $submission->getId(),
                'employee' => $employee ? [
                    'id' => $employee->getId(),
                    'matricule' => $employee->getMatricule(),
                    'nom' => $employee->getNom(),
                    'prenom' => $employee->getPrenom(),
                    'poste' => $employee->getPoste(),
                    'service' => $employee->getService(),
                    'division' => $employee->getDivision(),
                ] : null,
                'submittedBy' => $submittedBy ? [
                    'id' => $submittedBy->getId(),
                    'email' => $submittedBy->getEmail(),
                    'name' => $submittedBy->getName(),
                    'role' => $submittedBy->getRole(),
                ] : null,
                'isPrime' => $submission->isPrime(),
                'isConge' => $submission->isConge(),
                'montantCalcule' => $submission->getMontantCalcule(),
                'indemniteCalculee' => $submission->getIndemniteCalculee(),
                'valideService' => $submission->isValideService(),
                'valideDivision' => $submission->isValideDivision(),
                // Entités Prime et Conge complètes
                'prime' => $primeData,
                'conge' => $congeData,
            ];

            return new JsonResponse($responseData, Response::HTTP_OK);

        } catch (\Exception $e) {
            error_log('EVP Update Unexpected Error: ' . $e->getMessage());
            error_log('Stack trace: ' . $e->getTraceAsString());
            return new JsonResponse([
                'error' => 'Unexpected error',
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/submissions/{id}', name: 'delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_GESTIONNAIRE')]
    public function delete(int $id, Request $request): JsonResponse
    {
        try {
            // Vérifier l'authentification
            $user = $this->getUser();
            if (!$user instanceof User) {
                return new JsonResponse(['error' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
            }

            // Récupérer la soumission existante
            $submission = $this->evpRepository->find($id);
            if (!$submission) {
                return new JsonResponse(['error' => 'Submission not found'], Response::HTTP_NOT_FOUND);
            }

            // Vérifier que l'utilisateur a le droit de supprimer cette soumission
            if ($submission->getSubmittedBy() !== $user && !in_array('ROLE_ADMIN', $user->getRoles())) {
                return new JsonResponse(['error' => 'Unauthorized'], Response::HTTP_FORBIDDEN);
            }

            // Parser les données JSON pour obtenir le type à supprimer
            $data = json_decode($request->getContent(), true);
            $type = $data['type'] ?? null;

            if (!$type || !in_array($type, ['Prime', 'Congé'])) {
                return new JsonResponse(['error' => 'Type must be "Prime" or "Congé"'], Response::HTTP_BAD_REQUEST);
            }

            // Récupérer l'état actuel AVANT la suppression pour la logique de décision
            $wasPrime = $submission->isPrime();
            $wasConge = $submission->isConge();
            
            error_log("Delete - Before: isPrime={$wasPrime}, isConge={$wasConge}, type={$type}");

            // Supprimer selon le type
            if ($type === 'Prime') {
                // Supprimer l'entité Prime si elle existe
                if ($submission->getPrime()) {
                    $primeToRemove = $submission->getPrime();
                    // D'abord, détacher la relation pour éviter les cascades
                    $submission->setPrime(null);
                    // Ensuite, supprimer l'entité Prime
                    $this->em->remove($primeToRemove);
                }
                // Mettre isPrime à false
                $submission->setIsPrime(false);
            } elseif ($type === 'Congé') {
                // Supprimer l'entité Conge si elle existe
                if ($submission->getConge()) {
                    $congeToRemove = $submission->getConge();
                    // D'abord, détacher la relation pour éviter les cascades
                    $submission->setConge(null);
                    // Ensuite, supprimer l'entité Conge
                    $this->em->remove($congeToRemove);
                }
                // Mettre isConge à false
                $submission->setIsConge(false);
            }

            // Vérifier l'état APRÈS la suppression
            $isPrimeNow = $submission->isPrime();
            $isCongeNow = $submission->isConge();
            
            error_log("Delete - After: isPrime={$isPrimeNow}, isConge={$isCongeNow}");

            // IMPORTANT: Ne supprimer l'entité EVPSubmission QUE si les deux flags sont false
            // Si l'un des deux est encore true, on garde l'entité EVPSubmission
            if (!$isPrimeNow && !$isCongeNow) {
                // Les deux sont false, on peut supprimer complètement l'entité EVPSubmission
                error_log("Delete - Both flags are false, deleting EVPSubmission");
                $this->em->remove($submission);
                $this->em->flush();
                return new JsonResponse(['message' => 'Submission deleted successfully'], Response::HTTP_OK);
            } else {
                // Au moins un flag est encore true, on garde l'entité EVPSubmission
                // On sauvegarde seulement les changements (suppression de Prime/Conge et mise à jour des flags)
                error_log("Delete - At least one flag is true, keeping EVPSubmission. isPrime={$isPrimeNow}, isConge={$isCongeNow}");
                $this->em->flush();
                return new JsonResponse([
                    'message' => 'Type deleted successfully',
                    'isPrime' => $isPrimeNow,
                    'isConge' => $isCongeNow
                ], Response::HTTP_OK);
            }

        } catch (\Exception $e) {
            error_log('EVP Delete Error: ' . $e->getMessage());
            error_log('Stack trace: ' . $e->getTraceAsString());
            return new JsonResponse([
                'error' => 'Unexpected error',
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Valider ou rejeter une soumission EVP (par Responsable Service ou Division)
     */
    #[Route('/submissions/{id}/validate', name: 'validate', methods: ['PUT'])]
    public function validateSubmission(int $id, Request $request): JsonResponse
    {
        try {
            $user = $this->getUser();
            if (!$user instanceof User) {
                return new JsonResponse(['error' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
            }

            // Vérifier que l'utilisateur a le bon rôle
            $userRoles = $user->getRoles();
            $isResponsableService = in_array('ROLE_RESPONSABLE_SERVICE', $userRoles);
            $isResponsableDivision = in_array('ROLE_RESPONSABLE_DIVISION', $userRoles);
            
            if (!$isResponsableService && !$isResponsableDivision) {
                return new JsonResponse(['error' => 'Access denied. Required role: ROLE_RESPONSABLE_SERVICE or ROLE_RESPONSABLE_DIVISION'], Response::HTTP_FORBIDDEN);
            }

            $submission = $this->evpRepository->find($id);
            if (!$submission) {
                return new JsonResponse(['error' => 'Submission not found'], Response::HTTP_NOT_FOUND);
            }

            $data = json_decode($request->getContent(), true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                return new JsonResponse(['error' => 'Invalid JSON: ' . json_last_error_msg()], Response::HTTP_BAD_REQUEST);
            }

            $action = $data['action'] ?? null; // 'approve' ou 'reject'
            $niveau = $data['niveau'] ?? ($isResponsableService ? 'service' : 'division'); // 'service' ou 'division'
            $commentaire = $data['commentaire'] ?? null;
            $type = $data['type'] ?? null; // 'Prime' ou 'Congé' - optionnel, si fourni, valide uniquement ce type

            // Vérifier que le niveau correspond au rôle de l'utilisateur
            if ($niveau === 'service' && !$isResponsableService) {
                return new JsonResponse(['error' => 'Only ROLE_RESPONSABLE_SERVICE can validate at service level'], Response::HTTP_FORBIDDEN);
            }
            if ($niveau === 'division' && !$isResponsableDivision) {
                return new JsonResponse(['error' => 'Only ROLE_RESPONSABLE_DIVISION can validate at division level'], Response::HTTP_FORBIDDEN);
            }

            if (!$action || !in_array($action, ['approve', 'reject'])) {
                return new JsonResponse(['error' => 'Action must be "approve" or "reject"'], Response::HTTP_BAD_REQUEST);
            }

            if ($action === 'reject' && empty($commentaire)) {
                return new JsonResponse(['error' => 'Commentaire is required for rejection'], Response::HTTP_BAD_REQUEST);
            }

            error_log("Validation EVP - ID: {$id}, Action: {$action}, Niveau: {$niveau}, Type: " . ($type ?? 'all'));

            if ($niveau === 'service') {
                // Validation par le Responsable Service
                if ($action === 'approve') {
                    // Si un type spécifique est fourni, valider uniquement ce type
                    if ($type === 'Prime' && $submission->isPrime() && $submission->getPrime()) {
                        $submission->getPrime()->setStatut('Validé Service');
                        // Stocker le commentaire optionnel si fourni
                        if (!empty($commentaire)) {
                            $submission->getPrime()->setCommentaire($commentaire);
                        }
                        // Mettre valideService à true seulement si au moins un type est validé
                        $submission->setValideService(true);
                    } elseif ($type === 'Congé' && $submission->isConge() && $submission->getConge()) {
                        $submission->getConge()->setStatut('Validé Service');
                        // Stocker le commentaire optionnel si fourni
                        if (!empty($commentaire)) {
                            $submission->getConge()->setCommentaire($commentaire);
                        }
                        $submission->setValideService(true);
                    } elseif (!$type) {
                        // Si aucun type n'est spécifié, valider tous les types présents
                        $submission->setValideService(true);
                        if ($submission->isPrime() && $submission->getPrime()) {
                            $submission->getPrime()->setStatut('Validé Service');
                            // Stocker le commentaire optionnel si fourni
                            if (!empty($commentaire)) {
                                $submission->getPrime()->setCommentaire($commentaire);
                            }
                        }
                        if ($submission->isConge() && $submission->getConge()) {
                            $submission->getConge()->setStatut('Validé Service');
                            // Stocker le commentaire optionnel si fourni
                            if (!empty($commentaire)) {
                                $submission->getConge()->setCommentaire($commentaire);
                            }
                        }
                    }
                } else {
                    // Rejet
                    // Si un type spécifique est fourni, rejeter uniquement ce type
                    if ($type === 'Prime' && $submission->isPrime() && $submission->getPrime()) {
                        $submission->getPrime()->setStatut('Rejeté');
                        $submission->getPrime()->setCommentaire($commentaire);
                        // Si on rejette, on peut mettre valideService à false seulement si tous les types sont rejetés
                        // Pour l'instant, on garde la logique simple
                    } elseif ($type === 'Congé' && $submission->isConge() && $submission->getConge()) {
                        $submission->getConge()->setStatut('Rejeté');
                        $submission->getConge()->setCommentaire($commentaire);
                    } elseif (!$type) {
                        // Si aucun type n'est spécifié, rejeter tous les types présents
                        $submission->setValideService(false);
                        if ($submission->isPrime() && $submission->getPrime()) {
                            $submission->getPrime()->setStatut('Rejeté');
                            $submission->getPrime()->setCommentaire($commentaire);
                        }
                        if ($submission->isConge() && $submission->getConge()) {
                            $submission->getConge()->setStatut('Rejeté');
                            $submission->getConge()->setCommentaire($commentaire);
                        }
                    }
                }
            } elseif ($niveau === 'division') {
                // Validation par le Responsable Division
                if ($action === 'approve') {
                    // Si un type spécifique est fourni, valider uniquement ce type
                    if ($type === 'Prime' && $submission->isPrime() && $submission->getPrime()) {
                        $submission->getPrime()->setStatut('Validé Division');
                        // Stocker le commentaire optionnel si fourni
                        if (!empty($commentaire)) {
                            $submission->getPrime()->setCommentaire($commentaire);
                        }
                        $submission->setValideDivision(true);
                    } elseif ($type === 'Congé' && $submission->isConge() && $submission->getConge()) {
                        $submission->getConge()->setStatut('Validé Division');
                        // Stocker le commentaire optionnel si fourni
                        if (!empty($commentaire)) {
                            $submission->getConge()->setCommentaire($commentaire);
                        }
                        $submission->setValideDivision(true);
                    } elseif (!$type) {
                        // Si aucun type n'est spécifié, valider tous les types présents
                        $submission->setValideDivision(true);
                        if ($submission->isPrime() && $submission->getPrime()) {
                            $submission->getPrime()->setStatut('Validé Division');
                            // Stocker le commentaire optionnel si fourni
                            if (!empty($commentaire)) {
                                $submission->getPrime()->setCommentaire($commentaire);
                            }
                        }
                        if ($submission->isConge() && $submission->getConge()) {
                            $submission->getConge()->setStatut('Validé Division');
                            // Stocker le commentaire optionnel si fourni
                            if (!empty($commentaire)) {
                                $submission->getConge()->setCommentaire($commentaire);
                            }
                        }
                    }
                } else {
                    // Rejet par la division - la demande doit revenir chez le respo service
                    // valideService reste à true car le service a déjà validé
                    // Si un type spécifique est fourni, rejeter uniquement ce type
                    if ($type === 'Prime' && $submission->isPrime() && $submission->getPrime()) {
                        $submission->getPrime()->setStatut('Rejeté');
                        $submission->getPrime()->setCommentaire($commentaire);
                        // Ne pas mettre valideDivision à false car on veut que ça revienne chez le respo service
                    } elseif ($type === 'Congé' && $submission->isConge() && $submission->getConge()) {
                        $submission->getConge()->setStatut('Rejeté');
                        $submission->getConge()->setCommentaire($commentaire);
                        // Ne pas mettre valideDivision à false car on veut que ça revienne chez le respo service
                    } elseif (!$type) {
                        // Si aucun type n'est spécifié, rejeter tous les types présents
                        // Ne pas mettre valideDivision à false car on veut que ça revienne chez le respo service
                        if ($submission->isPrime() && $submission->getPrime()) {
                            $submission->getPrime()->setStatut('Rejeté');
                            $submission->getPrime()->setCommentaire($commentaire);
                        }
                        if ($submission->isConge() && $submission->getConge()) {
                            $submission->getConge()->setStatut('Rejeté');
                            $submission->getConge()->setCommentaire($commentaire);
                        }
                    }
                }
            }

            // Valider l'entité
            $errors = $this->validator->validate($submission);
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

            // Sauvegarder
            try {
                // Persister aussi Prime et Conge si elles existent
                if ($submission->getPrime()) {
                    $this->em->persist($submission->getPrime());
                }
                if ($submission->getConge()) {
                    $this->em->persist($submission->getConge());
                }
                
                $this->em->flush();
            } catch (\Exception $e) {
                error_log('EVP Validate Error: ' . $e->getMessage());
                error_log('Stack trace: ' . $e->getTraceAsString());
                
                return new JsonResponse([
                    'error' => 'Database error',
                    'message' => $e->getMessage()
                ], Response::HTTP_INTERNAL_SERVER_ERROR);
            }

            // Construire la réponse manuellement
            $employee = $submission->getEmployee();
            $submittedBy = $submission->getSubmittedBy();
            $prime = $submission->getPrime();
            $conge = $submission->getConge();

            $primeData = null;
            if ($prime) {
                $primeData = [
                    'id' => $prime->getId(),
                    'tauxMonetaire' => $prime->getTauxMonetaire(),
                    'groupe' => $prime->getGroupe(),
                    'nombrePostes' => $prime->getNombrePostes(),
                    'scoreEquipe' => $prime->getScoreEquipe(),
                    'noteHierarchique' => $prime->getNoteHierarchique(),
                    'scoreCollectif' => $prime->getScoreCollectif(),
                    'montantCalcule' => $prime->getMontantCalcule(),
                    'statut' => $prime->getStatut() ?? 'En attente',
                    'submittedAt' => $prime->getSubmittedAt() ? $prime->getSubmittedAt()->format(\DateTimeImmutable::ATOM) : null,
                    'commentaire' => $prime->getCommentaire(),
                ];
            }

            $congeData = null;
            if ($conge) {
                $congeData = [
                    'id' => $conge->getId(),
                    'dateDebut' => $conge->getDateDebut() ? $conge->getDateDebut()->format('Y-m-d') : null,
                    'dateFin' => $conge->getDateFin() ? $conge->getDateFin()->format('Y-m-d') : null,
                    'nombreJours' => $conge->getNombreJours(),
                    'tranche' => $conge->getTranche(),
                    'avanceSurConge' => $conge->isAvanceSurConge() ?? false,
                    'montantAvance' => $conge->getMontantAvance(),
                    'indemniteForfaitaire' => $conge->getIndemniteForfaitaire(),
                    'indemniteCalculee' => $conge->getIndemniteCalculee(),
                    'statut' => $conge->getStatut() ?? 'En attente',
                    'submittedAt' => $conge->getSubmittedAt() ? $conge->getSubmittedAt()->format(\DateTimeImmutable::ATOM) : null,
                    'commentaire' => $conge->getCommentaire(),
                ];
            }

            $responseData = [
                'id' => $submission->getId(),
                'employee' => $employee ? [
                    'id' => $employee->getId(),
                    'matricule' => $employee->getMatricule(),
                    'nom' => $employee->getNom(),
                    'prenom' => $employee->getPrenom(),
                    'poste' => $employee->getPoste(),
                    'service' => $employee->getService(),
                    'division' => $employee->getDivision(),
                ] : null,
                'submittedBy' => $submittedBy ? [
                    'id' => $submittedBy->getId(),
                    'email' => $submittedBy->getEmail(),
                    'name' => $submittedBy->getName(),
                    'role' => $submittedBy->getRole(),
                ] : null,
                'isPrime' => $submission->isPrime(),
                'isConge' => $submission->isConge(),
                'montantCalcule' => $submission->getMontantCalcule(),
                'indemniteCalculee' => $submission->getIndemniteCalculee(),
                'valideService' => $submission->isValideService(),
                'valideDivision' => $submission->isValideDivision(),
                'prime' => $primeData,
                'conge' => $congeData,
            ];

            return new JsonResponse($responseData, Response::HTTP_OK);

        } catch (\Exception $e) {
            error_log('EVP Validate Unexpected Error: ' . $e->getMessage());
            error_log('Stack trace: ' . $e->getTraceAsString());
            return new JsonResponse([
                'error' => 'Unexpected error',
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}








