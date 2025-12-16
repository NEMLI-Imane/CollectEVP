<?php

namespace App\Entity;

use App\Repository\CongeRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: CongeRepository::class)]
#[ORM\Table(name: 'conges')]
class Conge
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\OneToOne(targetEntity: EVPSubmission::class, inversedBy: 'conge', cascade: ['persist'])]
    #[ORM\JoinColumn(name: 'evp_submission_id', referencedColumnName: 'id', nullable: false, unique: true, onDelete: 'CASCADE')]
    private ?EVPSubmission $evpSubmission = null;

    #[ORM\Column(type: 'date', nullable: true)]
    private ?\DateTimeInterface $dateDebut = null;

    #[ORM\Column(type: 'date', nullable: true)]
    private ?\DateTimeInterface $dateFin = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $nombreJours = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $tranche = null;

    #[ORM\Column(type: 'boolean', nullable: true, options: ['default' => false])]
    private ?bool $avanceSurConge = false;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 2, nullable: true)]
    private ?string $montantAvance = null;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 2, nullable: true)]
    private ?string $indemniteForfaitaire = null;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 2, nullable: true)]
    private ?string $indemniteCalculee = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $updatedAt = null;

    // Statut et soumission
    #[ORM\Column(type: 'string', length: 50, options: ['default' => 'En attente'])]
    private ?string $statut = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $submittedAt = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $commentaire = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->avanceSurConge = false;
        $this->statut = 'En attente';
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

    public function getDateDebut(): ?\DateTimeInterface
    {
        return $this->dateDebut;
    }

    public function setDateDebut(?\DateTimeInterface $dateDebut): self
    {
        $this->dateDebut = $dateDebut;
        $this->updatedAt = new \DateTimeImmutable();
        $this->calculateNombreJours();
        $this->calculateIndemnite();
        return $this;
    }

    public function getDateFin(): ?\DateTimeInterface
    {
        return $this->dateFin;
    }

    public function setDateFin(?\DateTimeInterface $dateFin): self
    {
        $this->dateFin = $dateFin;
        $this->updatedAt = new \DateTimeImmutable();
        $this->calculateNombreJours();
        $this->calculateIndemnite();
        return $this;
    }

    public function getNombreJours(): ?int
    {
        return $this->nombreJours;
    }

    public function setNombreJours(?int $nombreJours): self
    {
        $this->nombreJours = $nombreJours;
        $this->updatedAt = new \DateTimeImmutable();
        $this->calculateIndemnite();
        return $this;
    }

    public function getTranche(): ?int
    {
        return $this->tranche;
    }

    public function setTranche(?int $tranche): self
    {
        $this->tranche = $tranche;
        $this->updatedAt = new \DateTimeImmutable();
        $this->calculateIndemnite();
        return $this;
    }

    public function isAvanceSurConge(): ?bool
    {
        return $this->avanceSurConge;
    }

    public function setAvanceSurConge(?bool $avanceSurConge): self
    {
        $this->avanceSurConge = $avanceSurConge ?? false;
        $this->updatedAt = new \DateTimeImmutable();
        return $this;
    }

    public function getMontantAvance(): ?string
    {
        return $this->montantAvance;
    }

    public function setMontantAvance(?string $montantAvance): self
    {
        $this->montantAvance = $montantAvance;
        $this->updatedAt = new \DateTimeImmutable();
        return $this;
    }

    public function getIndemniteForfaitaire(): ?string
    {
        return $this->indemniteForfaitaire;
    }

    public function setIndemniteForfaitaire(?string $indemniteForfaitaire): self
    {
        $this->indemniteForfaitaire = $indemniteForfaitaire;
        $this->updatedAt = new \DateTimeImmutable();
        $this->calculateIndemnite();
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

    /**
     * Calcule le nombre de jours entre dateDebut et dateFin
     */
    public function calculateNombreJours(): void
    {
        if ($this->dateDebut && $this->dateFin) {
            $diff = $this->dateDebut->diff($this->dateFin);
            $this->nombreJours = $diff->days + 1;
        }
    }

    /**
     * Calcule l'indemnité selon la formule :
     * (nombreJours * indemniteForfaitaire * tranche) / 10
     */
    public function calculateIndemnite(): void
    {
        if ($this->nombreJours && $this->indemniteForfaitaire && $this->tranche) {
            $indemnite = ($this->nombreJours * 
                         floatval($this->indemniteForfaitaire) * 
                         $this->tranche) / 10;
            
            $this->indemniteCalculee = (string) ceil($indemnite);
            
            // Mettre à jour aussi l'indemnité dans EVPSubmission si la relation existe
            if ($this->evpSubmission) {
                $this->evpSubmission->setIndemniteCalculee($this->indemniteCalculee);
            }
        } else {
            $this->indemniteCalculee = null;
        }
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

    public function getStatut(): ?string
    {
        return $this->statut;
    }

    public function setStatut(string $statut): self
    {
        $this->statut = $statut;
        return $this;
    }

    public function getSubmittedAt(): ?\DateTimeImmutable
    {
        return $this->submittedAt;
    }

    public function setSubmittedAt(?\DateTimeImmutable $submittedAt): self
    {
        $this->submittedAt = $submittedAt;
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
}

