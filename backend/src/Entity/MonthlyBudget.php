<?php

namespace App\Entity;

use App\Repository\MonthlyBudgetRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: MonthlyBudgetRepository::class)]
#[ORM\Table(name: 'monthly_budgets')]
#[ORM\UniqueConstraint(name: 'UNIQ_division_month', columns: ['division', 'month', 'year'])]
class MonthlyBudget
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    #[Groups(['budget:read'])]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 255)]
    #[Groups(['budget:read'])]
    private ?string $division = null;

    #[ORM\Column(type: 'integer')]
    #[Groups(['budget:read'])]
    private ?int $month = null;

    #[ORM\Column(type: 'integer')]
    #[Groups(['budget:read'])]
    private ?int $year = null;

    #[ORM\Column(type: 'decimal', precision: 12, scale: 2, nullable: true)]
    #[Groups(['budget:read'])]
    private ?string $montantPrevu = null;

    #[ORM\Column(type: 'decimal', precision: 12, scale: 2, nullable: true)]
    #[Groups(['budget:read'])]
    private ?string $montantRealise = null;

    #[ORM\Column(type: 'string', length: 50, options: ['default' => 'En cours'])]
    #[Groups(['budget:read'])]
    private ?string $statut = 'En cours';

    #[ORM\Column(type: 'datetime_immutable')]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $updatedAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
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

    public function getMonth(): ?int
    {
        return $this->month;
    }

    public function setMonth(int $month): self
    {
        $this->month = $month;
        return $this;
    }

    public function getYear(): ?int
    {
        return $this->year;
    }

    public function setYear(int $year): self
    {
        $this->year = $year;
        return $this;
    }

    public function getMontantPrevu(): ?string
    {
        return $this->montantPrevu;
    }

    public function setMontantPrevu(?string $montantPrevu): self
    {
        $this->montantPrevu = $montantPrevu;
        return $this;
    }

    public function getMontantRealise(): ?string
    {
        return $this->montantRealise;
    }

    public function setMontantRealise(?string $montantRealise): self
    {
        $this->montantRealise = $montantRealise;
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

    public function getEcart(): ?string
    {
        if ($this->montantPrevu === null || $this->montantRealise === null) {
            return null;
        }
        return (string) (floatval($this->montantRealise) - floatval($this->montantPrevu));
    }

    public function getEcartPourcentage(): ?float
    {
        if ($this->montantPrevu === null || floatval($this->montantPrevu) == 0) {
            return null;
        }
        $ecart = $this->getEcart();
        if ($ecart === null) {
            return null;
        }
        return (floatval($ecart) / floatval($this->montantPrevu)) * 100;
    }
}








