<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251215140654 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // Supprimer les colonnes inutiles qui sont maintenant dans les tables primes et conges
        $this->addSql('ALTER TABLE evp_submissions DROP COLUMN type');
        $this->addSql('ALTER TABLE evp_submissions DROP COLUMN taux_monetaire');
        $this->addSql('ALTER TABLE evp_submissions DROP COLUMN groupe');
        $this->addSql('ALTER TABLE evp_submissions DROP COLUMN nombre_postes');
        $this->addSql('ALTER TABLE evp_submissions DROP COLUMN score_equipe');
        $this->addSql('ALTER TABLE evp_submissions DROP COLUMN note_hierarchique');
        $this->addSql('ALTER TABLE evp_submissions DROP COLUMN score_collectif');
        $this->addSql('ALTER TABLE evp_submissions DROP COLUMN date_debut');
        $this->addSql('ALTER TABLE evp_submissions DROP COLUMN date_fin');
        $this->addSql('ALTER TABLE evp_submissions DROP COLUMN nombre_jours');
        $this->addSql('ALTER TABLE evp_submissions DROP COLUMN tranche');
        $this->addSql('ALTER TABLE evp_submissions DROP COLUMN avance_sur_conge');
        $this->addSql('ALTER TABLE evp_submissions DROP COLUMN montant_avance');
        $this->addSql('ALTER TABLE evp_submissions DROP COLUMN indemnite_forfaitaire');
        
        // Ajouter les colonnes booléennes isPrime et isConge
        $this->addSql('ALTER TABLE evp_submissions ADD COLUMN is_prime BOOLEAN DEFAULT 0 NOT NULL');
        $this->addSql('ALTER TABLE evp_submissions ADD COLUMN is_conge BOOLEAN DEFAULT 0 NOT NULL');
        $this->addSql('CREATE TEMPORARY TABLE __temp__evp_submissions AS SELECT id, employee_id, submitted_by_id, montant_calcule, indemnite_calculee, statut, justificatif_path, has_justificatif, submitted_at, validated_at, commentaire FROM evp_submissions');
        $this->addSql('DROP TABLE evp_submissions');
        $this->addSql('CREATE TABLE evp_submissions (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, employee_id INTEGER NOT NULL, submitted_by_id INTEGER NOT NULL, montant_calcule NUMERIC(10, 2) NOT NULL, indemnite_calculee NUMERIC(10, 2) DEFAULT NULL, statut VARCHAR(50) NOT NULL, justificatif_path VARCHAR(255) DEFAULT NULL, has_justificatif BOOLEAN DEFAULT 0 NOT NULL, submitted_at DATETIME NOT NULL --(DC2Type:datetime_immutable)
        , validated_at DATETIME DEFAULT NULL --(DC2Type:datetime_immutable)
        , commentaire CLOB DEFAULT NULL, is_prime BOOLEAN DEFAULT 0 NOT NULL, is_conge BOOLEAN DEFAULT 0 NOT NULL, CONSTRAINT FK_143A619E8C03F15C FOREIGN KEY (employee_id) REFERENCES employees (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_143A619E79F7D87D FOREIGN KEY (submitted_by_id) REFERENCES users (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO evp_submissions (id, employee_id, submitted_by_id, montant_calcule, indemnite_calculee, statut, justificatif_path, has_justificatif, submitted_at, validated_at, commentaire) SELECT id, employee_id, submitted_by_id, montant_calcule, indemnite_calculee, statut, justificatif_path, has_justificatif, submitted_at, validated_at, commentaire FROM __temp__evp_submissions');
        $this->addSql('DROP TABLE __temp__evp_submissions');
        $this->addSql('CREATE INDEX IDX_143A619E79F7D87D ON evp_submissions (submitted_by_id)');
        $this->addSql('CREATE INDEX IDX_143A619E8C03F15C ON evp_submissions (employee_id)');
    }

    public function down(Schema $schema): void
    {
        // Restaurer les colonnes supprimées
        $this->addSql('ALTER TABLE evp_submissions ADD COLUMN type VARCHAR(50) DEFAULT NULL');
        $this->addSql('ALTER TABLE evp_submissions ADD COLUMN taux_monetaire NUMERIC(10, 2) DEFAULT NULL');
        $this->addSql('ALTER TABLE evp_submissions ADD COLUMN groupe INTEGER DEFAULT NULL');
        $this->addSql('ALTER TABLE evp_submissions ADD COLUMN nombre_postes INTEGER DEFAULT NULL');
        $this->addSql('ALTER TABLE evp_submissions ADD COLUMN score_equipe INTEGER DEFAULT NULL');
        $this->addSql('ALTER TABLE evp_submissions ADD COLUMN note_hierarchique INTEGER DEFAULT NULL');
        $this->addSql('ALTER TABLE evp_submissions ADD COLUMN score_collectif INTEGER DEFAULT NULL');
        $this->addSql('ALTER TABLE evp_submissions ADD COLUMN date_debut DATE DEFAULT NULL');
        $this->addSql('ALTER TABLE evp_submissions ADD COLUMN date_fin DATE DEFAULT NULL');
        $this->addSql('ALTER TABLE evp_submissions ADD COLUMN nombre_jours INTEGER DEFAULT NULL');
        $this->addSql('ALTER TABLE evp_submissions ADD COLUMN tranche INTEGER DEFAULT NULL');
        $this->addSql('ALTER TABLE evp_submissions ADD COLUMN avance_sur_conge BOOLEAN DEFAULT NULL');
        $this->addSql('ALTER TABLE evp_submissions ADD COLUMN montant_avance NUMERIC(10, 2) DEFAULT NULL');
        $this->addSql('ALTER TABLE evp_submissions ADD COLUMN indemnite_forfaitaire NUMERIC(10, 2) DEFAULT NULL');
        
        // Supprimer les colonnes booléennes
        $this->addSql('ALTER TABLE evp_submissions DROP COLUMN is_prime');
        $this->addSql('ALTER TABLE evp_submissions DROP COLUMN is_conge');
        $this->addSql('CREATE TEMPORARY TABLE __temp__evp_submissions AS SELECT id, employee_id, submitted_by_id, montant_calcule, indemnite_calculee, statut, justificatif_path, has_justificatif, submitted_at, validated_at, commentaire FROM evp_submissions');
        $this->addSql('DROP TABLE evp_submissions');
        $this->addSql('CREATE TABLE evp_submissions (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, employee_id INTEGER NOT NULL, submitted_by_id INTEGER NOT NULL, montant_calcule NUMERIC(10, 2) NOT NULL, indemnite_calculee NUMERIC(10, 2) DEFAULT NULL, statut VARCHAR(50) NOT NULL, justificatif_path VARCHAR(255) DEFAULT NULL, has_justificatif BOOLEAN DEFAULT 0 NOT NULL, submitted_at DATETIME NOT NULL --(DC2Type:datetime_immutable)
        , validated_at DATETIME DEFAULT NULL --(DC2Type:datetime_immutable)
        , commentaire CLOB DEFAULT NULL, type VARCHAR(50) NOT NULL, taux_monetaire NUMERIC(10, 2) DEFAULT NULL, groupe INTEGER DEFAULT NULL, nombre_postes INTEGER DEFAULT NULL, score_equipe INTEGER DEFAULT NULL, note_hierarchique INTEGER DEFAULT NULL, score_collectif INTEGER DEFAULT NULL, date_debut DATE DEFAULT NULL, date_fin DATE DEFAULT NULL, nombre_jours INTEGER DEFAULT NULL, tranche INTEGER DEFAULT NULL, avance_sur_conge BOOLEAN DEFAULT NULL, montant_avance NUMERIC(10, 2) DEFAULT NULL, indemnite_forfaitaire NUMERIC(10, 2) DEFAULT NULL, CONSTRAINT FK_143A619E8C03F15C FOREIGN KEY (employee_id) REFERENCES employees (id) NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_143A619E79F7D87D FOREIGN KEY (submitted_by_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO evp_submissions (id, employee_id, submitted_by_id, montant_calcule, indemnite_calculee, statut, justificatif_path, has_justificatif, submitted_at, validated_at, commentaire) SELECT id, employee_id, submitted_by_id, montant_calcule, indemnite_calculee, statut, justificatif_path, has_justificatif, submitted_at, validated_at, commentaire FROM __temp__evp_submissions');
        $this->addSql('DROP TABLE __temp__evp_submissions');
        $this->addSql('CREATE INDEX IDX_143A619E8C03F15C ON evp_submissions (employee_id)');
        $this->addSql('CREATE INDEX IDX_143A619E79F7D87D ON evp_submissions (submitted_by_id)');
    }
}
