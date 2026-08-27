<?php

declare(strict_types=1);

interface ResourceRepositoryInterface
{
    public function all(string $order = 'id DESC'): array;
    public function find(string $id): ?ResourceEntity;
    public function create(array $attributes): ResourceEntity;
    public function update(string $id, array $attributes): void;
    public function delete(string $id): void;
}