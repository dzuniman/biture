<?php

declare(strict_types=1);

function jsonResponse(mixed $value, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($value, JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(string $message, int $status): never { jsonResponse(['message' => $message], $status); }
function input(): array { $raw = file_get_contents('php://input'); return $raw ? (json_decode($raw, true) ?: []) : []; }
function uuid(): string { return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x', random_int(0, 65535), random_int(0, 65535), random_int(0, 65535), random_int(16384, 20479), random_int(32768, 49151), random_int(0, 65535), random_int(0, 65535), random_int(0, 65535)); }
function now(): string { return gmdate('Y-m-d\TH:i:s\Z'); }
function value(array $data, string $key, mixed $default = null): mixed { return array_key_exists($key, $data) ? $data[$key] : $default; }
function tokenUser(): ?array { return TokenService::userFromRequest(); }
function requireAuth(bool $admin = false): array { $user = tokenUser(); if (!$user) fail('Unauthorized', 401); if ($admin && ($user['role'] ?? '') !== 'Admin') fail('Forbidden', 403); return $user; }
function publicUser(array $row): array { return ['id' => $row['id'], 'username' => $row['username'], 'role' => $row['role']]; }
function dbColumn(string $column): string
{
    static $columns = ['id'=>'Id','username'=>'Username','password_hash'=>'PasswordHash','role'=>'Role','created_at'=>'CreatedAt','updated_at'=>'UpdatedAt','client_id'=>'ClientId','quote_id'=>'QuoteId','cost_id'=>'CostId','statement_id'=>'StatementId','invoice_id'=>'InvoiceId','credit_note_id'=>'CreditNoteId','quote_number'=>'QuoteNumber','invoice_number'=>'InvoiceNumber','job_card_number'=>'JobCardNumber','delivery_note_number'=>'DeliveryNoteNumber','credit_note_number'=>'CreditNoteNumber','statement_number'=>'StatementNumber','validity_days'=>'ValidityDays','po_number'=>'PONumber','item_number'=>'ItemNumber','unit_price'=>'UnitPrice','total_price'=>'TotalPrice','image_path'=>'ImagePath','due_days'=>'DueDays','payment_amount'=>'PaymentAmount','payment_date'=>'PaymentDate','inspection_date'=>'InspectionDate','representative_number'=>'RepresentativeNumber','representative_name'=>'RepresentativeName','address_line1'=>'AddressLine1','address_line2'=>'AddressLine2','address_line3'=>'AddressLine3','address_line4'=>'AddressLine4','vendor_number'=>'VendorNumber','vat_number'=>'VatNumber','document_name'=>'DocumentName','file_name'=>'FileName','file_path'=>'FilePath','content_type'=>'ContentType','uploaded_at'=>'UploadedAt','supplier_name'=>'SupplierName','supplier_description'=>'SupplierDescription','supplier_cost'=>'SupplierCost','other_name'=>'OtherName','other_description'=>'OtherDescription','other_cost'=>'OtherCost','code'=>'Code','name'=>'Name','uom'=>'Uom','description'=>'Description','price'=>'Price','image'=>'Image','amount'=>'Amount','status'=>'Status','date'=>'Date','margin'=>'Margin','quantity'=>'Quantity','value'=>'Value'];
    return $columns[$column] ?? $column;
}
function databaseRow(array $row): array
{
    $columns = ['Id'=>'id','Username'=>'username','PasswordHash'=>'password_hash','Role'=>'role','CreatedAt'=>'created_at','UpdatedAt'=>'updated_at','ClientId'=>'client_id','QuoteId'=>'quote_id','CostId'=>'cost_id','StatementId'=>'statement_id','InvoiceId'=>'invoice_id','CreditNoteId'=>'credit_note_id','QuoteNumber'=>'quote_number','InvoiceNumber'=>'invoice_number','JobCardNumber'=>'job_card_number','DeliveryNoteNumber'=>'delivery_note_number','CreditNoteNumber'=>'credit_note_number','StatementNumber'=>'statement_number','ValidityDays'=>'validity_days','PONumber'=>'po_number','ItemNumber'=>'item_number','UnitPrice'=>'unit_price','TotalPrice'=>'total_price','ImagePath'=>'image_path','DueDays'=>'due_days','PaymentAmount'=>'payment_amount','PaymentDate'=>'payment_date','InspectionDate'=>'inspection_date','RepresentativeNumber'=>'representative_number','RepresentativeName'=>'representative_name','AddressLine1'=>'address_line1','AddressLine2'=>'address_line2','AddressLine3'=>'address_line3','AddressLine4'=>'address_line4','VendorNumber'=>'vendor_number','VatNumber'=>'vat_number','DocumentName'=>'document_name','FileName'=>'file_name','FilePath'=>'file_path','ContentType'=>'content_type','UploadedAt'=>'uploaded_at','SupplierName'=>'supplier_name','SupplierDescription'=>'supplier_description','SupplierCost'=>'supplier_cost','OtherName'=>'other_name','OtherDescription'=>'other_description','OtherCost'=>'other_cost','Value'=>'value'];
    $normalized = [];
    foreach ($row as $key => $value) $normalized[$columns[$key] ?? lcfirstToSnake((string)$key)] = $value;
    return $normalized;
}
function loadEnvFile(string $path): void { if (!is_file($path)) return; foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) { $line = trim($line); if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) continue; [$key, $value] = explode('=', $line, 2); if (getenv(trim($key)) === false) putenv(trim($key) . '=' . trim($value, " \t\"")); } }
