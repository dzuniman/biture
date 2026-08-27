<?php

declare(strict_types=1);
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/src/Support/Bootstrap.php';
require_once __DIR__ . '/src/Support/DomainLogic.php';

$envName = getenv('APP_ENV') ?: 'development';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__, ".env.$envName");
$dotenv->load();

try {
    $pdo = Database::connect();
    $dataDir = Database::dataDirectory();
} catch (Throwable $exception) {
    fail('Database initialization failed: ' . $exception->getMessage(), 500);
}

$method = $_SERVER['REQUEST_METHOD'];
$path = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '', '/');
$parts = explode('/', preg_replace('#^api/?#', '', $path));
$resource = strtolower($parts[0] ?? '');
$segment = $parts[1] ?? null;
$action = $parts[2] ?? null;

if ($resource === '' || $resource === 'health') jsonResponse(['status' => 'ok']);
if ($resource === 'ping' && $method === 'GET') jsonResponse((new PingController($pdo, 'ping', 'ping'))->pong());

if ($resource === 'auth' && $method === 'POST' && $segment === 'login') {
    try { jsonResponse((new AuthController())->login($pdo, input())); }
    catch (InvalidArgumentException $exception) { fail($exception->getMessage(), 400); }
    catch (RuntimeException $exception) { fail($exception->getMessage(), 401); }
}

if ($resource === 'products' && $method === 'GET' && $segment === 'by-code') {
    $query = $pdo->prepare('SELECT * FROM ' . Database::table('products') . ' WHERE ' . dbColumn('code') . ' = ?');
    $query->execute([$action]);
    $row = $query->fetch(PDO::FETCH_ASSOC);
    if (!$row) fail('Not found', 404);
    jsonResponse(serializeRow($pdo, $resource, $row, true));
}

requireAuth();
$tableMap = [
    'clients' => 'clients', 'products' => 'products', 'quoteuoms' => 'quoteuoms',
    'users' => 'users', 'quotes' => 'quotes', 'invoices' => 'invoices',
    'jobcards' => 'jobcards', 'deliverynotes' => 'deliverynotes', 'creditnotes' => 'creditnotes',
    'costs' => 'costs', 'statements' => 'statements', 'tools' => 'tools', 'documents' => 'documents', 'folders' => 'document_folders',
];
$controllerMap = [
    'clients' => ClientsController::class, 'products' => ProductsController::class,
    'quoteuoms' => QuoteDescriptionsController::class, 'users' => UsersController::class,
    'quotes' => QuotesController::class, 'invoices' => InvoicesController::class,
    'jobcards' => JobCardsController::class, 'deliverynotes' => DeliveryNotesController::class,
    'creditnotes' => CreditNotesController::class, 'costs' => CostsController::class,
    'statements' => StatementsController::class, 'tools' => ToolsController::class,
    'documents' => DocumentsController::class, 'folders' => ResourceController::class,
];
if (!isset($tableMap[$resource])) fail('Route not found', 404);
if (in_array($resource, ['clients', 'users'], true) && in_array($method, ['POST', 'PUT', 'DELETE'], true)) requireAuth(true);
$controllerType = $controllerMap[$resource];
$container = new Container();
$controller = Application::controller($container, $controllerType, $pdo, Database::table($tableMap[$resource]), $resource);

