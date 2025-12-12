<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api', name: 'api_')]
class AuthController extends AbstractController
{
    #[Route('/login', name: 'login', methods: ['POST', 'OPTIONS'])]
    public function login(Request $request, UserRepository $userRepository, UserPasswordHasherInterface $passwordHasher): JsonResponse
    {
        // 1. GESTION CORS (OPTIONS)
        if ($request->getMethod() === 'OPTIONS') {
            $response = new JsonResponse([], Response::HTTP_NO_CONTENT);
            $origin = $request->headers->get('Origin') ?: '*';
            $response->headers->set('Access-Control-Allow-Origin', $origin);
            $response->headers->set('Access-Control-Allow-Methods', 'POST, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            $response->headers->set('Access-Control-Allow-Credentials', 'true');
            return $response;
        }

        // 2. LOGIQUE DE CONNEXION (POST)
        $data = json_decode($request->getContent(), true);
        $email = $data['email'] ?? '';
        $password = $data['password'] ?? '';

        if (empty($email) || empty($password)) {
            $response = new JsonResponse(['message' => 'Email et mot de passe requis'], Response::HTTP_BAD_REQUEST);
            $origin = $request->headers->get('Origin') ?: '*';
            $response->headers->set('Access-Control-Allow-Origin', $origin);
            $response->headers->set('Access-Control-Allow-Credentials', 'true');
            return $response;
        }

        try {
            // Chercher l'utilisateur
            $user = $userRepository->findOneBy(['email' => $email]);
        } catch (\Exception $e) {
            // Erreur de base de données
            $response = new JsonResponse([
                'message' => 'Erreur de connexion à la base de données',
                'detail' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
            $origin = $request->headers->get('Origin') ?: '*';
            $response->headers->set('Access-Control-Allow-Origin', $origin);
            $response->headers->set('Access-Control-Allow-Credentials', 'true');
            return $response;
        }

        // Vérifier si l'user existe et si le mot de passe est bon
        if (!$user || !$passwordHasher->isPasswordValid($user, $password)) {
            $response = new JsonResponse(['message' => 'Email ou mot de passe incorrect'], Response::HTTP_UNAUTHORIZED);
            // Important : remettre les headers CORS même en cas d'erreur
            $origin = $request->headers->get('Origin') ?: '*';
            $response->headers->set('Access-Control-Allow-Origin', $origin);
            $response->headers->set('Access-Control-Allow-Credentials', 'true');
            return $response;
        }

        // 3. SUCCÈS - Préparer la réponse
        // Note : Adaptez les getters (getName, getRole) selon votre entité User.php
        // Si getName() n'existe pas, utilisez $user->getNom() . ' ' . $user->getPrenom()
        $userData = [
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            // J'utilise des valeurs sûres, vérifiez votre entité User pour les noms exacts
            'name' => method_exists($user, 'getName') ? $user->getName() : 'Utilisateur', 
            'role' => method_exists($user, 'getRole') ? $user->getRole() : ($user->getRoles()[0] ?? 'User'),
            'division' => method_exists($user, 'getDivision') ? $user->getDivision() : null,
        ];

        $response = new JsonResponse([
            'token' => 'fake-jwt-token-' . bin2hex(random_bytes(16)), // Token temporaire pour que le front fonctionne
            'user'  => $userData
        ]);

        // Ajouter les headers CORS à la réponse de succès
        $origin = $request->headers->get('Origin') ?: '*';
        $response->headers->set('Access-Control-Allow-Origin', $origin);
        $response->headers->set('Access-Control-Allow-Credentials', 'true');

        return $response;
    }

    #[Route('/me', name: 'me', methods: ['GET', 'OPTIONS'])]
    public function me(Request $request): JsonResponse
    {
        // GESTION CORS
        if ($request->getMethod() === 'OPTIONS') {
            $response = new JsonResponse([], Response::HTTP_NO_CONTENT);
            $response->headers->set('Access-Control-Allow-Origin', 'http://localhost:3000');
            $response->headers->set('Access-Control-Allow-Methods', 'GET, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            $response->headers->set('Access-Control-Allow-Credentials', 'true');
            return $response;
        }

        $user = $this->getUser();
        
        if (!$user instanceof User) {
            $response = new JsonResponse(['error' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
            $response->headers->set('Access-Control-Allow-Origin', 'http://localhost:3000');
            $response->headers->set('Access-Control-Allow-Credentials', 'true');
            return $response;
        }

        $response = new JsonResponse([
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'name' => method_exists($user, 'getName') ? $user->getName() : 'Utilisateur',
            'role' => method_exists($user, 'getRole') ? $user->getRole() : ($user->getRoles()[0] ?? 'User'),
            'division' => method_exists($user, 'getDivision') ? $user->getDivision() : null,
        ]);
        
        $response->headers->set('Access-Control-Allow-Origin', 'http://localhost:3000');
        $response->headers->set('Access-Control-Allow-Credentials', 'true');
        
        return $response;
    }
}