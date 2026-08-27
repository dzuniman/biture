<?php

declare(strict_types=1);

final class Container
{
    private array $bindings = [];
    private array $instances = [];

    public function singleton(string $abstract, callable $factory): void { $this->bindings[$abstract] = $factory; }
    public function get(string $abstract): mixed
    {
        if (array_key_exists($abstract, $this->instances)) return $this->instances[$abstract];
        if (!isset($this->bindings[$abstract])) throw new RuntimeException("No binding registered for $abstract");
        return $this->instances[$abstract] = ($this->bindings[$abstract])($this);
    }
}