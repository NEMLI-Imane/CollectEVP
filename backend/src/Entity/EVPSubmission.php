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

    #[ORM\Column(type: 'string', length: 50)]
    #[Groups(['evp:read'])]
    private ?string $type = null; // 'Prime', 'Congé', 'Heures Sup', 'Absence'

    // Champs pour Prime
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

    // Champs pour Congé
    #[ORM\Column(type: 'date', nullable: true)]
    private ?\DateTimeInterface $dateDebut = null;

    #[ORM\Column(type: 'date', nullable: true)]
    private ?\DateTimeInterface $dateFin = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $nombreJours = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $tranche = null;

    #[ORM\Column(type: 'boolean', nullable: true)]
    private ?bool $avanceSurConge = null;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 2, nullable: true)]
    private ?string $montantAvance = null;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 2, nullable: true)]
    private ?string $indemniteForfaitaire = null;

    // Montants calculés
    #[ORM\Column(type: 'decimal', precision: 10, scale: 2)]
    #[Groups(['evp:read'])]
    private ?string $montantCalcule = null;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 2, nullable: true)]
    #[Groups(['evp:read'])]
    private ?string $indemniteCalculee = null;

    // Statut et validation
    #[ORM\Column(type: 'string', length: 50)]
    #[Groups(['evp:read'])]
    private ?string $statut = null; // 'En attente', 'Validé Service', 'Validé Division', 'Approuvé RH', 'Rejeté'

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $justificatifPath = null;

    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    private bool $hasJustificatif = false;

    #[ORM\OneToMany(mappedBy: 'evpSubmission', targetEntity: ValidationHistory::class, cascade: ['persist', 'remove'])]
    private Collection $validationHistories;

    #[ORM\Column(type: 'datetime_immutable')]
    #[Groups(['evp:read'])]
    private ?\DateTimeImmutable $submittedAt = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $validatedAt = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $commentaire = null;

    public function __construct()
    {
        $this->validationHistories = new ArrayCollection();
        $this->submittedAt = new \DateTimeImmutable();
        $this->statut = 'En attente';
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

    public function getType(): ?string
    {
        return $this->type;
    }

    public function setType(string $type): self
    {
        $this->type = $type;
        return $this;
    }

    public function getTauxMonetaire(): ?string
    {
        return $this->tauxMonetaire;
    }

    public function setTauxMonetaire(?string $tauxMonetaire): self
    {
        $this->tauxMonetaire = $tauxMonetaire;
        return $this;
    }

    public function getGroupe(): ?int
    {
        return $this->groupe;
    }

    public function setGroupe(?int $groupe): self
    {
        $this->groupe = $groupe;
        return $this;
    }

    public function getNombrePostes(): ?int
    {
        return $this->nombrePostes;
    }

    public function setNombrePostes(?int $nombrePostes): self
    {
        $this->nombrePostes = $nombrePostes;
        return $this;
    }

    public function getScoreEquipe(): ?int
    {
        return $this->scoreEquipe;
    }

    public function setScoreEquipe(?int $scoreEquipe): self
    {
        $this->scoreEquipe = $scoreEquipe;
        return $this;
    }

    public function getNoteHierarchique(): ?int
    {
        return $this->noteHierarchique;
    }

    public function setNoteHierarchique(?int $noteHierarchique): self
    {
        $this->noteHierarchique = $noteHierarchique;
        return $this;
    }

    public function getScoreCollectif(): ?int
    {
        return $this->scoreCollectif;
    }

    public function setScoreCollectif(?int $scoreCollectif): self
    {
        $this->scoreCollectif = $scoreCollectif;
        return $this;
    }

    public function getDateDebut(): ?\DateTimeInterface
    {
        return $this->dateDebut;
    }

    public function setDateDebut(?\DateTimeInterface $dateDebut): self
    {
        $this->dateDebut = $dateDebut;
        return $this;
    }

    public function getDateFin(): ?\DateTimeInterface
    {
        return $this->dateFin;
    }

    public function setDateFin(?\DateTimeInterface $dateFin): self
    {
        $this->dateFin = $dateFin;
        return $this;
    }

    public function getNombreJours(): ?int
    {
        return $this->nombreJours;
    }

    public function setNombreJours(?int $nombreJours): self
    {
        $this->nombreJours = $nombreJours;
        return $this;
    }

    public function getTranche(): ?int
    {
        return $this->tranche;
    }

    public function setTranche(?int $tranche): self
    {
        $this->tranche = $tranche;
        return $this;
    }

    public function isAvanceSurConge(): ?bool
    {
        return $this->avanceSurConge;
    }

    public function setAvanceSurConge(?bool $avanceSurConge): self
    {
        $this->avanceSurConge = $avanceSurConge;
        return $this;
    }

    public function getMontantAvance(): ?string
    {
        return $this->montantAvance;
    }

    public function setMontantAvance(?string $montantAvance): self
    {
        $this->montantAvance = $montantAvance;
        return $this;
    }

    public function getIndemniteForfaitaire(): ?string
    {
        return $this->indemniteForfaitaire;
    }

    public function setIndemniteForfaitaire(?string $indemniteForfaitaire): self
    {
        $this->indemniteForfaitaire = $indemniteForfaitaire;
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

    public function getStatut(): ?string
    {
        return $this->statut;
    }

    public function setStatut(string $statut): self
    {
        $this->statut = $statut;
        return $this;
    }

    public function getJustificatifPath(): ?string
    {
        return $this->justificatifPath;
    }

    public function setJustificatifPath(?string $justificatifPath): self
    {
        $this->justificatifPath = $justificatifPath;
        return $this;
    }

    public function isHasJustificatif(): bool
    {
        return $this->hasJustificatif;
    }

    public function setHasJustificatif(bool $hasJustificatif): self
    {
        $this->hasJustificatif = $hasJustificatif;
        return $this;
    }

    /**
     * @return Collection<int, ValidationHistory>
     */
    public function getValidationHistories(): Collection
    {
        return $this->validationHistories;
    }

    public function addValidationHistory(ValidationHistory $validationHistory): self
    {
        if (!$this->validationHistories->contains($validationHistory)) {
            $this->validationHistories->add($validationHistory);
            $validationHistory->setEvpSubmission($this);
        }

        return $this;
    }

    public function removeValidationHistory(ValidationHistory $validationHistory): self
    {
        if ($this->validationHistories->removeElement($validationHistory)) {
            if ($validationHistory->getEvpSubmission() === $this) {
                $validationHistory->setEvpSubmission(null);
            }
        }

        return $this;
    }

    public function getSubmittedAt(): ?\DateTimeImmutable
    {
        return $this->submittedAt;
    }

    public function setSubmittedAt(\DateTimeImmutable $submittedAt): self
    {
        $this->submittedAt = $submittedAt;
        return $this;
    }

    public function getValidatedAt(): ?\DateTimeImmutable
    {
        return $this->validatedAt;
    }

    public function setValidatedAt(?\DateTimeImmutable $validatedAt): self
    {
        $this->validatedAt = $validatedAt;
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








