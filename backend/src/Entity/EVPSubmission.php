<?php

namespace App\Entity;

use App\Repository\EVPSubmissionRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: EVPSubmissionRepository::class)]
#[ORM\Table(name: 'evp_submissions')]
class EVPSubmission
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    #[Groups(['evp:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Employee::class, inversedBy: 'evpSubmissions')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['evp:read'])]
    private ?Employee $employee = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['evp:read'])]
    private ?User $submittedBy = null;

    // Colonnes booléennes pour indiquer le type de soumission
    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    #[Groups(['evp:read'])]
    private bool $isPrime = false;

    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    #[Groups(['evp:read'])]
    private bool $isConge = false;

    // Relations avec les entités détaillées
    #[ORM\OneToOne(targetEntity: Prime::class, mappedBy: 'evpSubmission', cascade: ['persist', 'remove'])]
    private ?Prime $prime = null;

    #[ORM\OneToOne(targetEntity: Conge::class, mappedBy: 'evpSubmission', cascade: ['persist', 'remove'])]
    private ?Conge $conge = null;

    // Montants calculés
    #[ORM\Column(type: 'decimal', precision: 10, scale: 2)]
    #[Groups(['evp:read'])]
    private ?string $montantCalcule = null;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 2, nullable: true)]
    #[Groups(['evp:read'])]
    private ?string $indemniteCalculee = null;

    // Validation par niveau
    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    #[Groups(['evp:read'])]
    private bool $valideService = false;

    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    #[Groups(['evp:read'])]
    private bool $valideDivision = false;

    public function __construct()
    {
        $this->montantCalcule = '0.00';
        $this->isPrime = false;
        $this->isConge = false;
        $this->valideService = false;
        $this->valideDivision = false;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getEmployee(): ?Employee
    {
        return $this->employee;
    }

    public function setEmployee(?Employee $employee): self
    {
        $this->employee = $employee;
        return $this;
    }

    public function getSubmittedBy(): ?User
    {
        return $this->submittedBy;
    }

    public function setSubmittedBy(?User $submittedBy): self
    {
        $this->submittedBy = $submittedBy;
        return $this;
    }

    public function isPrime(): bool
    {
        return $this->isPrime;
    }

    public function setIsPrime(bool $isPrime): self
    {
        $this->isPrime = $isPrime;
        return $this;
    }

    public function isConge(): bool
    {
        return $this->isConge;
    }

    public function setIsConge(bool $isConge): self
    {
        $this->isConge = $isConge;
        return $this;
    }


    public function getMontantCalcule(): ?string
    {
        return $this->montantCalcule;
    }

    public function setMontantCalcule(string $montantCalcule): self
    {
        $this->montantCalcule = $montantCalcule;
        return $this;
    }

    public function getIndemniteCalculee(): ?string
    {
        return $this->indemniteCalculee;
    }

    public function setIndemniteCalculee(?string $indemniteCalculee): self
    {
        $this->indemniteCalculee = $indemniteCalculee;
        return $this;
    }

    public function isValideService(): bool
    {
        return $this->valideService;
    }

    public function setValideService(bool $valideService): self
    {
        $this->valideService = $valideService;
        return $this;
    }

    public function isValideDivision(): bool
    {
        return $this->valideDivision;
    }

    public function setValideDivision(bool $valideDivision): self
    {
        $this->valideDivision = $valideDivision;
        return $this;
    }

    // Relations avec Prime et Conge

    public function getPrime(): ?Prime
    {
        return $this->prime;
    }

    public function setPrime(?Prime $prime): self
    {
        // Définir la relation bidirectionnelle
        if ($prime === null && $this->prime !== null) {
            $this->prime->setEvpSubmission(null);
        }

        if ($prime !== null && $prime->getEvpSubmission() !== $this) {
            $prime->setEvpSubmission($this);
        }

        $this->prime = $prime;
        return $this;
    }

    public function getConge(): ?Conge
    {
        return $this->conge;
    }

    public function setConge(?Conge $conge): self
    {
        // Définir la relation bidirectionnelle
        if ($conge === null && $this->conge !== null) {
            $this->conge->setEvpSubmission(null);
        }

        if ($conge !== null && $conge->getEvpSubmission() !== $this) {
            $conge->setEvpSubmission($this);
        }

        $this->conge = $conge;
        return $this;
    }
}








