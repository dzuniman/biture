<?php

declare(strict_types=1);

require_once __DIR__ . '/ResourceController.php';

final class PingController extends ResourceController
{
    public function pong(): array { return ['status' => 'ok', 'message' => 'Boom! API is alive again']; }
}
