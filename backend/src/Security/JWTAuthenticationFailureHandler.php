<?php

namespace App\Security;

use Lexik\Bundle\JWTAuthenticationBundle\Response\JWTAuthenticationFailureResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Http\Authentication\AuthenticationFailureHandlerInterface;
use Symfony\Contracts\Translation\TranslatorInterface;

class JWTAuthenticationFailureHandler implements AuthenticationFailureHandlerInterface
{
    public function __construct(
        private ?TranslatorInterface $translator = null
    ) {
    }

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): Response
    {
        $errorMessage = 'Email ou mot de passe incorrect';
        
        // Utiliser le message de l'exception si disponible
        if ($exception->getMessage()) {
            $errorMessage = $exception->getMessage();
        }
        
        if ($this->translator) {
            $translatedMessage = $this->translator->trans($exception->getMessageKey(), $exception->getMessageData(), 'security');
            if ($translatedMessage !== $exception->getMessageKey()) {
                $errorMessage = $translatedMessage;
            }
        }

        $response = new JWTAuthenticationFailureResponse($errorMessage, 401);

        // Ajouter les headers CORS
        $response->headers->set('Access-Control-Allow-Origin', 'http://localhost:3000');
        $response->headers->set('Access-Control-Allow-Credentials', 'true');
        $response->headers->set('Access-Control-Allow-Methods', 'POST, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        return $response;
    }
}

