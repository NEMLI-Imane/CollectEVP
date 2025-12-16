<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251215155948 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE conges ADD COLUMN statut VARCHAR(50) DEFAULT \'En attente\' NOT NULL');
        $this->addSql('ALTER TABLE conges ADD COLUMN submitted_at DATETIME DEFAULT NULL');
        $this->addSql('ALTER TABLE conges ADD COLUMN commentaire CLOB DEFAULT NULL');
        $this->addSql('CREATE TEMPORARY TABLE __temp__evp_submissions AS SELECT id, employee_id, submitted_by_id, montant_calcule, indemnite_calculee, is_prime, is_conge FROM evp_submissions');
        $this->addSql('DROP TABLE evp_submissions');
        $this->addSql('CREATE TABLE evp_submissions (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, employee_id INTEGER NOT NULL, submitted_by_id INTEGER NOT NULL, montant_calcule NUMERIC(10, 2) NOT NULL, indemnite_calculee NUMERIC(10, 2) DEFAULT NULL, is_prime BOOLEAN DEFAULT 0 NOT NULL, is_conge BOOLEAN DEFAULT 0 NOT NULL, valide_service BOOLEAN DEFAULT 0 NOT NULL, valide_division BOOLEAN DEFAULT 0 NOT NULL, CONSTRAINT FK_143A619E8C03F15C FOREIGN KEY (employee_id) REFERENCES employees (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_143A619E79F7D87D FOREIGN KEY (submitted_by_id) REFERENCES users (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO evp_submissions (id, employee_id, submitted_by_id, montant_calcule, indemnite_calculee, is_prime, is_conge) SELECT id, employee_id, submitted_by_id, montant_calcule, indemnite_calculee, is_prime, is_conge FROM __temp__evp_submissions');
        $this->addSql('DROP TABLE __temp__evp_submissions');
        $this->addSql('CREATE INDEX IDX_143A619E79F7D87D ON evp_submissions (submitted_by_id)');
        $this->addSql('CREATE INDEX IDX_143A619E8C03F15C ON evp_submissions (employee_id)');
        $this->addSql('ALTER TABLE primes ADD COLUMN statut VARCHAR(50) DEFAULT \'En attente\' NOT NULL');
        $this->addSql('ALTER TABLE primes ADD COLUMN submitted_at DATETIME DEFAULT NULL');
        $this->addSql('ALTER TABLE primes ADD COLUMN commentaire CLOB DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TEMPORARY TABLE __temp__conges AS SELECT id, evp_submission_id, date_debut, date_fin, nombre_jours, tranche, avance_sur_conge, montant_avance, indemnite_forfaitaire, indemnite_calculee, created_at, updated_at FROM conges');
        $this->addSql('DROP TABLE conges');
        $this->addSql('CREATE TABLE conges (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, evp_submission_id INTEGER NOT NULL, date_debut DATE DEFAULT NULL, date_fin DATE DEFAULT NULL, nombre_jours INTEGER DEFAULT NULL, tranche INTEGER DEFAULT NULL, avance_sur_conge BOOLEAN DEFAULT 0, montant_avance NUMERIC(10, 2) DEFAULT NULL, indemnite_forfaitaire NUMERIC(10, 2) DEFAULT NULL, indemnite_calculee NUMERIC(10, 2) DEFAULT NULL, created_at DATETIME NOT NULL --(DC2Type:datetime_immutable)
        , updated_at DATETIME DEFAULT NULL --(DC2Type:datetime_immutable)
        , CONSTRAINT FK_6327DE3A5B193AB4 FOREIGN KEY (evp_submission_id) REFERENCES evp_submissions (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO conges (id, evp_submission_id, date_debut, date_fin, nombre_jours, tranche, avance_sur_conge, montant_avance, indemnite_forfaitaire, indemnite_calculee, created_at, updated_at) SELECT id, evp_submission_id, date_debut, date_fin, nombre_jours, tranche, avance_sur_conge, montant_avance, indemnite_forfaitaire, indemnite_calculee, created_at, updated_at FROM __temp__conges');
        $this->addSql('DROP TABLE __temp__conges');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_6327DE3A5B193AB4 ON conges (evp_submission_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__evp_submissions AS SELECT id, employee_id, submitted_by_id, is_prime, is_conge, montant_calcule, indemnite_calculee FROM evp_submissions');
        $this->addSql('DROP TABLE evp_submissions');
        $this->addSql('CREATE TABLE evp_submissions (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, employee_id INTEGER NOT NULL, submitted_by_id INTEGER NOT NULL, is_prime BOOLEAN DEFAULT 0 NOT NULL, is_conge BOOLEAN DEFAULT 0 NOT NULL, montant_calcule NUMERIC(10, 2) NOT NULL, indemnite_calculee NUMERIC(10, 2) DEFAULT NULL, statut VARCHAR(50) NOT NULL, submitted_at DATETIME NOT NULL --(DC2Type:datetime_immutable)
        , validated_at DATETIME DEFAULT NULL --(DC2Type:datetime_immutable)
        , commentaire CLOB DEFAULT NULL, CONSTRAINT FK_143A619E8C03F15C FOREIGN KEY (employee_id) REFERENCES employees (id) NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_143A619E79F7D87D FOREIGN KEY (submitted_by_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO evp_submissions (id, employee_id, submitted_by_id, is_prime, is_conge, montant_calcule, indemnite_calculee) SELECT id, employee_id, submitted_by_id, is_prime, is_conge, montant_calcule, indemnite_calculee FROM __temp__evp_submissions');
        $this->addSql('DROP TABLE __temp__evp_submissions');
        $this->addSql('CREATE INDEX IDX_143A619E8C03F15C ON evp_submissions (employee_id)');
        $this->addSql('CREATE INDEX IDX_143A619E79F7D87D ON evp_submissions (submitted_by_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__primes AS SELECT id, evp_submission_id, taux_monetaire, groupe, nombre_postes, score_equipe, note_hierarchique, score_collectif, montant_calcule, created_at, updated_at FROM primes');
        $this->addSql('DROP TABLE primes');
        $this->addSql('CREATE TABLE primes (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, evp_submission_id INTEGER NOT NULL, taux_monetaire NUMERIC(10, 2) DEFAULT NULL, groupe INTEGER DEFAULT NULL, nombre_postes INTEGER DEFAULT NULL, score_equipe INTEGER DEFAULT NULL, note_hierarchique INTEGER DEFAULT NULL, score_collectif INTEGER DEFAULT NULL, montant_calcule NUMERIC(10, 2) NOT NULL, created_at DATETIME NOT NULL --(DC2Type:datetime_immutable)
        , updated_at DATETIME DEFAULT NULL --(DC2Type:datetime_immutable)
        , CONSTRAINT FK_EE5540535B193AB4 FOREIGN KEY (evp_submission_id) REFERENCES evp_submissions (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO primes (id, evp_submission_id, taux_monetaire, groupe, nombre_postes, score_equipe, note_hierarchique, score_collectif, montant_calcule, created_at, updated_at) SELECT id, evp_submission_id, taux_monetaire, groupe, nombre_postes, score_equipe, note_hierarchique, score_collectif, montant_calcule, created_at, updated_at FROM __temp__primes');
        $this->addSql('DROP TABLE __temp__primes');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_EE5540535B193AB4 ON primes (evp_submission_id)');
    }
}
