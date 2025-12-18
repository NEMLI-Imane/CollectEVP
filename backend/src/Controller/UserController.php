<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/users', name: 'api_users_')]
#[IsGranted('ROLE_ADMIN')]
class UserController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private SerializerInterface $serializer,
        private ValidatorInterface $validator,
        private UserRepository $userRepository,
        private UserPasswordHasherInterface $passwordHasher
    ) {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $users = $this->userRepository->findAll();
        
        $data = array_map(function (User $user) {
            return [
                'id' => $user->getId(),
                'name' => $user->getName(),
                'email' => $user->getEmail(),
                'role' => $user->getRole(),
                'division' => $user->getDivision(),
                'status' => $user->isActive() ? 'active' : 'inactive',
            ];
        }, $users);
        
        return new JsonResponse($data, Response::HTTP_OK);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        // Vérifier si l'email existe déjà
        $existingUser = $this->userRepository->findOneBy(['email' => $data['email'] ?? '']);
        if ($existingUser) {
            return new JsonResponse(['error' => 'Un utilisateur avec cet email existe déjà'], Response::HTTP_BAD_REQUEST);
        }

        $user = new User();
        $user->setEmail($data['email'] ?? '');
        $user->setName($data['name'] ?? '');
        $user->setRole($data['role'] ?? 'Gestionnaire');
        $user->setDivision($data['division'] ?? null);
        
        // Hash du mot de passe (par défaut: password123)
        $plainPassword = $data['password'] ?? 'password123';
        $hashedPassword = $this->passwordHasher->hashPassword($user, $plainPassword);
        $user->setPassword($hashedPassword);

        $errors = $this->validator->validate($user);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[] = $error->getMessage();
            }
            return new JsonResponse(['error' => implode(', ', $errorMessages)], Response::HTTP_BAD_REQUEST);
        }

        $this->em->persist($user);
        $this->em->flush();

        return new JsonResponse([
            'id' => $user->getId(),
            'name' => $user->getName(),
            'email' => $user->getEmail(),
            'role' => $user->getRole(),
            'division' => $user->getDivision(),
            'status' => $user->isActive() ? 'active' : 'inactive',
        ], Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $user = $this->userRepository->find($id);
        
        if (!$user) {
            return new JsonResponse(['error' => 'User not found'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['name'])) {
            $user->setName($data['name']);
        }
        if (isset($data['email'])) {
            // Vérifier si l'email existe déjà pour un autre utilisateur
            $existingUser = $this->userRepository->findOneBy(['email' => $data['email']]);
            if ($existingUser && $existingUser->getId() !== $id) {
                return new JsonResponse(['error' => 'Un utilisateur avec cet email existe déjà'], Response::HTTP_BAD_REQUEST);
            }
            $user->setEmail($data['email']);
        }
        if (isset($data['role'])) {
            $user->setRole($data['role']);
        }
        if (isset($data['division'])) {
            $user->setDivision($data['division']);
        }
        if (isset($data['status'])) {
            $user->setIsActive($data['status'] === 'active');
        }
        if (isset($data['password']) && !empty($data['password'])) {
            $hashedPassword = $this->passwordHasher->hashPassword($user, $data['password']);
            $user->setPassword($hashedPassword);
        }

        $user->setUpdatedAt(new \DateTimeImmutable());

        $errors = $this->validator->validate($user);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[] = $error->getMessage();
            }
            return new JsonResponse(['error' => implode(', ', $errorMessages)], Response::HTTP_BAD_REQUEST);
        }

        $this->em->flush();

        return new JsonResponse([
            'id' => $user->getId(),
            'name' => $user->getName(),
            'email' => $user->getEmail(),
            'role' => $user->getRole(),
            'division' => $user->getDivision(),
            'status' => $user->isActive() ? 'active' : 'inactive',
        ], Response::HTTP_OK);
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        $user = $this->userRepository->find($id);
        
        if (!$user) {
            return new JsonResponse(['error' => 'User not found'], Response::HTTP_NOT_FOUND);
        }

        // Ne pas permettre la suppression de l'utilisateur actuel
        $currentUser = $this->getUser();
        if ($currentUser instanceof User && $currentUser->getId() === $id) {
            return new JsonResponse(['error' => 'Vous ne pouvez pas supprimer votre propre compte'], Response::HTTP_BAD_REQUEST);
        }

        $this->em->remove($user);
        $this->em->flush();

        return new JsonResponse(['message' => 'User deleted successfully'], Response::HTTP_OK);
    }
}

