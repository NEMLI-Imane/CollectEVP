<?php

namespace App\EventListener;

use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTCreatedEvent;

class JWTCreatedListener
{
    public function onJWTCreated(JWTCreatedEvent $event)
    {
        $user = $event->getUser();
        $payload = $event->getData();
        
        $payload['id'] = $user->getId();
        $payload['email'] = $user->getUserIdentifier();
        $payload['name'] = method_exists($user, 'getName') ? $user->getName() : '';
        $payload['role'] = method_exists($user, 'getRole') ? $user->getRole() : '';
        $payload['division'] = method_exists($user, 'getDivision') ? $user->getDivision() : null;

        $event->setData($payload);
    }
}



