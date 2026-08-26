<?php

declare(strict_types=1);

class ResourceController
{
    public function __construct(protected PDO $pdo, protected string $table, protected string $resource)
    {
    }

    public function index(string $order = 'id DESC'): array
{
    $sql = "SELECT * FROM {$this->table}";
    if ($order) {
        $sql .= " ORDER BY $order";
    }
    $rows = $this->pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);
    return array_map(fn(array $row): array => serializeRow($this->pdo, $this->resource, $row, false), $rows);
}

    public function show(string $id): array
    {
        $query = $this->pdo->prepare("SELECT * FROM {$this->table} WHERE id = ?");
        $query->execute([$id]);
        $row = $query->fetch(PDO::FETCH_ASSOC);
        if (!$row) fail('Not found', 404);
        return serializeRow($this->pdo, $this->resource, $row, true);
    }

    public function store(array $body): array
    {
        $row = createRow($this->resource, $body);
        $columns = array_keys($row);
        $marks = implode(',', array_fill(0, count($columns), '?'));
        $this->pdo->prepare("INSERT INTO {$this->table} (" . implode(',', $columns) . ") VALUES ($marks)")->execute(array_values($row));
        return serializeRow($this->pdo, $this->resource, $row, true);
    }

    public function update(string $id, array $body): void
    {
        $row = createRow($this->resource, $body, false);
        unset($row['id'], $row['created_at']);
        if (!$row) return;
        $sets = implode(',', array_map(fn(string $column): string => "$column = ?", array_keys($row)));
        $this->pdo->prepare("UPDATE {$this->table} SET $sets WHERE id = ?")->execute([...array_values($row), $id]);
    }

    public function destroy(string $id): void
    {
        $this->pdo->prepare("DELETE FROM {$this->table} WHERE id = ?")->execute([$id]);
    }
}
