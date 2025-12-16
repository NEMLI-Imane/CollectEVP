<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251215141601 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // Supprimer les colonnes justificatif
        $this->addSql('ALTER TABLE evp_submissions DROP COLUMN justificatif_path');
        $this->addSql('ALTER TABLE evp_submissions DROP COLUMN has_justificatif');
        $this->addSql('CREATE TEMPORARY TABLE __temp__evp_submissions AS SELECT id, employee_id, submitted_by_id, montant_calcule, indemnite_calculee, statut, submitted_at, validated_at, commentaire, is_prime, is_conge FROM evp_submissions');
        $this->addSql('DROP TABLE evp_submissions');
        $this->addSql('CREATE TABLE evp_submissions (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, employee_id INTEGER NOT NULL, submitted_by_id INTEGER NOT NULL, montant_calcule NUMERIC(10, 2) NOT NULL, indemnite_calculee NUMERIC(10, 2) DEFAULT NULL, statut VARCHAR(50) NOT NULL, submitted_at DATETIME NOT NULL --(DC2Type:datetime_immutable)
        , validated_at DATETIME DEFAULT NULL --(DC2Type:datetime_immutable)
        , commentaire CLOB DEFAULT NULL, is_prime BOOLEAN DEFAULT 0 NOT NULL, is_conge BOOLEAN DEFAULT 0 NOT NULL, CONSTRAINT FK_143A619E8C03F15C FOREIGN KEY (employee_id) REFERENCES employees (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_143A619E79F7D87D FOREIGN KEY (submitted_by_id) REFERENCES users (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO evp_submissions (id, employee_id, submitted_by_id, montant_calcule, indemnite_calculee, statut, submitted_at, validated_at, commentaire, is_prime, is_conge) SELECT id, employee_id, submitted_by_id, montant_calcule, indemnite_calculee, statut, submitted_at, validated_at, commentaire, is_prime, is_conge FROM __temp__evp_submissions');
        $this->addSql('DROP TABLE __temp__evp_submissions');
        $this->addSql('CREATE INDEX IDX_143A619E8C03F15C ON evp_submissions (employee_id)');
        $this->addSql('CREATE INDEX IDX_143A619E79F7D87D ON evp_submissions (submitted_by_id)');
    }

    public function down(Schema $schema): void
    {
        // Restaurer les colonnes justificatif
        $this->addSql('ALTER TABLE evp_submissions ADD COLUMN justificatif_path VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE evp_submissions ADD COLUMN has_justificatif BOOLEAN DEFAULT 0 NOT NULL');
        $this->addSql('ALTER TABLE evp_submissions ADD COLUMN justificatif_path VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE evp_submissions ADD COLUMN has_justificatif BOOLEAN DEFAULT 0 NOT NULL');
    }
}
