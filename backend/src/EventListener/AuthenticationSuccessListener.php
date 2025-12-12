<?php

namespace App\EventListener;

use App\Entity\User;
use Lexik\Bundle\JWTAuthenticationBundle\Event\AuthenticationSuccessEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Events;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class AuthenticationSuccessListener implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [
            Events::AUTHENTICATION_SUCCESS => 'onAuthenticationSuccess',
        ];
    }

    public function onAuthenticationSuccess(AuthenticationSuccessEvent $event): void
    {
        $user = $event->getUser();
        
        if (!$user instanceof User) {
            return;
        }

        $data = $event->getData();
        
        // Ajouter les informations utilisateur à la réponse
        $data['user'] = [
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'name' => $user->getName(),
            'role' => $user->getRole(),
            'division' => $user->getDivision(),
        ];

        $event->setData($data);
    }
}



