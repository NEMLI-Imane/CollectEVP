<?php

namespace App\DataFixtures;

use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class UserFixtures extends Fixture
{
    public function __construct(
        private UserPasswordHasherInterface $passwordHasher
    ) {
    }

    public function load(ObjectManager $manager): void
    {
        // Gestionnaire
        $gestionnaire = new User();
        $gestionnaire->setEmail('gestionnaire@ocp.ma');
        $gestionnaire->setName('Ahmed Bennani');
        $gestionnaire->setRole('Gestionnaire');
        $gestionnaire->setDivision('Production');
        $gestionnaire->setPassword($this->passwordHasher->hashPassword($gestionnaire, 'password123'));
        $gestionnaire->setIsActive(true);
        $manager->persist($gestionnaire);

        // Responsable Service
        $respService = new User();
        $respService->setEmail('responsable.service@ocp.ma');
        $respService->setName('Fatima Zahra Alami');
        $respService->setRole('Responsable Service');
        $respService->setDivision('Service Maintenance');
        $respService->setPassword($this->passwordHasher->hashPassword($respService, 'password123'));
        $respService->setIsActive(true);
        $manager->persist($respService);

        // Responsable Division
        $respDivision = new User();
        $respDivision->setEmail('responsable.division@ocp.ma');
        $respDivision->setName('Hassan Mouhib');
        $respDivision->setRole('Responsable Division');
        $respDivision->setDivision('Division Production');
        $respDivision->setPassword($this->passwordHasher->hashPassword($respDivision, 'password123'));
        $respDivision->setIsActive(true);
        $manager->persist($respDivision);

        // RH
        $rh = new User();
        $rh->setEmail('rh@ocp.ma');
        $rh->setName('Mohammed Tazi');
        $rh->setRole('RH');
        $rh->setDivision(null);
        $rh->setPassword($this->passwordHasher->hashPassword($rh, 'password123'));
        $rh->setIsActive(true);
        $manager->persist($rh);

        // Administrateur
        $admin = new User();
        $admin->setEmail('admin@ocp.ma');
        $admin->setName('Nadia El Amrani');
        $admin->setRole('Administrateur');
        $admin->setDivision(null);
        $admin->setPassword($this->passwordHasher->hashPassword($admin, 'password123'));
        $admin->setIsActive(true);
        $manager->persist($admin);

        $manager->flush();
    }
}








