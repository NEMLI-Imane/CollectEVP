<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251216090405 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE employee_requests (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, requested_by_id INTEGER NOT NULL, processed_by_id INTEGER DEFAULT NULL, matricule VARCHAR(50) NOT NULL, nom VARCHAR(255) NOT NULL, prenom VARCHAR(255) NOT NULL, raison CLOB NOT NULL, request_date DATETIME NOT NULL --(DC2Type:datetime_immutable)
        , processed_date DATETIME DEFAULT NULL --(DC2Type:datetime_immutable)
        , statut VARCHAR(50) DEFAULT \'En attente\' NOT NULL, CONSTRAINT FK_EBBA87964DA1E751 FOREIGN KEY (requested_by_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_EBBA87962FFD4FD3 FOREIGN KEY (processed_by_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX IDX_EBBA87964DA1E751 ON employee_requests (requested_by_id)');
        $this->addSql('CREATE INDEX IDX_EBBA87962FFD4FD3 ON employee_requests (processed_by_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__conges AS SELECT id, evp_submission_id, date_debut, date_fin, nombre_jours, tranche, avance_sur_conge, montant_avance, indemnite_forfaitaire, indemnite_calculee, created_at, updated_at, statut, submitted_at, commentaire FROM conges');
        $this->addSql('DROP TABLE conges');
        $this->addSql('CREATE TABLE conges (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, evp_submission_id INTEGER NOT NULL, date_debut DATE DEFAULT NULL, date_fin DATE DEFAULT NULL, nombre_jours INTEGER DEFAULT NULL, tranche INTEGER DEFAULT NULL, avance_sur_conge BOOLEAN DEFAULT 0, montant_avance NUMERIC(10, 2) DEFAULT NULL, indemnite_forfaitaire NUMERIC(10, 2) DEFAULT NULL, indemnite_calculee NUMERIC(10, 2) DEFAULT NULL, created_at DATETIME NOT NULL --(DC2Type:datetime_immutable)
        , updated_at DATETIME DEFAULT NULL --(DC2Type:datetime_immutable)
        , statut VARCHAR(50) DEFAULT \'En attente\' NOT NULL, submitted_at DATETIME DEFAULT NULL --(DC2Type:datetime_immutable)
        , commentaire CLOB DEFAULT NULL, CONSTRAINT FK_6327DE3A5B193AB4 FOREIGN KEY (evp_submission_id) REFERENCES evp_submissions (id) ON UPDATE NO ACTION ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO conges (id, evp_submission_id, date_debut, date_fin, nombre_jours, tranche, avance_sur_conge, montant_avance, indemnite_forfaitaire, indemnite_calculee, created_at, updated_at, statut, submitted_at, commentaire) SELECT id, evp_submission_id, date_debut, date_fin, nombre_jours, tranche, avance_sur_conge, montant_avance, indemnite_forfaitaire, indemnite_calculee, created_at, updated_at, statut, submitted_at, commentaire FROM __temp__conges');
        $this->addSql('DROP TABLE __temp__conges');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_6327DE3A5B193AB4 ON conges (evp_submission_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__primes AS SELECT id, evp_submission_id, taux_monetaire, groupe, nombre_postes, score_equipe, note_hierarchique, score_collectif, montant_calcule, created_at, updated_at, statut, submitted_at, commentaire FROM primes');
        $this->addSql('DROP TABLE primes');
        $this->addSql('CREATE TABLE primes (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, evp_submission_id INTEGER NOT NULL, taux_monetaire NUMERIC(10, 2) DEFAULT NULL, groupe INTEGER DEFAULT NULL, nombre_postes INTEGER DEFAULT NULL, score_equipe INTEGER DEFAULT NULL, note_hierarchique INTEGER DEFAULT NULL, score_collectif INTEGER DEFAULT NULL, montant_calcule NUMERIC(10, 2) NOT NULL, created_at DATETIME NOT NULL --(DC2Type:datetime_immutable)
        , updated_at DATETIME DEFAULT NULL --(DC2Type:datetime_immutable)
        , statut VARCHAR(50) DEFAULT \'En attente\' NOT NULL, submitted_at DATETIME DEFAULT NULL --(DC2Type:datetime_immutable)
        , commentaire CLOB DEFAULT NULL, CONSTRAINT FK_EE5540535B193AB4 FOREIGN KEY (evp_submission_id) REFERENCES evp_submissions (id) ON UPDATE NO ACTION ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO primes (id, evp_submission_id, taux_monetaire, groupe, nombre_postes, score_equipe, note_hierarchique, score_collectif, montant_calcule, created_at, updated_at, statut, submitted_at, commentaire) SELECT id, evp_submission_id, taux_monetaire, groupe, nombre_postes, score_equipe, note_hierarchique, score_collectif, montant_calcule, created_at, updated_at, statut, submitted_at, commentaire FROM __temp__primes');
        $this->addSql('DROP TABLE __temp__primes');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_EE5540535B193AB4 ON primes (evp_submission_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP TABLE employee_requests');
        $this->addSql('CREATE TEMPORARY TABLE __temp__conges AS SELECT id, evp_submission_id, date_debut, date_fin, nombre_jours, tranche, avance_sur_conge, montant_avance, indemnite_forfaitaire, indemnite_calculee, created_at, updated_at, statut, submitted_at, commentaire FROM conges');
        $this->addSql('DROP TABLE conges');
        $this->addSql('CREATE TABLE conges (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, evp_submission_id INTEGER NOT NULL, date_debut DATE DEFAULT NULL, date_fin DATE DEFAULT NULL, nombre_jours INTEGER DEFAULT NULL, tranche INTEGER DEFAULT NULL, avance_sur_conge BOOLEAN DEFAULT 0, montant_avance NUMERIC(10, 2) DEFAULT NULL, indemnite_forfaitaire NUMERIC(10, 2) DEFAULT NULL, indemnite_calculee NUMERIC(10, 2) DEFAULT NULL, created_at DATETIME NOT NULL --(DC2Type:datetime_immutable)
        , updated_at DATETIME DEFAULT NULL --(DC2Type:datetime_immutable)
        , statut VARCHAR(50) DEFAULT \'En attente\' NOT NULL, submitted_at DATETIME DEFAULT NULL, commentaire CLOB DEFAULT NULL, CONSTRAINT FK_6327DE3A5B193AB4 FOREIGN KEY (evp_submission_id) REFERENCES evp_submissions (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO conges (id, evp_submission_id, date_debut, date_fin, nombre_jours, tranche, avance_sur_conge, montant_avance, indemnite_forfaitaire, indemnite_calculee, created_at, updated_at, statut, submitted_at, commentaire) SELECT id, evp_submission_id, date_debut, date_fin, nombre_jours, tranche, avance_sur_conge, montant_avance, indemnite_forfaitaire, indemnite_calculee, created_at, updated_at, statut, submitted_at, commentaire FROM __temp__conges');
        $this->addSql('DROP TABLE __temp__conges');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_6327DE3A5B193AB4 ON conges (evp_submission_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__primes AS SELECT id, evp_submission_id, taux_monetaire, groupe, nombre_postes, score_equipe, note_hierarchique, score_collectif, montant_calcule, created_at, updated_at, statut, submitted_at, commentaire FROM primes');
        $this->addSql('DROP TABLE primes');
        $this->addSql('CREATE TABLE primes (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, evp_submission_id INTEGER NOT NULL, taux_monetaire NUMERIC(10, 2) DEFAULT NULL, groupe INTEGER DEFAULT NULL, nombre_postes INTEGER DEFAULT NULL, score_equipe INTEGER DEFAULT NULL, note_hierarchique INTEGER DEFAULT NULL, score_collectif INTEGER DEFAULT NULL, montant_calcule NUMERIC(10, 2) NOT NULL, created_at DATETIME NOT NULL --(DC2Type:datetime_immutable)
        , updated_at DATETIME DEFAULT NULL --(DC2Type:datetime_immutable)
        , statut VARCHAR(50) DEFAULT \'En attente\' NOT NULL, submitted_at DATETIME DEFAULT NULL, commentaire CLOB DEFAULT NULL, CONSTRAINT FK_EE5540535B193AB4 FOREIGN KEY (evp_submission_id) REFERENCES evp_submissions (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO primes (id, evp_submission_id, taux_monetaire, groupe, nombre_postes, score_equipe, note_hierarchique, score_collectif, montant_calcule, created_at, updated_at, statut, submitted_at, commentaire) SELECT id, evp_submission_id, taux_monetaire, groupe, nombre_postes, score_equipe, note_hierarchique, score_collectif, montant_calcule, created_at, updated_at, statut, submitted_at, commentaire FROM __temp__primes');
        $this->addSql('DROP TABLE __temp__primes');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_EE5540535B193AB4 ON primes (evp_submission_id)');
    }
}
