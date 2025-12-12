<?php

namespace App\Entity;

use App\Repository\ValidationHistoryRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: ValidationHistoryRepository::class)]
#[ORM\Table(name: 'validation_history')]
class ValidationHistory
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    #[Groups(['validation:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: EVPSubmission::class, inversedBy: 'validationHistories')]
    #[ORM\JoinColumn(nullable: false)]
    private ?EVPSubmission $evpSubmission = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['validation:read'])]
    private ?User $validatedBy = null;

    #[ORM\Column(type: 'string', length: 50)]
    #[Groups(['validation:read'])]
    private ?string $action = null; // 'Validé', 'Rejeté', 'Approuvé'

    #[ORM\Column(type: 'string', length: 50)]
    #[Groups(['validation:read'])]
    private ?string $niveau = null; // 'Service', 'Division', 'RH'

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['validation:read'])]
    private ?string $commentaire = null;

    #[ORM\Column(type: 'datetime_immutable')]
    #[Groups(['validation:read'])]
    private ?\DateTimeImmutable $validatedAt = null;

    public function __construct()
    {
        $this->validatedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getEvpSubmission(): ?EVPSubmission
    {
        return $this->evpSubmission;
    }

    public function setEvpSubmission(?EVPSubmission $evpSubmission): self
    {
        $this->evpSubmission = $evpSubmission;
        return $this;
    }

    public function getValidatedBy(): ?User
    {
        return $this->validatedBy;
    }

    public function setValidatedBy(?User $validatedBy): self
    {
        $this->validatedBy = $validatedBy;
        return $this;
    }

    public function getAction(): ?string
    {
        return $this->action;
    }

    public function setAction(string $action): self
    {
        $this->action = $action;
        return $this;
    }

    public function getNiveau(): ?string
    {
        return $this->niveau;
    }

    public function setNiveau(string $niveau): self
    {
        $this->niveau = $niveau;
        return $this;
    }

    public function getCommentaire(): ?string
    {
        return $this->commentaire;
    }

    public function setCommentaire(?string $commentaire): self
    {
        $this->commentaire = $commentaire;
        return $this;
    }

    public function getValidatedAt(): ?\DateTimeImmutable
    {
        return $this->validatedAt;
    }

    public function setValidatedAt(\DateTimeImmutable $validatedAt): self
    {
        $this->validatedAt = $validatedAt;
        return $this;
    }
}








