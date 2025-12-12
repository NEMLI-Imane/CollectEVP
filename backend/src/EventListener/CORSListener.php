<?php

namespace App\EventListener;

use Symfony\Component\HttpKernel\Event\ResponseEvent;

class CORSListener
{
    public function onKernelResponse(ResponseEvent $event): void
    {
        $response = $event->getResponse();
        $request = $event->getRequest();

        // Autoriser les requêtes depuis localhost:3000 (frontend React)
        $origin = $request->headers->get('Origin');
        $allowedOrigins = [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://localhost:5173', // Vite default port
            'http://127.0.0.1:5173',
        ];

        if (in_array($origin, $allowedOrigins, true)) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
        }

        $response->headers->set('Access-Control-Allow-Credentials', 'true');
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

        // Gérer les requêtes OPTIONS (preflight)
        if ($request->getMethod() === 'OPTIONS') {
            $response->setStatusCode(200);
            $response->setContent('');
        }
    }
}

