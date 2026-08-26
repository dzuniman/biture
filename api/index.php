<?php
declare(strict_types=1);

require_once __DIR__ . '/src/Controllers/AuthController.php';
require_once __DIR__ . '/src/Controllers/ResourceController.php';
require_once __DIR__ . '/src/Controllers/DomainControllers.php';
$autoload = __DIR__ . '/vendor/autoload.php';
if (is_file($autoload)) require_once $autoload;

// Quote2Cash PHP API. Run locally with: php -S localhost:5227 -t api api/index.php

$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header('Access-Control-Allow-Origin: ' . $origin);
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Credentials: true');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$root = __DIR__;
$dataDir = getenv('DATA_DIR') ?: $root . DIRECTORY_SEPARATOR . 'data';
if (!is_dir($dataDir)) { mkdir($dataDir, 0775, true); }
$uploadDirs = ['documents', 'products', 'quote_items', 'tools'];
foreach ($uploadDirs as $dir) { if (!is_dir($dataDir . DIRECTORY_SEPARATOR . $dir)) { mkdir($dataDir . DIRECTORY_SEPARATOR . $dir, 0775, true); } }

function jsonResponse(mixed $value, int $status = 200): never {
    http_response_code($status); header('Content-Type: application/json');
    echo json_encode($value, JSON_UNESCAPED_SLASHES); exit;
}
function fail(string $message, int $status): never { jsonResponse(['message' => $message], $status); }
function input(): array { $raw = file_get_contents('php://input'); return $raw ? (json_decode($raw, true) ?: []) : []; }
function uuid(): string { return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x', random_int(0, 65535), random_int(0, 65535), random_int(0, 65535), random_int(16384, 20479), random_int(32768, 49151), random_int(0, 65535), random_int(0, 65535), random_int(0, 65535)); }
function now(): string { return gmdate('Y-m-d\TH:i:s\Z'); }
function value(array $data, string $key, mixed $default = null): mixed { return array_key_exists($key, $data) ? $data[$key] : $default; }
function tokenUser(): ?array {
    return TokenService::userFromRequest();
}
function requireAuth(bool $admin = false): array {
    $user = tokenUser(); if (!$user) fail('Unauthorized', 401);
    if ($admin && ($user['role'] ?? '') !== 'Admin') fail('Forbidden', 403);
    return $user;
}
function publicUser(array $row): array { return ['id' => $row['id'], 'username' => $row['username'], 'role' => $row['role']]; }

function databaseUrl(): ?string {
    $url = getenv('DATABASE_URL');
    if ($url) return $url;
    $settingsPath = __DIR__ . '/../Quote2Cash.API/appsettings.json';
    if (!is_file($settingsPath)) return 'postgres://postgres:password@127.0.0.1:5432/Biture';
    $settings = json_decode((string)file_get_contents($settingsPath), true);
    $connection = $settings['ConnectionStrings']['Quote2Cash'] ?? null;
    if (!$connection) return 'postgres://postgres:password@127.0.0.1:5432/Biture';
    $values = [];
    foreach (explode(';', $connection) as $part) {
        if (str_contains($part, '=')) { [$key, $value] = explode('=', $part, 2); $values[strtolower(trim($key))] = trim($value); }
    }
    if (!isset($values['host'], $values['database'], $values['username'])) return null;
    return 'pgsql:host=' . $values['host'] . ';port=' . ($values['port'] ?? '5432') . ';dbname=' . $values['database'] . ';user=' . $values['username'] . ';password=' . ($values['password'] ?? '');
}

function postgresDsn(string $url): string {
    if (str_starts_with($url, 'pgsql:')) return $url;
    $parsed = parse_url($url);
    if (!$parsed || empty($parsed['host'])) throw new RuntimeException('DATABASE_URL must be a PostgreSQL URL such as postgres://user:password@host:5432/database');
    $dsn = 'pgsql:host=' . $parsed['host'] . ';port=' . ($parsed['port'] ?? 5432) . ';dbname=' . ltrim($parsed['path'] ?? '', '/');
    if (isset($parsed['user'])) $dsn .= ';user=' . rawurldecode($parsed['user']);
    if (isset($parsed['pass'])) $dsn .= ';password=' . rawurldecode($parsed['pass']);
    return $dsn;
}

function installPostgresCompatibilityViews(PDO $pdo): void {
    $views = [
        'users' => 'SELECT "Id" AS id, "Username" AS username, "PasswordHash" AS password_hash, "Role" AS role, "CreatedAt" AS created_at FROM "Users"',
        'clients' => 'SELECT "Id" AS id, "Name" AS name, "VendorNumber" AS vendor_number, "AddressLine1" AS address_line1, "AddressLine2" AS address_line2, "AddressLine3" AS address_line3, "AddressLine4" AS address_line4, "RepresentativeName" AS representative_name, "RepresentativeNumber" AS representative_number, "VatNumber" AS vat_number, "Email" AS email, "CreatedAt" AS created_at, "UpdatedAt" AS updated_at FROM "Clients"',
        'products' => 'SELECT "Id" AS id, "Code" AS code, "Name" AS name, "Uom" AS uom, "Description" AS description, "Price" AS price, "Image" AS image FROM "Products"',
        'quote_descriptions' => 'SELECT "Id" AS id, "Code" AS code, "Uom" AS uom, "Description" AS description, "Code" AS value FROM "QuoteDescriptions"',
        'quotes' => 'SELECT "Id" AS id, "QuoteNumber" AS quote_number, "Reference" AS reference, "Date" AS date, "ValidityDays" AS validity_days, "ClientId" AS client_id, "PONumber" AS po_number, "Margin" AS margin, "Description" AS description, "Status" AS status, "CreatedAt" AS created_at, "DueDate" AS due_date FROM "Quotes"',
        'quote_items' => 'SELECT "Id" AS id, "QuoteId" AS quote_id, "ItemNumber" AS item_number, "Quantity" AS quantity, "Code" AS code, "Uom" AS uom, "Description" AS description, "UnitPrice" AS unit_price, "TotalPrice" AS total_price, "ImagePath" AS image_path, "ProductId" AS product_id FROM "QuoteItems"',
        'invoices' => 'SELECT "Id" AS id, "ClientId" AS client_id, "QuoteId" AS quote_id, "InvoiceNumber" AS invoice_number, "Description" AS description, "Amount" AS amount, "Status" AS status, "CreatedAt" AS created_at, "DueDate" AS due_date FROM "Invoices"',
        'job_cards' => 'SELECT "Id" AS id, "JobCardNumber" AS job_card_number, "Reference" AS reference, "QuoteNumber" AS quote_number, "Description" AS description, "CreatedAt" AS created_at FROM "JobCards"',
        'delivery_notes' => 'SELECT "Id" AS id, "DeliveryNoteNumber" AS delivery_note_number, "Reference" AS reference, "QuoteNumber" AS quote_number, "Description" AS description, "CreatedAt" AS created_at FROM "DeliveryNotes"',
        'credit_notes' => 'SELECT "Id" AS id, "ClientId" AS client_id, "CreditNoteNumber" AS credit_note_number, "Description" AS description, "Amount" AS amount, "CreatedAt" AS created_at FROM "CreditNotes"',
        'costs' => 'SELECT "Id" AS id, "Description" AS description, "Margin" AS margin, "Date" AS date FROM "Costs"',
        'cost_items' => 'SELECT "Id" AS id, "CostId" AS cost_id, "ItemNumber" AS item_number, "Quantity" AS quantity, "Uom" AS uom, "Description" AS description, "UnitPrice" AS unit_price, "SupplierName" AS supplier_name, "SupplierDescription" AS supplier_description, "SupplierCost" AS supplier_cost, "OtherName" AS other_name, "OtherDescription" AS other_description, "OtherCost" AS other_cost FROM "CostQuoteItems"',
        'statements' => 'SELECT "Id" AS id, "StatementNumber" AS statement_number, "DueDays" AS due_days, "ClientId" AS client_id, "CreatedAt" AS created_at FROM "Statements"',
        'statement_items' => 'SELECT "Id" AS id, "StatementId" AS statement_id, "InvoiceId" AS invoice_id, "CreditNoteId" AS credit_note_id, "PaymentAmount" AS payment_amount, "Description" AS description, "PaymentDate" AS payment_date FROM "StatementItems"',
        'documents' => 'SELECT "Id" AS id, "DocumentName" AS document_name, "Description" AS description, "FileName" AS file_name, "FilePath" AS file_path, "ContentType" AS content_type, "UploadedAt" AS uploaded_at FROM "Documents"',
        'tools' => 'SELECT "Id" AS id, "Code" AS code, "Description" AS description, "Quantity" AS quantity, "Location" AS location, "ImagePath" AS image_path, "Value" AS value, "InspectionDate" AS inspection_date FROM "Tools"',
    ];
    foreach ($views as $name => $select) {
        $exists = $pdo->prepare('SELECT to_regclass(?)'); $exists->execute([$name]);
        if ($exists->fetchColumn() === null) $pdo->exec("CREATE VIEW $name AS $select");
    }
}

try {
    $databaseUrl = databaseUrl();
    if ($databaseUrl) {
        if (!in_array('pgsql', PDO::getAvailableDrivers(), true)) throw new RuntimeException('The PHP PostgreSQL extension is not enabled. Enable pdo_pgsql in php.ini.');
        $pdo = new PDO(postgresDsn($databaseUrl), null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
        $legacyCheck = $pdo->prepare('SELECT to_regclass(?)');
        $legacyCheck->execute(['"Users"']);
        $legacySchema = (bool)$legacyCheck->fetchColumn();
    } elseif (!in_array('sqlite', PDO::getAvailableDrivers(), true)) {
        throw new RuntimeException('SQLite support is not enabled. Start PHP with: php -c api/php.ini -S localhost:5227 -t api api/index.php');
    } else {
        $pdo = new PDO('sqlite:' . $dataDir . DIRECTORY_SEPARATOR . 'quote2cash.sqlite', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        $pdo->exec('PRAGMA foreign_keys = ON');
    }
    $driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
    if ($driver !== 'sqlite') { $pdo->exec('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'); }
    $id = $driver === 'sqlite' ? 'TEXT' : 'uuid';
    $text = $driver === 'sqlite' ? 'TEXT' : 'TEXT';
    $schema = [
        "CREATE TABLE IF NOT EXISTS users (id $id PRIMARY KEY, username $text NOT NULL UNIQUE, password_hash $text NOT NULL, role $text NOT NULL, created_at $text NOT NULL)",
        "CREATE TABLE IF NOT EXISTS clients (id $id PRIMARY KEY, name $text NOT NULL, vendor_number $text, address_line1 $text, address_line2 $text, address_line3 $text, address_line4 $text, representative_name $text, representative_number $text, vat_number $text, email $text, created_at $text NOT NULL, updated_at $text)",
        "CREATE TABLE IF NOT EXISTS products (id $id PRIMARY KEY, code $text NOT NULL UNIQUE, name $text NOT NULL, uom $text NOT NULL, description $text, price NUMERIC NOT NULL DEFAULT 0, image $text)",
        "CREATE TABLE IF NOT EXISTS quote_descriptions (id $id PRIMARY KEY, value $text NOT NULL UNIQUE)",
        "CREATE TABLE IF NOT EXISTS quotes (id $id PRIMARY KEY, quote_number $text NOT NULL, reference $text, date $text NOT NULL, validity_days INTEGER NOT NULL, client_id $id, po_number $text, margin NUMERIC NOT NULL DEFAULT 0, description $text, status $text, created_at $text NOT NULL, due_date $text)",
        "CREATE TABLE IF NOT EXISTS quote_items (id $id PRIMARY KEY, quote_id $id NOT NULL, item_number INTEGER NOT NULL, quantity NUMERIC NOT NULL, code $text, uom $text, description $text, unit_price NUMERIC NOT NULL, total_price NUMERIC NOT NULL, image_path $text, product_id $id)",
        "CREATE TABLE IF NOT EXISTS invoices (id $id PRIMARY KEY, client_id $id, quote_id $id, invoice_number $text NOT NULL, description $text, amount NUMERIC NOT NULL, status $text NOT NULL, created_at $text NOT NULL, due_date $text NOT NULL)",
        "CREATE TABLE IF NOT EXISTS job_cards (id $id PRIMARY KEY, job_card_number $text NOT NULL, reference $text, quote_number $text NOT NULL, description $text, created_at $text NOT NULL)",
        "CREATE TABLE IF NOT EXISTS delivery_notes (id $id PRIMARY KEY, delivery_note_number $text NOT NULL, reference $text, quote_number $text NOT NULL, description $text, created_at $text NOT NULL)",
        "CREATE TABLE IF NOT EXISTS credit_notes (id $id PRIMARY KEY, client_id $id NOT NULL, credit_note_number $text NOT NULL, description $text, amount NUMERIC NOT NULL, created_at $text NOT NULL)",
        "CREATE TABLE IF NOT EXISTS costs (id $id PRIMARY KEY, description $text, margin NUMERIC NOT NULL, date $text NOT NULL)",
        "CREATE TABLE IF NOT EXISTS cost_items (id $id PRIMARY KEY, cost_id $id NOT NULL, item_number INTEGER NOT NULL, quantity NUMERIC NOT NULL, uom $text, description $text, unit_price NUMERIC NOT NULL, supplier_name $text, supplier_description $text, supplier_cost NUMERIC NOT NULL, other_name $text, other_description $text, other_cost NUMERIC NOT NULL)",
        "CREATE TABLE IF NOT EXISTS statements (id $id PRIMARY KEY, statement_number $text NOT NULL, due_days INTEGER NOT NULL DEFAULT 30, client_id $id NOT NULL, created_at $text NOT NULL)",
        "CREATE TABLE IF NOT EXISTS statement_items (id $id PRIMARY KEY, statement_id $id NOT NULL, invoice_id $id, credit_note_id $id, payment_amount NUMERIC NOT NULL, description $text, payment_date $text NOT NULL)",
        "CREATE TABLE IF NOT EXISTS documents (id $id PRIMARY KEY, document_name $text NOT NULL UNIQUE, description $text, file_name $text NOT NULL, file_path $text NOT NULL, content_type $text NOT NULL, uploaded_at $text NOT NULL)",
        "CREATE TABLE IF NOT EXISTS tools (id $id PRIMARY KEY, code $text NOT NULL, description $text, quantity NUMERIC NOT NULL, location $text, image_path $text, value NUMERIC NOT NULL, inspection_date $text)"
    ];
    if (empty($legacySchema)) foreach ($schema as $statement) $pdo->exec($statement);
    if (!empty($legacySchema)) installPostgresCompatibilityViews($pdo);
    $count = (int)$pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
    if ($count === 0) {
        $seed = $pdo->prepare('INSERT INTO users (id, username, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)');
        $seed->execute([uuid(), 'admin', password_hash('adminpass', PASSWORD_DEFAULT), 'Admin', now()]);
        $seed->execute([uuid(), 'user', password_hash('userpass', PASSWORD_DEFAULT), 'User', now()]);
    }
} catch (Throwable $e) { fail('Database initialization failed: ' . $e->getMessage(), 500); }

$method = $_SERVER['REQUEST_METHOD'];
$path = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '', '/');
$parts = explode('/', preg_replace('#^api/?#', '', $path));
$resource = strtolower($parts[0] ?? ''); $segment = $parts[1] ?? null; $action = $parts[2] ?? null;

if ($resource === 'auth' && $method === 'POST' && $segment === 'login') {
    try { jsonResponse((new AuthController())->login($pdo, input())); }
    catch (InvalidArgumentException $e) { fail($e->getMessage(), 400); }
    catch (RuntimeException $e) { fail($e->getMessage(), 401); }
}

$adminResources = ['clients', 'users'];
if ($resource === '' || $resource === 'health') jsonResponse(['status' => 'ok']);

if ($method === 'GET' && $resource === 'products' && $segment === 'by-code') {
    $q = $pdo->prepare('SELECT * FROM products WHERE code = ?'); $q->execute([$action]); $row = $q->fetch(PDO::FETCH_ASSOC);
    if (!$row) fail('Not found', 404); jsonResponse(serializeRow($pdo, $resource, $row, true));
}
// Ping endpoint using PingController
if ($resource === 'ping' && $method === 'GET') {
    $controller = new PingController($pdo, $resource, $resource);
    jsonResponse($controller->pong());
}
requireAuth();
if ($resource === 'documents' && $action === 'download' && $method === 'GET') {
    requireAuth(); $q = $pdo->prepare('SELECT * FROM documents WHERE id = ?'); $q->execute([$segment]); $doc = $q->fetch(PDO::FETCH_ASSOC);
    if (!$doc || !is_file($doc['file_path'])) fail('Not found', 404); header('Content-Type: ' . $doc['content_type']); header('Content-Disposition: attachment; filename="' . basename($doc['document_name']) . '"'); readfile($doc['file_path']); exit;
}
if ($method === 'GET' && in_array($resource, ['products', 'tools', 'quotes'], true) && (($segment === 'images') || ($resource === 'quotes' && $segment === 'items'))) {
    $fileName = $resource === 'quotes' ? ($parts[4] ?? '') : ($parts[2] ?? '');
    $kind = $resource === 'quotes' ? 'quote_items' : $resource;
    $filePath = $dataDir . DIRECTORY_SEPARATOR . $kind . DIRECTORY_SEPARATOR . basename($fileName);
    if (!is_file($filePath)) fail('Not found', 404);
    header('Content-Type: ' . (mime_content_type($filePath) ?: 'application/octet-stream')); readfile($filePath); exit;
}

$numberPrefixes = ['quotes' => ['Q', 'quote_number'], 'invoices' => ['INV', 'invoice_number'], 'statements' => ['ST', 'statement_number'], 'jobcards' => ['JC', 'job_card_number'], 'deliverynotes' => ['DN', 'delivery_note_number'], 'creditnotes' => ['CN', 'credit_note_number']];
if (isset($numberPrefixes[$resource]) && $method === 'GET' && in_array(strtolower((string)$segment), ['next-number', 'nextnumber'], true)) {
    [$prefix, $column] = $numberPrefixes[$resource]; $month = date('Ym'); $like = $prefix . $month . '%'; $table = $resource === 'jobcards' ? 'job_cards' : ($resource === 'deliverynotes' ? 'delivery_notes' : ($resource === 'creditnotes' ? 'credit_notes' : $resource));
    $q = $pdo->prepare("SELECT $column FROM $table WHERE $column LIKE ? ORDER BY $column DESC LIMIT 1"); $q->execute([$like]); $last = (string)$q->fetchColumn(); $next = $prefix . $month . str_pad((string)(((int)substr($last, strlen($prefix . $month))) + 1), 4, '0', STR_PAD_LEFT); jsonResponse($next);
}

$tableMap = ['clients' => 'clients', 'products' => 'products', 'quoteuoms' => 'quote_descriptions', 'users' => 'users', 'quotes' => 'quotes', 'invoices' => 'invoices', 'jobcards' => 'job_cards', 'deliverynotes' => 'delivery_notes', 'creditnotes' => 'credit_notes', 'costs' => 'costs', 'statements' => 'statements', 'tools' => 'tools', 'documents' => 'documents'];
if (!isset($tableMap[$resource])) fail('Route not found', 404);
$table = $tableMap[$resource];
$controllerTypes = ['clients' => ClientsController::class, 'products' => ProductsController::class, 'quoteuoms' => QuoteDescriptionsController::class, 'users' => UsersController::class, 'quotes' => QuotesController::class, 'invoices' => InvoicesController::class, 'jobcards' => JobCardsController::class, 'deliverynotes' => DeliveryNotesController::class, 'creditnotes' => CreditNotesController::class, 'costs' => CostsController::class, 'statements' => StatementsController::class, 'tools' => ToolsController::class, 'documents' => DocumentsController::class];
$controllerType = $controllerTypes[$resource];
$controller = new $controllerType($pdo, $table, $resource);

if ($resource === 'invoices' && $method === 'PATCH' && $action === 'status') {
    requireAuth(); $body = input(); $controller->updateStatus($segment, (string)($body['status'] ?? '')); jsonResponse(null, 204);
}
if ($resource === 'costs' && $method === 'POST' && $action === 'duplicate') {
    requireAuth(); jsonResponse($controller->duplicate($segment), 201);
}
if ($method === 'GET' && $resource === 'products' && $segment === 'template') {
    header('Content-Type: text/csv'); header('Content-Disposition: attachment; filename="products-template.csv"');
    echo "code,name,uom,description,price,image\n"; exit;
}
if ($method === 'GET' && $action === null && $segment === 'search' && $resource === 'products') { $q = $pdo->prepare('SELECT * FROM products WHERE code LIKE ? OR name LIKE ? ORDER BY code'); $term = '%' . ($_GET['query'] ?? '') . '%'; $q->execute([$term, $term]); jsonResponse($q->fetchAll(PDO::FETCH_ASSOC)); }
if ($method === 'GET' && $segment !== null && $action === null) jsonResponse($controller->show($segment));
if ($method === 'GET') { $order = in_array($resource, ['clients', 'products', 'quoteuoms'], true) ? ($resource === 'clients' ? 'name' : ($resource === 'products' ? 'code' : 'value')) : (in_array($resource, ['tools', 'quotes', 'invoices', 'jobcards', 'deliverynotes', 'creditnotes', 'costs', 'statements', 'documents'], true) ? 'created_at DESC' : 'username'); jsonResponse($controller->index($order)); }

if ($method === 'POST' && $resource === 'documents') { requireAuth(); handleUpload($pdo, $dataDir, 'documents'); }
if ($method === 'POST' && in_array($resource, ['products', 'tools'], true) && in_array($segment, ['upload-image', 'upload-manual'], true)) { requireAuth(true); handleUpload($pdo, $dataDir, $resource); }
if ($method === 'POST' && $resource === 'quotes' && $segment === 'items' && $action === 'images' && ($parts[3] ?? '') === 'upload') { handleUpload($pdo, $dataDir, 'quote_items'); }
if ($method === 'POST' && $resource === 'products' && $segment === 'upload-excel') { requireAuth(true); handleProductWorkbook($pdo); }

$body = input(); if ($method === 'POST') {
    if (in_array($resource, $adminResources, true)) requireAuth(true); else requireAuth();
    $created = $controller->store($body);
    if ($resource === 'quotes') saveNestedItems($pdo, 'quote_items', 'quote_id', $created['id'], $body['items'] ?? []);
    if ($resource === 'costs') saveNestedItems($pdo, 'cost_items', 'cost_id', $created['id'], $body['items'] ?? []);
    if ($resource === 'statements') saveNestedItems($pdo, 'statement_items', 'statement_id', $created['id'], $body['items'] ?? []);
    if (in_array($resource, ['quotes', 'costs', 'statements'], true)) $created = $controller->show($created['id']);
    jsonResponse($created, 201);
}
if ($method === 'PUT' && $segment) {
    if (in_array($resource, $adminResources, true)) requireAuth(true); else requireAuth(); $controller->update($segment, $body);
    if ($resource === 'quotes') { $pdo->prepare('DELETE FROM quote_items WHERE quote_id = ?')->execute([$segment]); saveNestedItems($pdo, 'quote_items', 'quote_id', $segment, $body['items'] ?? []); }
    if ($resource === 'costs') { $pdo->prepare('DELETE FROM cost_items WHERE cost_id = ?')->execute([$segment]); saveNestedItems($pdo, 'cost_items', 'cost_id', $segment, $body['items'] ?? []); }
    if ($resource === 'statements') { $pdo->prepare('DELETE FROM statement_items WHERE statement_id = ?')->execute([$segment]); saveNestedItems($pdo, 'statement_items', 'statement_id', $segment, $body['items'] ?? []); }
    jsonResponse(null, 204);
}
if ($method === 'DELETE' && $segment) { if (in_array($resource, $adminResources, true)) requireAuth(true); else requireAuth(); $controller->destroy($segment); jsonResponse(null, 204); }
fail('Route not found', 404);

function createRow(string $resource, array $body, bool $new = true): array {
    $map = ['quoteuoms' => [], 'clients' => ['vendorNumber' => 'vendor_number', 'addressLine1' => 'address_line1', 'addressLine2' => 'address_line2', 'addressLine3' => 'address_line3', 'addressLine4' => 'address_line4', 'representativeName' => 'representative_name', 'representativeNumber' => 'representative_number', 'vatNumber' => 'vat_number', 'createdAt' => 'created_at', 'updatedAt' => 'updated_at'], 'users' => ['password' => 'password_hash', 'createdAt' => 'created_at'], 'quotes' => ['quoteNumber' => 'quote_number', 'validityDays' => 'validity_days', 'clientId' => 'client_id', 'poNumber' => 'po_number', 'createdAt' => 'created_at', 'dueDate' => 'due_date'], 'invoices' => ['invoiceNumber' => 'invoice_number', 'clientId' => 'client_id', 'quoteId' => 'quote_id', 'createdAt' => 'created_at', 'dueDate' => 'due_date'], 'jobcards' => ['jobCardNumber' => 'job_card_number', 'quoteNumber' => 'quote_number', 'createdAt' => 'created_at'], 'deliverynotes' => ['deliveryNoteNumber' => 'delivery_note_number', 'quoteNumber' => 'quote_number', 'createdAt' => 'created_at'], 'creditnotes' => ['creditNoteNumber' => 'credit_note_number', 'clientId' => 'client_id', 'createdAt' => 'created_at'], 'costs' => [], 'statements' => ['statementNumber' => 'statement_number', 'dueDays' => 'due_days', 'clientId' => 'client_id', 'createdAt' => 'created_at'], 'tools' => ['imagePath' => 'image_path', 'inspectionDate' => 'inspection_date'], 'products' => [], 'documents' => ['documentName' => 'document_name', 'fileName' => 'file_name', 'filePath' => 'file_path', 'contentType' => 'content_type', 'uploadedAt' => 'uploaded_at']];
    $aliases = $map[$resource] ?? []; $row = [];
    if ($new) $row['id'] = uuid();
    $computed = ['items', 'client', 'quote', 'product', 'id', 'subTotal', 'vat', 'total', 'itemCount', 'totalQuoteAmount', 'isOverdue'];
    foreach ($body as $key => $val) { if ($key === 'password') $val = password_hash((string)$val, PASSWORD_DEFAULT); $column = $aliases[$key] ?? lcfirstToSnake($key); if (!in_array($column, $computed, true)) $row[$column] = $val; }
    if ($new && in_array($resource, ['clients', 'users', 'quotes', 'invoices', 'jobcards', 'deliverynotes', 'creditnotes', 'statements', 'documents'], true)) $row['created_at'] ??= now();
    if ($new && $resource === 'users') $row['role'] ??= 'User';
    if ($new && $resource === 'quotes') { $row['status'] ??= ''; $row['description'] ??= ''; }
    if ($new && $resource === 'invoices') { $row['amount'] ??= 0; $row['description'] ??= ''; }
    if ($new && $resource === 'costs') $row['margin'] ??= 0;
    if ($new && $resource === 'tools') { $row['quantity'] ??= 0; $row['value'] ??= 0; }
    return $row;
}
function lcfirstToSnake(string $key): string { return strtolower(preg_replace('/(?<!^)[A-Z]/', '_$0', $key)); }
function serializeRow(PDO $pdo, string $resource, array $row, bool $detail): array {
    foreach ($row as $key => $val) { $camel = preg_replace_callback('/_([a-z])/', fn($m) => strtoupper($m[1]), $key); unset($row[$key]); $row[$camel] = is_numeric($val) && in_array($key, ['amount','price','margin','quantity','unit_price','total_price','value','supplier_cost','other_cost','payment_amount'], true) ? (float)$val : $val; }
    unset($row['passwordHash'], $row['password_hash'], $row['filePath']);
    if ($resource === 'quotes') { $items = $pdo->prepare('SELECT * FROM quote_items WHERE quote_id = ? ORDER BY item_number'); $items->execute([$row['id']]); $row['items'] = array_map(fn($item) => serializeRow($pdo, 'quote_items', $item, true), $items->fetchAll(PDO::FETCH_ASSOC)); $row['subTotal'] = array_sum(array_column($row['items'], 'totalPrice')); $row['vat'] = round($row['subTotal'] * .15, 2); $row['total'] = $row['subTotal'] + $row['vat']; }
    if (in_array($resource, ['quotes', 'invoices', 'creditnotes', 'statements'], true) && !empty($row['clientId'])) { $q = $pdo->prepare('SELECT * FROM clients WHERE id = ?'); $q->execute([$row['clientId']]); $client = $q->fetch(PDO::FETCH_ASSOC); if ($client) $row['client'] = serializeRow($pdo, 'clients', $client, true); }
    if ($resource === 'invoices') { if (!empty($row['quoteId'])) { $q = $pdo->prepare('SELECT * FROM quotes WHERE id = ?'); $q->execute([$row['quoteId']]); $quote = $q->fetch(PDO::FETCH_ASSOC); if ($quote) { $quote = serializeRow($pdo, 'quotes', $quote, true); $row['quote'] = $quote; $row['amount'] = $quote['total']; } } $row['isOverdue'] = ($row['status'] ?? '') !== 'Paid' && !empty($row['dueDate']) && strtotime((string)$row['dueDate']) < time(); }
    if (in_array($resource, ['jobcards', 'deliverynotes'], true) && !empty($row['quoteNumber'])) { $q = $pdo->prepare('SELECT * FROM quotes WHERE quote_number = ? LIMIT 1'); $q->execute([$row['quoteNumber']]); $quote = $q->fetch(PDO::FETCH_ASSOC); if ($quote) $row['quote'] = serializeRow($pdo, 'quotes', $quote, true); }
    if ($resource === 'costs') { $q = $pdo->prepare('SELECT * FROM cost_items WHERE cost_id = ? ORDER BY item_number'); $q->execute([$row['id']]); $row['items'] = array_map(fn($item) => serializeRow($pdo, 'cost_items', $item, true), $q->fetchAll(PDO::FETCH_ASSOC)); }
    if ($resource === 'statements') { $q = $pdo->prepare('SELECT * FROM statement_items WHERE statement_id = ? ORDER BY payment_date'); $q->execute([$row['id']]); $row['items'] = array_map(fn($item) => serializeRow($pdo, 'statement_items', $item, true), $q->fetchAll(PDO::FETCH_ASSOC)); }
    if ($resource === 'costs') { $row['itemCount'] = count($row['items']); $row['totalQuoteAmount'] = array_sum(array_map(fn($item) => (float)$item['unitPrice'] * (float)$item['quantity'], $row['items'])); }
    if ($resource === 'statements') foreach ($row['items'] as &$item) { if (!empty($item['invoiceId'])) { $q = $pdo->prepare('SELECT amount FROM invoices WHERE id = ?'); $q->execute([$item['invoiceId']]); $item['invoiceAmount'] = (float)$q->fetchColumn(); } elseif (!empty($item['creditNoteId'])) { $q = $pdo->prepare('SELECT amount FROM credit_notes WHERE id = ?'); $q->execute([$item['creditNoteId']]); $item['invoiceAmount'] = (float)$q->fetchColumn(); } }
    return $row;
}
function saveNestedItems(PDO $pdo, string $table, string $foreignKey, string $foreignId, array $items): void {
    foreach ($items as $item) {
        if ($table === 'quote_items' && trim((string)($item['code'] ?? '')) !== '') {
            $productQuery = $pdo->prepare('SELECT * FROM products WHERE code = ?');
            $productQuery->execute([trim((string)$item['code'])]);
            $product = $productQuery->fetch(PDO::FETCH_ASSOC);
            if (!$product) {
                $product = [
                    'id' => uuid(),
                    'code' => trim((string)$item['code']),
                    'name' => trim((string)($item['description'] ?? $item['code'])),
                    'uom' => (string)($item['uom'] ?? ''),
                    'description' => $item['description'] ?? null,
                    'price' => (float)($item['unitPrice'] ?? 0),
                    'image' => $item['imagePath'] ?? null,
                ];
                $pdo->prepare('INSERT INTO products (id, code, name, uom, description, price, image) VALUES (?, ?, ?, ?, ?, ?, ?)')->execute(array_values($product));
            }
            $item['uom'] = $item['uom'] ?? $product['uom'];
            $item['description'] = $item['description'] ?? $product['description'];
            $item['unitPrice'] = (float)($item['unitPrice'] ?? 0) ?: (float)$product['price'];
            $item['imagePath'] = $item['imagePath'] ?? $product['image'];
            $item['productId'] = $product['id'];
        }
        $row = createRow(str_replace('_items', 's', $table), $item);
        unset($row['created_at'], $row['date'], $row['status'], $row['reference'], $row['quote_number'], $row['validity_days'], $row['client_id'], $row['po_number'], $row['margin'], $row['due_date']); $row[$foreignKey] = $foreignId;
        $columns = array_keys($row); $marks = implode(',', array_fill(0, count($columns), '?'));
        $pdo->prepare("INSERT INTO $table (" . implode(',', $columns) . ") VALUES ($marks)")->execute(array_values($row));
    }
}
function handleUpload(PDO $pdo, string $dataDir, string $kind): never {
    $file = $_FILES['file'] ?? null; if (!$file || $file['error'] !== UPLOAD_ERR_OK) fail('File is required.', 400); $extension = pathinfo($file['name'], PATHINFO_EXTENSION); $name = uuid() . ($extension ? '.' . $extension : ''); $path = $dataDir . DIRECTORY_SEPARATOR . $kind . DIRECTORY_SEPARATOR . $name; move_uploaded_file($file['tmp_name'], $path);
    if ($kind === 'documents') { $bodyName = trim((string)($_POST['documentName'] ?? '')); if ($bodyName === '') fail('Document Name is required.', 400); $row = ['id'=>uuid(),'document_name'=>$bodyName,'description'=>$_POST['description'] ?? null,'file_name'=>$name,'file_path'=>$path,'content_type'=>$_FILES['file']['type'] ?: 'application/octet-stream','uploaded_at'=>now()]; $pdo->prepare('INSERT INTO documents (id,document_name,description,file_name,file_path,content_type,uploaded_at) VALUES (?,?,?,?,?,?,?)')->execute(array_values($row)); jsonResponse(serializeRow($pdo, 'documents', $row, true), 201); }
    jsonResponse(['imagePath' => $name]);
}

function handleProductWorkbook(PDO $pdo): never {
    $file = $_FILES['file'] ?? null;
    if (!$file || $file['error'] !== UPLOAD_ERR_OK) fail('File is required.', 400);
    if (!class_exists(PhpOffice\PhpSpreadsheet\IOFactory::class)) fail('Spreadsheet support is not installed.', 500);
    try { $sheet = PhpOffice\PhpSpreadsheet\IOFactory::load($file['tmp_name'])->getActiveSheet(); }
    catch (Throwable $e) { fail('Unable to read workbook: ' . $e->getMessage(), 400); }
    $rows = $sheet->toArray(null, true, true, true);
    if (count($rows) < 2) jsonResponse(['message' => 'No products found.']);
    $headers = array_map(fn($header) => strtolower(preg_replace('/[^a-z0-9]/i', '', (string)$header)), array_shift($rows));
    $aliases = ['code' => ['code', 'productcode'], 'name' => ['name', 'productname'], 'uom' => ['uom', 'unitofmeasure'], 'description' => ['description'], 'price' => ['price', 'unitprice'], 'image' => ['image', 'imagepath']];
    $positions = [];
    foreach ($aliases as $field => $names) foreach ($names as $name) { $position = array_search($name, $headers, true); if ($position !== false) { $positions[$field] = $position; break; } }
    if (!isset($positions['code'], $positions['name'], $positions['uom'])) fail('Workbook must contain Code, Name, and Uom columns.', 400);
    $pdo->beginTransaction(); $imported = 0;
    try {
        foreach ($rows as $row) {
            $code = trim((string)($row[$positions['code']] ?? '')); if ($code === '') continue;
            $data = ['name' => trim((string)($row[$positions['name']] ?? '')), 'uom' => trim((string)($row[$positions['uom']] ?? '')), 'description' => isset($positions['description']) ? (string)$row[$positions['description']] : null, 'price' => isset($positions['price']) ? (float)$row[$positions['price']] : 0, 'image' => isset($positions['image']) ? (string)$row[$positions['image']] : null];
            $update = $pdo->prepare('UPDATE products SET name=?,uom=?,description=?,price=?,image=? WHERE code=?'); $update->execute([...array_values($data), $code]);
            if ($update->rowCount() === 0) $pdo->prepare('INSERT INTO products (id,code,name,uom,description,price,image) VALUES (?,?,?,?,?,?,?)')->execute([uuid(), $code, ...array_values($data)]);
            $imported++;
        }
        $pdo->commit();
    } catch (Throwable $e) { $pdo->rollBack(); fail('Product import failed: ' . $e->getMessage(), 400); }
    jsonResponse(['message' => "$imported products imported.", 'count' => $imported]);
}