<?php

namespace App\EventListener;

use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\RequestEvent;

class CORSPreflightListener
{
    public function onKernelRequest(RequestEvent $event): void
    {
        // Ne traiter que les requêtes OPTIONS (preflight)
        if (!$event->getRequest()->isMethod('OPTIONS')) {
            return;
        }

        $request = $event->getRequest();
        $origin = $request->headers->get('Origin');
        
        $allowedOrigins = [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://localhost:5173',
            'http://127.0.0.1:5173',
        ];

        $response = new Response();
        
        if (in_array($origin, $allowedOrigins, true)) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
        }
        
        $response->headers->set('Access-Control-Allow-Credentials', 'true');
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        $response->headers->set('Access-Control-Max-Age', '3600');
        
        $response->setStatusCode(200);
        $event->setResponse($response);
    }
}

