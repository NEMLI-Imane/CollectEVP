<?php

namespace App\Controller;

use App\Entity\Employee;
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

#[Route('/api/employees', name: 'api_employees_')]
#[IsGranted('ROLE_USER')]
class EmployeeController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private SerializerInterface $serializer,
        private ValidatorInterface $validator,
        private EmployeeRepository $employeeRepository
    ) {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $employees = $this->employeeRepository->findAll();
        
        $data = $this->serializer->serialize($employees, 'json', ['groups' => 'employee:read']);
        
        return new JsonResponse(json_decode($data, true), Response::HTTP_OK);
    }

    #[Route('/{id}', name: 'show', methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        $employee = $this->employeeRepository->find($id);
        
        if (!$employee) {
            return new JsonResponse(['error' => 'Employee not found'], Response::HTTP_NOT_FOUND);
        }

        $data = $this->serializer->serialize($employee, 'json', ['groups' => 'employee:read']);
        
        return new JsonResponse(json_decode($data, true), Response::HTTP_OK);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    #[IsGranted('ROLE_RH')]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $employee = new Employee();
        $employee->setMatricule($data['matricule'] ?? '');
        $employee->setNom($data['nom'] ?? '');
        $employee->setPrenom($data['prenom'] ?? '');
        $employee->setPoste($data['poste'] ?? '');
        $employee->setService($data['service'] ?? '');
        $employee->setDivision($data['division'] ?? '');

        $errors = $this->validator->validate($employee);
        if (count($errors) > 0) {
            return new JsonResponse(['error' => (string) $errors], Response::HTTP_BAD_REQUEST);
        }

        $this->em->persist($employee);
        $this->em->flush();

        $data = $this->serializer->serialize($employee, 'json', ['groups' => 'employee:read']);
        
        return new JsonResponse(json_decode($data, true), Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    #[IsGranted('ROLE_RH')]
    public function update(int $id, Request $request): JsonResponse
    {
        $employee = $this->employeeRepository->find($id);
        
        if (!$employee) {
            return new JsonResponse(['error' => 'Employee not found'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['nom'])) $employee->setNom($data['nom']);
        if (isset($data['prenom'])) $employee->setPrenom($data['prenom']);
        if (isset($data['poste'])) $employee->setPoste($data['poste']);
        if (isset($data['service'])) $employee->setService($data['service']);
        if (isset($data['division'])) $employee->setDivision($data['division']);

        $errors = $this->validator->validate($employee);
        if (count($errors) > 0) {
            return new JsonResponse(['error' => (string) $errors], Response::HTTP_BAD_REQUEST);
        }

        $employee->setUpdatedAt(new \DateTimeImmutable());
        $this->em->flush();

        $data = $this->serializer->serialize($employee, 'json', ['groups' => 'employee:read']);
        
        return new JsonResponse(json_decode($data, true), Response::HTTP_OK);
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_RH')]
    public function delete(int $id): JsonResponse
    {
        $employee = $this->employeeRepository->find($id);
        
        if (!$employee) {
            return new JsonResponse(['error' => 'Employee not found'], Response::HTTP_NOT_FOUND);
        }

        $this->em->remove($employee);
        $this->em->flush();

        return new JsonResponse(['message' => 'Employee deleted'], Response::HTTP_OK);
    }
}








