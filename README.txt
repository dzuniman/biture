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

Create a migration

From the api directory:
php bin/create-migration.php AddClientPhone

Edit the generated file in Migrations.
composer db:migrate

Apply migrations
composer db:migrate

For staging or production:
$env:APP_ENV = "staging"
composer db:migrate

Run migrations before the FTP backend deployment. Never edit an already-applied migration. The legacy DomainLogic.php remains temporarily for upload, nested-item, and response compatibility while the resource CRUD path now uses the new entity/repository/service graph.

All PHP syntax checks, Composer validation, bootstrap loading, migration object loading, and diagnostics passed. The migration was not executed against the configured database.