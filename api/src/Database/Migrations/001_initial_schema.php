<?php

declare(strict_types=1);

return new class implements Migration
{
    public function up(PDO $pdo): void
    {
        $id = 'CHAR(36)';
        $text = 'VARCHAR(255)';
        $table = static fn(string $name): string => Database::table($name);
        $schema = [
            "CREATE TABLE IF NOT EXISTS {$table('users')} (id $id PRIMARY KEY, username $text NOT NULL UNIQUE, password_hash $text NOT NULL, role $text NOT NULL, created_at $text NOT NULL)",
            "CREATE TABLE IF NOT EXISTS {$table('clients')} (id $id PRIMARY KEY, name $text NOT NULL, vendor_number $text, address_line1 $text, address_line2 $text, address_line3 $text, address_line4 $text, representative_name $text, representative_number $text, vat_number $text, email $text, created_at $text NOT NULL, updated_at $text)",
            "CREATE TABLE IF NOT EXISTS {$table('products')} (id $id PRIMARY KEY, code $text NOT NULL UNIQUE, name $text NOT NULL, uom $text NOT NULL, description $text, price NUMERIC NOT NULL DEFAULT 0, image $text)",
            "CREATE TABLE IF NOT EXISTS {$table('quoteuoms')} (id $id PRIMARY KEY, value $text NOT NULL UNIQUE)",
            "CREATE TABLE IF NOT EXISTS {$table('quotes')} (id $id PRIMARY KEY, quote_number $text NOT NULL, reference $text, date $text NOT NULL, validity_days INTEGER NOT NULL, client_id $id, po_number $text, margin NUMERIC NOT NULL DEFAULT 0, description $text, status $text, created_at $text NOT NULL, due_date $text)",
            "CREATE TABLE IF NOT EXISTS quoteitems (id $id PRIMARY KEY, quote_id $id NOT NULL, item_number INTEGER NOT NULL, quantity NUMERIC NOT NULL, code $text, uom $text, description $text, unit_price NUMERIC NOT NULL, total_price NUMERIC NOT NULL, image_path $text, product_id $id)",
            "CREATE TABLE IF NOT EXISTS {$table('invoices')} (id $id PRIMARY KEY, client_id $id, quote_id $id, invoice_number $text NOT NULL, description $text, amount NUMERIC NOT NULL, status $text NOT NULL, created_at $text NOT NULL, due_date $text NOT NULL)",
            "CREATE TABLE IF NOT EXISTS {$table('jobcards')} (id $id PRIMARY KEY, job_card_number $text NOT NULL, reference $text, quote_number $text NOT NULL, description $text, created_at $text NOT NULL)",
            "CREATE TABLE IF NOT EXISTS {$table('deliverynotes')} (id $id PRIMARY KEY, delivery_note_number $text NOT NULL, reference $text, quote_number $text NOT NULL, description $text, created_at $text NOT NULL)",
            "CREATE TABLE IF NOT EXISTS {$table('creditnotes')} (id $id PRIMARY KEY, client_id $id NOT NULL, credit_note_number $text NOT NULL, description $text, amount NUMERIC NOT NULL, created_at $text NOT NULL)",
            "CREATE TABLE IF NOT EXISTS {$table('costs')} (id $id PRIMARY KEY, description $text, margin NUMERIC NOT NULL, date $text NOT NULL)",
            "CREATE TABLE IF NOT EXISTS costquoteitems (id $id PRIMARY KEY, cost_id $id NOT NULL, item_number INTEGER NOT NULL, quantity NUMERIC NOT NULL, uom $text, description $text, unit_price NUMERIC NOT NULL, supplier_name $text, supplier_description $text, supplier_cost NUMERIC NOT NULL, other_name $text, other_description $text, other_cost NUMERIC NOT NULL)",
            "CREATE TABLE IF NOT EXISTS {$table('statements')} (id $id PRIMARY KEY, statement_number $text NOT NULL, due_days INTEGER NOT NULL DEFAULT 30, client_id $id NOT NULL, created_at $text NOT NULL)",
            "CREATE TABLE IF NOT EXISTS statementitems (id $id PRIMARY KEY, statement_id $id NOT NULL, invoice_id $id, credit_note_id $id, payment_amount NUMERIC NOT NULL, description $text, payment_date $text NOT NULL)",
            "CREATE TABLE IF NOT EXISTS {$table('documents')} (id $id PRIMARY KEY, document_name $text NOT NULL UNIQUE, description $text, file_name $text NOT NULL, file_path $text NOT NULL, content_type $text NOT NULL, uploaded_at $text NOT NULL)",
            "CREATE TABLE IF NOT EXISTS {$table('tools')} (id $id PRIMARY KEY, code $text NOT NULL, description $text, quantity NUMERIC NOT NULL, location $text, image_path $text, value NUMERIC NOT NULL, inspection_date $text)",
        ];
        foreach ($schema as $statement) $pdo->exec($statement);
    }
};