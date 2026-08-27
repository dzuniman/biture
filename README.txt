Deployment:

Backend (Inside root /biture):
Staging:
1. Copy contents of .htaccess-staging into .htaccess
2. npm run deploy:staging:backend
Production:
1. Copy contents of .hetaccess-production into .htaccess
2. npm run deploy:production:backend

Fonrend (Inside /biture/quote2cash-web):
1. npm run deploy:staging:frontend
Production:
2. npm run deploy:production:frontend

Migrations
Migration names matter because files are applied alphabetically. Use: timestamp_descriptive_name.php.
Example:
20260827143000_add_client_phone.php
20260827150000_create_document_folders.php
20260827153000_add_invoice_indexes.php

1. Create the migration
- From the api directory run: php bin/create-migration.php AddClientPhone
- This creates a file similar to: src/Database/Migrations/20260827143000_addclientphone.php
2. Edit the generated up() method:
<?php
public function up(PDO $pdo): void
{
    $pdo->exec('ALTER TABLE clients ADD COLUMN Phone VARCHAR(255) NULL');
}
3. Apply migrations in dev
- Run: cd api
- Run: $env:APP_ENV = "development"
- Or skip this run: $env:APP_ENV = "development"
- Run: composer db:migrate

4. Apply migrations in dev
- Run: cd api
- Run: $env:APP_ENV = "staging"
- Run: composer db:migrate

5. Apply migrations in dev
- Run: cd api
- Run: $env:APP_ENV = "production"
- Run: composer db:migrate
