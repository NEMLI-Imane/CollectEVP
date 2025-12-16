<?php

namespace App\Entity;

use App\Repository\PrimeRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: PrimeRepository::class)]
#[ORM\Table(name: 'primes')]
class Prime
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\OneToOne(targetEntity: EVPSubmission::class, inversedBy: 'prime', cascade: ['persist'])]
    #[ORM\JoinColumn(name: 'evp_submission_id', referencedColumnName: 'id', nullable: false, unique: true, onDelete: 'CASCADE')]
    private ?EVPSubmission $evpSubmission = null;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 2, nullable: true)]
    private ?string $tauxMonetaire = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $groupe = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $nombrePostes = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $scoreEquipe = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $noteHierarchique = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $scoreCollectif = null;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 2)]
    private ?string $montantCalcule = null;

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
        $this->montantCalcule = '0.00';
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

    public function getTauxMonetaire(): ?string
    {
        return $this->tauxMonetaire;
    }

    public function setTauxMonetaire(?string $tauxMonetaire): self
    {
        $this->tauxMonetaire = $tauxMonetaire;
        $this->updatedAt = new \DateTimeImmutable();
        $this->calculateMontant();
        return $this;
    }

    public function getGroupe(): ?int
    {
        return $this->groupe;
    }

    public function setGroupe(?int $groupe): self
    {
        $this->groupe = $groupe;
        $this->updatedAt = new \DateTimeImmutable();
        return $this;
    }

    public function getNombrePostes(): ?int
    {
        return $this->nombrePostes;
    }

    public function setNombrePostes(?int $nombrePostes): self
    {
        $this->nombrePostes = $nombrePostes;
        $this->updatedAt = new \DateTimeImmutable();
        $this->calculateMontant();
        return $this;
    }

    public function getScoreEquipe(): ?int
    {
        return $this->scoreEquipe;
    }

    public function setScoreEquipe(?int $scoreEquipe): self
    {
        $this->scoreEquipe = $scoreEquipe;
        $this->updatedAt = new \DateTimeImmutable();
        $this->calculateMontant();
        return $this;
    }

    public function getNoteHierarchique(): ?int
    {
        return $this->noteHierarchique;
    }

    public function setNoteHierarchique(?int $noteHierarchique): self
    {
        $this->noteHierarchique = $noteHierarchique;
        $this->updatedAt = new \DateTimeImmutable();
        $this->calculateMontant();
        return $this;
    }

    public function getScoreCollectif(): ?int
    {
        return $this->scoreCollectif;
    }

    public function setScoreCollectif(?int $scoreCollectif): self
    {
        $this->scoreCollectif = $scoreCollectif;
        $this->updatedAt = new \DateTimeImmutable();
        $this->calculateMontant();
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

    /**
     * Calcule le montant de la prime selon la formule :
     * (tauxMonetaire * nombrePostes * totalScores) / 100
     */
    public function calculateMontant(): void
    {
        if ($this->tauxMonetaire && $this->nombrePostes) {
            $totalScores = ($this->scoreEquipe ?? 0) + 
                          ($this->noteHierarchique ?? 0) + 
                          ($this->scoreCollectif ?? 0);
            
            $montant = (floatval($this->tauxMonetaire) * 
                       $this->nombrePostes * 
                       $totalScores) / 100;
            
            $this->montantCalcule = (string) ceil($montant);
            
            // Mettre à jour aussi le montant dans EVPSubmission si la relation existe
            if ($this->evpSubmission) {
                $this->evpSubmission->setMontantCalcule($this->montantCalcule);
            }
        } else {
            $this->montantCalcule = '0.00';
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

