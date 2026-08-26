<?php

declare(strict_types=1);
require_once __DIR__ . '/ResourceController.php';

final class CostsController extends ResourceController
{
    public function duplicate(string $id): array
    {
        $original = $this->show($id);
        $body = $original;
        unset($body['id'], $body['createdAt'], $body['items'], $body['itemCount'], $body['totalQuoteAmount']);
        $body['description'] = ($body['description'] ?? '') . ' - Copy';
        $copy = $this->store($body);
        foreach ($original['items'] ?? [] as $item) {
            $this->pdo->prepare('INSERT INTO costquoteitems (Id,CostId,ItemNumber,Quantity,Uom,Description,UnitPrice,SupplierName,SupplierDescription,SupplierCost,OtherName,OtherDescription,OtherCost) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)')->execute([
                uuid(), $copy['id'], $item['itemNumber'], $item['quantity'], $item['uom'], $item['description'], $item['unitPrice'], $item['supplierName'], $item['supplierDescription'], $item['supplierCost'], $item['otherName'], $item['otherDescription'], $item['otherCost'],
            ]);
        }
        return $this->show($copy['id']);
    }
}