if ($resource === 'invoices' && $method === 'PATCH' && $action === 'status') {
    $controller->updateStatus($segment, (string)(input()['status'] ?? ''));
    jsonResponse(null, 204);
}
if ($resource === 'costs' && $method === 'POST' && $action === 'duplicate') jsonResponse($controller->duplicate($segment), 201);
if ($resource === 'products' && $method === 'GET' && $segment === 'template') {
    header('Content-Type: text/csv'); header('Content-Disposition: attachment; filename="products-template.csv"');
    echo "code,name,uom,description,price,image\n"; exit;
}
if ($resource === 'products' && $method === 'GET' && $segment === 'search') {
    $query = $pdo->prepare('SELECT * FROM ' . Database::table('products') . ' WHERE ' . dbColumn('code') . ' LIKE ? OR ' . dbColumn('name') . ' LIKE ? ORDER BY ' . dbColumn('code'));
    $term = '%' . ($_GET['query'] ?? '') . '%'; $query->execute([$term, $term]); jsonResponse($query->fetchAll(PDO::FETCH_ASSOC));
}
if ($resource === 'products' && $method === 'GET' && $segment === null) {
    $table = Database::table('products');
    if (isset($_GET['all']) || (!isset($_GET['page']) && !isset($_GET['pageSize']) && !isset($_GET['search']))) {
        $query = $pdo->query("SELECT * FROM $table ORDER BY " . dbColumn('code'));
        $rows = array_map(fn(array $row): array => serializeRow($pdo, 'products', databaseRow($row), false), $query->fetchAll(PDO::FETCH_ASSOC));
        jsonResponse($rows);
    }
    $page = max(1, (int)($_GET['page'] ?? 1));
    $pageSize = min(500, max(1, (int)($_GET['pageSize'] ?? 12)));
    $term = trim((string)($_GET['search'] ?? ''));
    $where = '';
    $parameters = [];
    if ($term !== '') {
        $where = ' WHERE ' . dbColumn('code') . ' LIKE ? OR ' . dbColumn('name') . ' LIKE ? OR ' . dbColumn('description') . ' LIKE ?';
        $like = '%' . $term . '%';
        $parameters = [$like, $like, $like];
    }
    $count = $pdo->prepare("SELECT COUNT(*) FROM $table$where");
    $count->execute($parameters);
    $total = (int)$count->fetchColumn();
    $query = $pdo->prepare("SELECT * FROM $table$where ORDER BY " . dbColumn('code') . ' LIMIT ? OFFSET ?');
    foreach ($parameters as $index => $parameter) $query->bindValue($index + 1, $parameter, PDO::PARAM_STR);
    $query->bindValue(count($parameters) + 1, $pageSize, PDO::PARAM_INT);
    $query->bindValue(count($parameters) + 2, ($page - 1) * $pageSize, PDO::PARAM_INT);
    $query->execute();
    $rows = array_map(fn(array $row): array => serializeRow($pdo, 'products', databaseRow($row), false), $query->fetchAll(PDO::FETCH_ASSOC));
    jsonResponse(['data' => $rows, 'total' => $total, 'page' => $page, 'pageSize' => $pageSize, 'totalPages' => max(1, (int)ceil($total / $pageSize))]);
}
if ($resource === 'documents' && $method === 'GET' && $action === 'download') {
    $document = $controller->show($segment); $path = $document['filePath'] ?? '';
    if (!is_file($path)) fail('File not found on server.', 404);
    header('Content-Type: ' . ($document['contentType'] ?? 'application/octet-stream')); readfile($path); exit;
}
if ($resource === 'documents' && $method === 'POST' && $segment === null) {
    requireAuth(true);
    (new DocumentUploadService($pdo, $dataDir))->upload();
}
if ($resource === 'folders' && $method === 'POST' && $segment === null) {
    try {
        jsonResponse($controller->store(input()), 201);
    } catch (InvalidArgumentException $exception) {
        fail($exception->getMessage(), 400);
    }
}
if ($resource === 'folders' && $method === 'PUT' && $segment) {
    try {
        $controller->update($segment, input());
        jsonResponse(null, 204);
    } catch (InvalidArgumentException $exception) {
        fail($exception->getMessage(), 400);
    }
}
if ($resource === 'folders' && $method === 'DELETE' && $segment) {
    try {
        $controller->destroy($segment);
        jsonResponse(null, 204);
    } catch (InvalidArgumentException $exception) {
        fail($exception->getMessage(), 400);
    }
}
if ($resource === 'products' && $method === 'GET' && $segment === 'images' && !empty($action)) {
    $filePath = $dataDir . DIRECTORY_SEPARATOR . 'products' . DIRECTORY_SEPARATOR . basename($action);
    if (!is_file($filePath)) fail('File not found', 404);
    $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
    $mimeTypes = ['jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'gif' => 'image/gif', 'webp' => 'image/webp', 'svg' => 'image/svg+xml'];
    header('Content-Type: ' . ($mimeTypes[$ext] ?? 'image/jpeg'));
    header('Cache-Control: public, max-age=86400');
    header('Content-Length: ' . filesize($filePath));
    readfile($filePath); exit;
}
if ($resource === 'tools' && $method === 'GET' && $segment === 'images' && !empty($action)) {
    $filePath = $dataDir . DIRECTORY_SEPARATOR . 'tools' . DIRECTORY_SEPARATOR . basename($action);
    if (!is_file($filePath)) fail('File not found', 404);
    $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
    $mimeTypes = ['jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'gif' => 'image/gif', 'webp' => 'image/webp', 'svg' => 'image/svg+xml'];
    header('Content-Type: ' . ($mimeTypes[$ext] ?? 'image/jpeg'));
    header('Cache-Control: public, max-age=86400');
    header('Content-Length: ' . filesize($filePath));
    readfile($filePath); exit;
}
if ($resource === 'quotes' && $method === 'GET' && $segment === 'items' && $action === 'images') {
    $fileName = $parts[3] ?? '';
    $filePath = $dataDir . DIRECTORY_SEPARATOR . 'quote_items' . DIRECTORY_SEPARATOR . basename($fileName);
    if (!$fileName || !is_file($filePath)) fail('File not found', 404);
    $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
    $mimeTypes = ['jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'gif' => 'image/gif', 'webp' => 'image/webp', 'svg' => 'image/svg+xml'];
    header('Content-Type: ' . ($mimeTypes[$ext] ?? 'image/jpeg'));
    header('Cache-Control: public, max-age=86400');
    header('Content-Length: ' . filesize($filePath));
    readfile($filePath); exit;
}
if ($resource === 'products' && $method === 'POST' && in_array($segment, ['upload-image', 'upload-manual'], true)) { requireAuth(true); handleUpload($pdo, $dataDir, 'products'); }
if ($resource === 'tools' && $method === 'POST' && in_array($segment, ['upload-image', 'upload-manual'], true)) { requireAuth(true); handleUpload($pdo, $dataDir, 'tools'); }
if ($resource === 'quotes' && $method === 'POST' && $segment === 'items' && $action === 'images') handleUpload($pdo, $dataDir, 'quote_items');
if ($resource === 'products' && $method === 'POST' && $segment === 'upload-excel') { requireAuth(true); handleProductWorkbook($pdo); }
if ($method === 'GET' && in_array(strtolower((string)$segment), ['next-number', 'nextnumber'], true)) {
    $prefixes = ['quotes' => 'Q', 'invoices' => 'INV', 'statements' => 'ST', 'jobcards' => 'JC', 'deliverynotes' => 'DN', 'creditnotes' => 'CN'];
    if (!isset($prefixes[$resource])) fail('Route not found', 404);
    $column = ['quotes'=>'quote_number','invoices'=>'invoice_number','statements'=>'statement_number','jobcards'=>'job_card_number','deliverynotes'=>'delivery_note_number','creditnotes'=>'credit_note_number'][$resource];
    $table = Database::table($tableMap[$resource]); $prefix = $prefixes[$resource] . date('Ym');
    $dbColumn = dbColumn($column); $query = $pdo->prepare("SELECT $dbColumn FROM $table WHERE $dbColumn LIKE ? ORDER BY $dbColumn DESC LIMIT 1"); $query->execute([$prefix . '%']);
    $last = (string)$query->fetchColumn(); jsonResponse($prefix . str_pad((string)(((int)substr($last, strlen($prefix))) + 1), 4, '0', STR_PAD_LEFT));
}

if ($method === 'GET' && $segment !== null) jsonResponse($controller->show($segment));
if ($method === 'GET') {
    $order = in_array($resource, ['clients', 'products', 'quoteuoms'], true) ? ($resource === 'clients' ? 'name' : ($resource === 'products' ? 'code' : 'value')) : (in_array($resource, ['tools', 'quotes', 'invoices', 'jobcards', 'deliverynotes', 'creditnotes', 'costs', 'statements', 'documents'], true) ? 'created_at DESC' : 'username');
    jsonResponse($controller->index($order));
}
$body = input();
if ($method === 'POST') {
    $created = $controller->store($body);
    if ($resource === 'quotes') saveNestedItems($pdo, 'quoteitems', 'quote_id', $created['id'], $body['items'] ?? []);
    if ($resource === 'costs') saveNestedItems($pdo, 'costquoteitems', 'cost_id', $created['id'], $body['items'] ?? []);
    if ($resource === 'statements') saveNestedItems($pdo, 'statementitems', 'statement_id', $created['id'], $body['items'] ?? []);
    jsonResponse(in_array($resource, ['quotes', 'costs', 'statements'], true) ? $controller->show($created['id']) : $created, 201);
}
if ($method === 'PUT' && $segment) {
    $controller->update($segment, $body);
    foreach (['quotes' => ['quoteitems', 'quote_id'], 'costs' => ['costquoteitems', 'cost_id'], 'statements' => ['statementitems', 'statement_id']] as $type => [$childTable, $foreignKey]) {
        if ($resource === $type) { $pdo->prepare("DELETE FROM $childTable WHERE " . dbColumn($foreignKey) . " = ?")->execute([$segment]); saveNestedItems($pdo, $childTable, $foreignKey, $segment, $body['items'] ?? []); }
    }
    jsonResponse(null, 204);
}
if ($method === 'DELETE' && $segment) { $controller->destroy($segment); jsonResponse(null, 204); }
fail('Route not found', 404);
