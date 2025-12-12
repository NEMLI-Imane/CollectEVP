<?php

namespace App\Entity;

use App\Repository\EmployeeRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: EmployeeRepository::class)]
#[ORM\Table(name: 'employees')]
#[ORM\UniqueConstraint(name: 'UNIQ_matricule', columns: ['matricule'])]
class Employee
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    #[Groups(['employee:read', 'evp:read'])]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 50, unique: true)]
    #[Groups(['employee:read', 'evp:read'])]
    private ?string $matricule = null;

    #[ORM\Column(type: 'string', length: 255)]
    #[Groups(['employee:read', 'evp:read'])]
    private ?string $nom = null;

    #[ORM\Column(type: 'string', length: 255)]
    #[Groups(['employee:read', 'evp:read'])]
    private ?string $prenom = null;

    #[ORM\Column(type: 'string', length: 255)]
    #[Groups(['employee:read', 'evp:read'])]
    private ?string $poste = null;

    #[ORM\Column(type: 'string', length: 255)]
    #[Groups(['employee:read', 'evp:read'])]
    private ?string $service = null;

    #[ORM\Column(type: 'string', length: 255)]
    #[Groups(['employee:read', 'evp:read'])]
    private ?string $division = null;

    #[ORM\OneToMany(mappedBy: 'employee', targetEntity: EVPSubmission::class)]
    private Collection $evpSubmissions;

    #[ORM\Column(type: 'datetime_immutable')]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $updatedAt = null;

    public function __construct()
    {
        $this->evpSubmissions = new ArrayCollection();
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getMatricule(): ?string
    {
        return $this->matricule;
    }

    public function setMatricule(string $matricule): self
    {
        $this->matricule = $matricule;
        return $this;
    }

    public function getNom(): ?string
    {
        return $this->nom;
    }

    public function setNom(string $nom): self
    {
        $this->nom = $nom;
        return $this;
    }

    public function getPrenom(): ?string
    {
        return $this->prenom;
    }

    public function setPrenom(string $prenom): self
    {
        $this->prenom = $prenom;
        return $this;
    }

    public function getPoste(): ?string
    {
        return $this->poste;
    }

    public function setPoste(string $poste): self
    {
        $this->poste = $poste;
        return $this;
    }

    public function getService(): ?string
    {
        return $this->service;
    }

    public function setService(string $service): self
    {
        $this->service = $service;
        return $this;
    }

    public function getDivision(): ?string
    {
        return $this->division;
    }

    public function setDivision(string $division): self
    {
        $this->division = $division;
        return $this;
    }

    /**
     * @return Collection<int, EVPSubmission>
     */
    public function getEvpSubmissions(): Collection
    {
        return $this->evpSubmissions;
    }

    public function addEvpSubmission(EVPSubmission $evpSubmission): self
    {
        if (!$this->evpSubmissions->contains($evpSubmission)) {
            $this->evpSubmissions->add($evpSubmission);
            $evpSubmission->setEmployee($this);
        }

        return $this;
    }

    public function removeEvpSubmission(EVPSubmission $evpSubmission): self
    {
        if ($this->evpSubmissions->removeElement($evpSubmission)) {
            if ($evpSubmission->getEmployee() === $this) {
                $evpSubmission->setEmployee(null);
            }
        }

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): self
    {
        $this->createdAt = $createdAt;
        return $this;
    }

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(?\DateTimeImmutable $updatedAt): self
    {
        $this->updatedAt = $updatedAt;
        return $this;
    }
}








