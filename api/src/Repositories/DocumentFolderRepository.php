<?php

declare(strict_types=1);

final class DocumentFolderRepository extends PdoResourceRepository
{
    protected function column(string $column): string { return $column; }
    protected function entityClass(): string { return DocumentFolderEntity::class; }

    public function hasChildren(string $id): bool
    {
        $query = $this->pdo->prepare('SELECT 1 FROM ' . $this->table . ' WHERE parent_id = ? LIMIT 1');
        $query->execute([$id]);
        return (bool)$query->fetchColumn();
    }

    public function hasDocuments(string $id): bool
    {
        $query = $this->pdo->prepare('SELECT 1 FROM documents WHERE FolderId = ? LIMIT 1');
        $query->execute([$id]);
        return (bool)$query->fetchColumn();
    }

    public function parentId(string $id): ?string
    {
        $query = $this->pdo->prepare('SELECT parent_id FROM ' . $this->table . ' WHERE id = ?');
        $query->execute([$id]);
        $value = $query->fetchColumn();
        return $value === false || $value === null ? null : (string)$value;
    }
}