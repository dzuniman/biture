<?php

declare(strict_types=1);

abstract class Entity
{
    public function __construct(protected array $attributes = [])
    {
    }

    public function toArray(): array { return $this->attributes; }
    public function get(string $key, mixed $default = null): mixed { return $this->attributes[$key] ?? $default; }
}