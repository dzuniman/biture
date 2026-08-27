<?php
declare(strict_types=1);
require_once __DIR__ . '/../../vendor/autoload.php';

$envName = getenv('APP_ENV') ?: 'development';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../../', [".env.$envName"]);
$dotenv->load();

final class Database
{
    public static function connect(): PDO
    {
        $url = getenv('DATABASE_URL');
        if (!$url) throw new RuntimeException('DATABASE_URL is required. Copy api/.env.example to api/.env and configure it.');
        if (!in_array('mysql', PDO::getAvailableDrivers(), true)) throw new RuntimeException('The PHP pdo_mysql extension is not enabled.');
        [$dsn, $username, $password] = self::connection($url);
        $pdo = new PDO($dsn, $username, $password, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
        if (filter_var(getenv('AUTO_SCHEMA') ?: 'false', FILTER_VALIDATE_BOOLEAN)) self::createSchema($pdo);
        return $pdo;
    }

    public static function dataDirectory(): string
    {
        $directory = getenv('DATA_DIR') ?: dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'data';
        if (!is_dir($directory)) mkdir($directory, 0775, true);
        foreach (['documents', 'products', 'quote_items', 'tools'] as $child) {
            $path = $directory . DIRECTORY_SEPARATOR . $child;
            if (!is_dir($path)) mkdir($path, 0775, true);
        }
        return $directory;
    }

    public static function table(string $default): string
    {
        $key = 'DB_TABLE_' . strtoupper(str_replace('-', '_', $default));
        $name = getenv($key) ?: $default;
        if (!preg_match('/^[a-zA-Z0-9_]+$/', $name)) throw new RuntimeException("Invalid table name configured for $key");
        return $name;
    }

    private static function connection(string $url): array
    {
        if (str_starts_with($url, 'mysql:') && !str_starts_with($url, 'mysql://')) return [$url, null, null];
        $parsed = parse_url($url);
        if (!$parsed || empty($parsed['host']) || empty($parsed['path'])) throw new RuntimeException('DATABASE_URL must be a MySQL URL such as mysql://user:password@host:3306/database?charset=utf8mb4');
        $dsn = 'mysql:host=' . $parsed['host'] . ';port=' . ($parsed['port'] ?? 3306) . ';dbname=' . ltrim($parsed['path'], '/');
        if (!empty($parsed['query'])) $dsn .= ';' . str_replace('&', ';', $parsed['query']);
        return [$dsn, isset($parsed['user']) ? rawurldecode($parsed['user']) : null, isset($parsed['pass']) ? rawurldecode($parsed['pass']) : null];
    }

    private static function createSchema(PDO $pdo): void
    {
        $id = 'CHAR(36)'; $text = 'VARCHAR(255)';
        $schema = [
            "CREATE TABLE IF NOT EXISTS users (id $id PRIMARY KEY, username $text NOT NULL UNIQUE, password_hash $text NOT NULL, role $text NOT NULL, created_at $text NOT NULL)",
            "CREATE TABLE IF NOT EXISTS clients (id $id PRIMARY KEY, name $text NOT NULL, vendor_number $text, address_line1 $text, address_line2 $text, address_line3 $text, address_line4 $text, representative_name $text, representative_number $text, vat_number $text, email $text, created_at $text NOT NULL, updated_at $text)",
            "CREATE TABLE IF NOT EXISTS products (id $id PRIMARY KEY, code $text NOT NULL UNIQUE, name $text NOT NULL, uom $text NOT NULL, description $text, price NUMERIC NOT NULL DEFAULT 0, image $text)",
            "CREATE TABLE IF NOT EXISTS quoteuoms (id $id PRIMARY KEY, value $text NOT NULL UNIQUE)",
            "CREATE TABLE IF NOT EXISTS quotes (id $id PRIMARY KEY, quote_number $text NOT NULL, reference $text, date $text NOT NULL, validity_days INTEGER NOT NULL, client_id $id, po_number $text, margin NUMERIC NOT NULL DEFAULT 0, description $text, status $text, created_at $text NOT NULL, due_date $text)",
            "CREATE TABLE IF NOT EXISTS quoteitems (id $id PRIMARY KEY, quote_id $id NOT NULL, item_number INTEGER NOT NULL, quantity NUMERIC NOT NULL, code $text, uom $text, description $text, unit_price NUMERIC NOT NULL, total_price NUMERIC NOT NULL, image_path $text, product_id $id)",
            "CREATE TABLE IF NOT EXISTS invoices (id $id PRIMARY KEY, client_id $id, quote_id $id, invoice_number $text NOT NULL, description $text, amount NUMERIC NOT NULL, status $text NOT NULL, created_at $text NOT NULL, due_date $text NOT NULL)",
            "CREATE TABLE IF NOT EXISTS jobcards (id $id PRIMARY KEY, job_card_number $text NOT NULL, reference $text, quote_number $text NOT NULL, description $text, created_at $text NOT NULL)",
            "CREATE TABLE IF NOT EXISTS deliverynotes (id $id PRIMARY KEY, delivery_note_number $text NOT NULL, reference $text, quote_number $text NOT NULL, description $text, created_at $text NOT NULL)",
            "CREATE TABLE IF NOT EXISTS creditnotes (id $id PRIMARY KEY, client_id $id NOT NULL, credit_note_number $text NOT NULL, description $text, amount NUMERIC NOT NULL, created_at $text NOT NULL)",
            "CREATE TABLE IF NOT EXISTS costs (id $id PRIMARY KEY, description $text, margin NUMERIC NOT NULL, date $text NOT NULL)",
            "CREATE TABLE IF NOT EXISTS costquoteitems (id $id PRIMARY KEY, cost_id $id NOT NULL, item_number INTEGER NOT NULL, quantity NUMERIC NOT NULL, uom $text, description $text, unit_price NUMERIC NOT NULL, supplier_name $text, supplier_description $text, supplier_cost NUMERIC NOT NULL, other_name $text, other_description $text, other_cost NUMERIC NOT NULL)",
            "CREATE TABLE IF NOT EXISTS statements (id $id PRIMARY KEY, statement_number $text NOT NULL, due_days INTEGER NOT NULL DEFAULT 30, client_id $id NOT NULL, created_at $text NOT NULL)",
            "CREATE TABLE IF NOT EXISTS statementitems (id $id PRIMARY KEY, statement_id $id NOT NULL, invoice_id $id, credit_note_id $id, payment_amount NUMERIC NOT NULL, description $text, payment_date $text NOT NULL)",
            "CREATE TABLE IF NOT EXISTS documents (id $id PRIMARY KEY, document_name $text NOT NULL UNIQUE, description $text, file_name $text NOT NULL, file_path $text NOT NULL, content_type $text NOT NULL, uploaded_at $text NOT NULL)",
            "CREATE TABLE IF NOT EXISTS tools (id $id PRIMARY KEY, code $text NOT NULL, description $text, quantity NUMERIC NOT NULL, location $text, image_path $text, value NUMERIC NOT NULL, inspection_date $text)"
        ];
        foreach ($schema as $statement) $pdo->exec($statement);
    }
}
