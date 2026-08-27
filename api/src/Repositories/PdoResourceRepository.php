<?php

declare(strict_types=1);

class PdoResourceRepository implements ResourceRepositoryInterface
{
    public function __construct(private PDO $pdo, private string $table, private string $resource)
    {
    }

    public function all(string $order = 'id DESC'): array
    {
        $parts = preg_split('/\s+/', trim($order));
        $column = $parts[0] ?? 'id';
        $check = $this->pdo->query("SHOW COLUMNS FROM {$this->table} LIKE '" . addslashes($column) . "'");
        if (!$check->fetch()) $column = 'id';
        $direction = isset($parts[1]) && strtoupper($parts[1]) === 'DESC' ? 'DESC' : 'ASC';
        $query = $this->pdo->query("SELECT * FROM {$this->table} ORDER BY " . dbColumn($column) . " $direction");
        return array_map(fn(array $row): ResourceEntity => $this->entity($row), $query->fetchAll(PDO::FETCH_ASSOC));
    }

    public function find(string $id): ?ResourceEntity
    {
        $query = $this->pdo->prepare("SELECT * FROM {$this->table} WHERE " . dbColumn('id') . ' = ?');
        $query->execute([$id]);
        $row = $query->fetch(PDO::FETCH_ASSOC);
        return $row ? $this->entity($row) : null;
    }

    public function create(array $attributes): ResourceEntity
    {
        $row = createRow($this->resource, $attributes);
        $columns = array_map('dbColumn', array_keys($row));
        $marks = implode(',', array_fill(0, count($columns), '?'));
        $this->pdo->prepare("INSERT INTO {$this->table} (" . implode(',', $columns) . ") VALUES ($marks)")->execute(array_values($row));
        return $this->entity($row);
    }

    public function update(string $id, array $attributes): void
    {
        $row = createRow($this->resource, $attributes, false);
        unset($row['id'], $row['created_at']);
        if (!$row) return;
        $sets = implode(',', array_map(fn(string $column): string => dbColumn($column) . ' = ?', array_keys($row)));
        $this->pdo->prepare("UPDATE {$this->table} SET $sets WHERE " . dbColumn('id') . ' = ?')->execute([...array_values($row), $id]);
    }

    public function delete(string $id): void
    {
        $this->pdo->prepare("DELETE FROM {$this->table} WHERE " . dbColumn('id') . ' = ?')->execute([$id]);
    }

    protected function entityClass(): string { return ResourceEntity::class; }
    protected function entity(array $row): ResourceEntity
    {
        $entityClass = $this->entityClass();
        return new $entityClass(databaseRow($row), $this->resource);
    }
}