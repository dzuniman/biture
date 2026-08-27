<?php

declare(strict_types=1);

final class DocumentFolderService extends ResourceService
{
    public function __construct(private DocumentFolderRepository $folders)
    {
        parent::__construct($folders);
    }

    public function store(array $body): ResourceEntity
    {
        $name = trim((string)($body['name'] ?? ''));
        if ($name === '') throw new InvalidArgumentException('Folder name is required.');
        if (mb_strlen($name) > 255) throw new InvalidArgumentException('Folder name is too long.');

        $parentId = $body['parentId'] ?? null;
        if ($parentId !== null && $parentId !== '') {
            try {
                $this->show((string)$parentId);
            } catch (Throwable $exception) {
                throw new InvalidArgumentException('Parent folder was not found.');
            }
        }

        return parent::store(['name' => $name, 'parentId' => $parentId ?: null]);
    }

    public function update(string $id, array $body): void
    {
        $this->show($id);
        $name = trim((string)($body['name'] ?? ''));
        if ($name === '') throw new InvalidArgumentException('Folder name is required.');
        $parentId = $body['parentId'] ?? null;
        if ($parentId === $id) throw new InvalidArgumentException('A folder cannot be its own parent.');
        if ($parentId !== null && $parentId !== '') {
            $candidate = (string)$parentId;
            while ($candidate !== null) {
                if ($candidate === $id) throw new InvalidArgumentException('A folder cannot be moved inside its own subfolder.');
                $candidate = $this->folders->parentId($candidate);
            }
            $this->show((string)$parentId);
        }
        parent::update($id, ['name' => $name, 'parentId' => $parentId ?: null]);
    }

    public function destroy(string $id): void
    {
        $this->show($id);
        if ($this->folders->hasChildren($id) || $this->folders->hasDocuments($id)) {
            throw new InvalidArgumentException('Move or delete the folder contents before deleting this folder.');
        }
        parent::destroy($id);
    }
}