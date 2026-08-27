<?php

declare(strict_types=1);

class ResourceService
{
    public function __construct(private ResourceRepositoryInterface $repository)
    {
    }

    public function index(string $order = 'id DESC'): array { return $this->repository->all($order); }
    public function show(string $id): ResourceEntity
    {
        $entity = $this->repository->find($id);
        if (!$entity) fail('Not found', 404);
        return $entity;
    }
    public function store(array $body): ResourceEntity { return $this->repository->create($body); }
    public function update(string $id, array $body): void { $this->repository->update($id, $body); }
    public function destroy(string $id): void { $this->repository->delete($id); }
}