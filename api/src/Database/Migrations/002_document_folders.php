<?php

declare(strict_types=1);

return new class implements Migration
{
    public function up(PDO $pdo): void
    {
        $pdo->exec('CREATE TABLE IF NOT EXISTS document_folders (id CHAR(36) PRIMARY KEY, name VARCHAR(255) NOT NULL, parent_id CHAR(36) NULL, created_at VARCHAR(255) NOT NULL)');
        $columns = $pdo->query('SHOW COLUMNS FROM documents LIKE "FolderId"');
        if (!$columns->fetch()) $pdo->exec('ALTER TABLE documents ADD COLUMN FolderId CHAR(36) NULL');
    }
};