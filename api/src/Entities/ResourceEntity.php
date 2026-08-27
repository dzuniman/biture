<?php

declare(strict_types=1);

class ResourceEntity extends Entity
{
    public function __construct(array $attributes = [], public readonly string $resource = '')
    {
        parent::__construct($attributes);
    }
}