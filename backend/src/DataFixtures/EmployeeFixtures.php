<?php

namespace App\DataFixtures;

use App\Entity\Employee;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

class EmployeeFixtures extends Fixture
{
    public function load(ObjectManager $manager): void
    {
        $employees = [
            // Production - Maintenance
            [
                'matricule' => '45872',
                'nom' => 'Bennani',
                'prenom' => 'Ahmed',
                'poste' => 'technicien',
                'service' => 'Maintenance',
                'division' => 'Production',
            ],
            [
                'matricule' => '45873',
                'nom' => 'Alami',
                'prenom' => 'Fatima Zahra',
                'poste' => 'cadre administratif',
                'service' => 'Administration',
                'division' => 'Production',
            ],
            [
                'matricule' => '45874',
                'nom' => 'Tazi',
                'prenom' => 'Mohammed',
                'poste' => 'agent de maîtrise',
                'service' => 'Fabrication',
                'division' => 'Production',
            ],
            [
                'matricule' => '45875',
                'nom' => 'Benjelloun',
                'prenom' => 'Salma',
                'poste' => 'technicien',
                'service' => 'Contrôle',
                'division' => 'Qualité',
            ],
            // Production - Fabrication
            [
                'matricule' => '45876',
                'nom' => 'Idrissi',
                'prenom' => 'Karim',
                'poste' => 'technicien',
                'service' => 'Fabrication',
                'division' => 'Production',
            ],
            [
                'matricule' => '45877',
                'nom' => 'El Fassi',
                'prenom' => 'Samira',
                'poste' => 'agent de maîtrise',
                'service' => 'Fabrication',
                'division' => 'Production',
            ],
            [
                'matricule' => '45878',
                'nom' => 'Mansouri',
                'prenom' => 'Khalid',
                'poste' => 'ouvrier',
                'service' => 'Fabrication',
                'division' => 'Production',
            ],
            [
                'matricule' => '45879',
                'nom' => 'Semlali',
                'prenom' => 'Imane',
                'poste' => 'technicien',
                'service' => 'Fabrication',
                'division' => 'Production',
            ],
            // Production - Maintenance
            [
                'matricule' => '45880',
                'nom' => 'Bousfiha',
                'prenom' => 'Rachid',
                'poste' => 'technicien',
                'service' => 'Maintenance',
                'division' => 'Production',
            ],
            [
                'matricule' => '45881',
                'nom' => 'Kadiri',
                'prenom' => 'Youssef',
                'poste' => 'agent de maîtrise',
                'service' => 'Maintenance',
                'division' => 'Production',
            ],
            [
                'matricule' => '45882',
                'nom' => 'El Amrani',
                'prenom' => 'Nadia',
                'poste' => 'cadre supérieur',
                'service' => 'Maintenance',
                'division' => 'Production',
            ],
            // Qualité - Contrôle
            [
                'matricule' => '45883',
                'nom' => 'Alaoui',
                'prenom' => 'Karim',
                'poste' => 'technicien',
                'service' => 'Contrôle',
                'division' => 'Qualité',
            ],
            [
                'matricule' => '45884',
                'nom' => 'Bensaid',
                'prenom' => 'Sanae',
                'poste' => 'cadre administratif',
                'service' => 'Contrôle',
                'division' => 'Qualité',
            ],
            [
                'matricule' => '45885',
                'nom' => 'Mouhib',
                'prenom' => 'Hassan',
                'poste' => 'cadre supérieur',
                'service' => 'Contrôle',
                'division' => 'Qualité',
            ],
            // Logistique
            [
                'matricule' => '45886',
                'nom' => 'El Fassi',
                'prenom' => 'Amina',
                'poste' => 'cadre administratif',
                'service' => 'Expédition',
                'division' => 'Logistique',
            ],
            [
                'matricule' => '45887',
                'nom' => 'Tazi',
                'prenom' => 'Omar',
                'poste' => 'agent de maîtrise',
                'service' => 'Expédition',
                'division' => 'Logistique',
            ],
            [
                'matricule' => '45888',
                'nom' => 'Bennani',
                'prenom' => 'Laila',
                'poste' => 'technicien',
                'service' => 'Logistique',
                'division' => 'Logistique',
            ],
            // Administration
            [
                'matricule' => '45889',
                'nom' => 'Alami',
                'prenom' => 'Youssef',
                'poste' => 'cadre administratif',
                'service' => 'Administration',
                'division' => 'Administration',
            ],
            [
                'matricule' => '45890',
                'nom' => 'Benjelloun',
                'prenom' => 'Hassan',
                'poste' => 'cadre supérieur',
                'service' => 'Administration',
                'division' => 'Administration',
            ],
            // Production - Administration
            [
                'matricule' => '45891',
                'nom' => 'El Fassi',
                'prenom' => 'Samira',
                'poste' => 'cadre administratif',
                'service' => 'Administration',
                'division' => 'Production',
            ],
            [
                'matricule' => '45892',
                'nom' => 'Mansouri',
                'prenom' => 'Mehdi',
                'poste' => 'technicien',
                'service' => 'Maintenance',
                'division' => 'Production',
            ],
            [
                'matricule' => '45893',
                'nom' => 'Kadiri',
                'prenom' => 'Sara',
                'poste' => 'agent de maîtrise',
                'service' => 'Fabrication',
                'division' => 'Production',
            ],
            [
                'matricule' => '45894',
                'nom' => 'Semlali',
                'prenom' => 'Omar',
                'poste' => 'ouvrier',
                'service' => 'Fabrication',
                'division' => 'Production',
            ],
            [
                'matricule' => '45895',
                'nom' => 'Bousfiha',
                'prenom' => 'Nadia',
                'poste' => 'technicien',
                'service' => 'Contrôle',
                'division' => 'Qualité',
            ],
        ];

        foreach ($employees as $empData) {
            $employee = new Employee();
            $employee->setMatricule($empData['matricule']);
            $employee->setNom($empData['nom']);
            $employee->setPrenom($empData['prenom']);
            $employee->setPoste($empData['poste']);
            $employee->setService($empData['service']);
            $employee->setDivision($empData['division']);
            $manager->persist($employee);
        }

        $manager->flush();
    }
}








