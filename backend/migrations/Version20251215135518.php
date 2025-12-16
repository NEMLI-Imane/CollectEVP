<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251215135518 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE conges (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, evp_submission_id INTEGER NOT NULL, date_debut DATE DEFAULT NULL, date_fin DATE DEFAULT NULL, nombre_jours INTEGER DEFAULT NULL, tranche INTEGER DEFAULT NULL, avance_sur_conge BOOLEAN DEFAULT 0, montant_avance NUMERIC(10, 2) DEFAULT NULL, indemnite_forfaitaire NUMERIC(10, 2) DEFAULT NULL, indemnite_calculee NUMERIC(10, 2) DEFAULT NULL, created_at DATETIME NOT NULL --(DC2Type:datetime_immutable)
        , updated_at DATETIME DEFAULT NULL --(DC2Type:datetime_immutable)
        , CONSTRAINT FK_6327DE3A5B193AB4 FOREIGN KEY (evp_submission_id) REFERENCES evp_submissions (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_6327DE3A5B193AB4 ON conges (evp_submission_id)');
        $this->addSql('CREATE TABLE primes (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, evp_submission_id INTEGER NOT NULL, taux_monetaire NUMERIC(10, 2) DEFAULT NULL, groupe INTEGER DEFAULT NULL, nombre_postes INTEGER DEFAULT NULL, score_equipe INTEGER DEFAULT NULL, note_hierarchique INTEGER DEFAULT NULL, score_collectif INTEGER DEFAULT NULL, montant_calcule NUMERIC(10, 2) NOT NULL, created_at DATETIME NOT NULL --(DC2Type:datetime_immutable)
        , updated_at DATETIME DEFAULT NULL --(DC2Type:datetime_immutable)
        , CONSTRAINT FK_EE5540535B193AB4 FOREIGN KEY (evp_submission_id) REFERENCES evp_submissions (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_EE5540535B193AB4 ON primes (evp_submission_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP TABLE conges');
        $this->addSql('DROP TABLE primes');
    }
}
