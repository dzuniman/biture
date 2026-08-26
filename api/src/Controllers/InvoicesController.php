<?php

declare(strict_types=1);
require_once __DIR__ . '/ResourceController.php';
final class InvoicesController extends ResourceController
{
    public function updateStatus(string $id, string $status): void
    {
        $query = $this->pdo->prepare('UPDATE invoices SET ' . dbColumn('status') . ' = ? WHERE ' . dbColumn('id') . ' = ?');
        $query->execute([$status, $id]);
        if ($query->rowCount() === 0) fail('Not found', 404);
    }
}
