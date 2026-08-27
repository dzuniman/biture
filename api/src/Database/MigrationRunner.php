<?php

declare(strict_types=1);

final class MigrationRunner
{
    public function __construct(private PDO $pdo, private string $path)
    {
    }

    public function migrate(): array
    {
        $this->pdo->exec('CREATE TABLE IF NOT EXISTS schema_migrations (version VARCHAR(255) PRIMARY KEY, applied_at VARCHAR(255) NOT NULL)');
        $applied = $this->appliedVersions();
        $ran = [];
        $files = glob($this->path . DIRECTORY_SEPARATOR . '*.php') ?: [];
        sort($files, SORT_STRING);
        foreach ($files as $file) {
            $version = pathinfo($file, PATHINFO_FILENAME);
            if (isset($applied[$version])) continue;
            $migration = require $file;
            if (!$migration instanceof Migration) throw new RuntimeException("Migration $version must return a Migration instance");
            try {
                $migration->up($this->pdo);
                $query = $this->pdo->prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)');
                $query->execute([$version, gmdate('c')]);
                if ($this->pdo->inTransaction()) $this->pdo->commit();
            } catch (Throwable $exception) {
                if ($this->pdo->inTransaction()) $this->pdo->rollBack();
                throw $exception;
            }
            $ran[] = $version;
        }
        return $ran;
    }

    private function appliedVersions(): array
    {
        $query = $this->pdo->query('SELECT version FROM schema_migrations');
        return array_fill_keys($query->fetchAll(PDO::FETCH_COLUMN), true);
    }
}

interface Migration
{
    public function up(PDO $pdo): void;
}