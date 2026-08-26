<?php

declare(strict_types=1);

require_once __DIR__ . '/ResourceController.php';
final class PingController extends ResourceController
{
    public function pong(): array
    {
        return ['status' => 'ok', 'message' => 'Boom! API is alive again'];
    }
}
final class ClientsController extends ResourceController {}
final class ProductsController extends ResourceController {}
final class QuoteDescriptionsController extends ResourceController {}
final class QuotesController extends ResourceController {}
final class InvoicesController extends ResourceController
{
	public function updateStatus(string $id, string $status): void
	{
		$query = $this->pdo->prepare('UPDATE invoices SET status = ? WHERE id = ?');
		$query->execute([$status, $id]);
		if ($query->rowCount() === 0) fail('Not found', 404);
	}
}
final class JobCardsController extends ResourceController {}
final class DeliveryNotesController extends ResourceController {}
final class CreditNotesController extends ResourceController {}
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
			$item['costId'] = $copy['id'];
			$this->pdo->prepare('INSERT INTO cost_items (id,cost_id,item_number,quantity,uom,description,unit_price,supplier_name,supplier_description,supplier_cost,other_name,other_description,other_cost) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)')->execute([
				uuid(), $copy['id'], $item['itemNumber'], $item['quantity'], $item['uom'], $item['description'], $item['unitPrice'], $item['supplierName'], $item['supplierDescription'], $item['supplierCost'], $item['otherName'], $item['otherDescription'], $item['otherCost'],
			]);
		}
		return $this->show($copy['id']);
	}
}
final class StatementsController extends ResourceController {}
final class ToolsController extends ResourceController {}
final class DocumentsController extends ResourceController {}
final class UsersController extends ResourceController {}