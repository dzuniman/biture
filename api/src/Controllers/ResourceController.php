<?php

declare(strict_types=1);

class ResourceController
{
    protected ResourceService $service;

    public function __construct(protected PDO $pdo, protected string $table, protected string $resource, ?ResourceService $service = null)
    {
        $this->service = $service ?? new ResourceService(new PdoResourceRepository($pdo, $table, $resource));
    }

    public function index(string $order = 'id DESC'): array
    {
        return array_map(fn(ResourceEntity $entity): array => serializeRow($this->pdo, $this->resource, $entity->toArray(), false), $this->service->index($order));
    }

    public function show(string $id): array
    {
        return serializeRow($this->pdo, $this->resource, $this->service->show($id)->toArray(), true);
    }

    public function store(array $body): array
    {
        return serializeRow($this->pdo, $this->resource, $this->service->store($body)->toArray(), true);
    }

    public function update(string $id, array $body): void
    {
        $this->service->update($id, $body);
    }

    public function destroy(string $id): void
    {
        $this->service->destroy($id);
    }
}
