<?php

namespace App\Security;

use App\Entity\User;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Http\Authentication\AuthenticationSuccessHandlerInterface;

class JWTAuthenticationSuccessHandler implements AuthenticationSuccessHandlerInterface
{
    public function __construct(
        private JWTTokenManagerInterface $jwtManager
    ) {
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token): JsonResponse
    {
        $user = $token->getUser();

        if (!$user instanceof User) {
            $response = new JsonResponse(['error' => 'Invalid user'], 401);
            $response->headers->set('Access-Control-Allow-Origin', 'http://localhost:3000');
            return $response;
        }

        $jwtToken = $this->jwtManager->create($user);

        $response = new JsonResponse([
            'token' => $jwtToken,
            'user' => [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'name' => $user->getName(),
                'role' => $user->getRole(),
                'division' => $user->getDivision(),
            ],
        ]);
        
        $response->headers->set('Access-Control-Allow-Origin', 'http://localhost:3000');
        $response->headers->set('Access-Control-Allow-Credentials', 'true');
        
        return $response;
    }
}



