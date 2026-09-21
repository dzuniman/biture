<?php
declare(strict_types=1);

require_once __DIR__ . '/../../vendor/autoload.php';
require_once __DIR__ . '/Http.php'; // <-- this brings in loadEnvFile() and your other helpers

// Determine environment and project
$envName = getenv('APP_ENV') ?: 'development';
$project = getenv('PROJECT') ?: 'biture';

// Resolve correct .env file
$baseDir = dirname(__DIR__, 2);
$envFile = "$baseDir/.env.$project-$envName";
if (!file_exists($envFile)) {
    $envFile = "$baseDir/.env.$envName";
}

// Load environment file using your custom loader
loadEnvFile($envFile);

// Core includes
require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/Container.php';
require_once __DIR__ . '/Application.php';
require_once __DIR__ . '/../Entities/Entity.php';
require_once __DIR__ . '/../Entities/ResourceEntity.php';
require_once __DIR__ . '/../Repositories/ResourceRepositoryInterface.php';
require_once __DIR__ . '/../Repositories/PdoResourceRepository.php';
require_once __DIR__ . '/../Services/ResourceService.php';

// Autoload entities, repositories, services
foreach (glob(__DIR__ . '/../Entities/*Entity.php') as $entityFile) {
    require_once $entityFile;
}
foreach (glob(__DIR__ . '/../Repositories/*Repository.php') as $repositoryFile) {
    require_once $repositoryFile;
}
foreach (glob(__DIR__ . '/../Services/*Service.php') as $serviceFile) {
    require_once $serviceFile;
}

// Additional includes
require_once __DIR__ . '/../Database/MigrationRunner.php';
require_once __DIR__ . '/../Services/TokenService.php';
require_once __DIR__ . '/../Controllers/ResourceController.php';
require_once __DIR__ . '/../Controllers/AuthController.php';

// Autoload controllers
foreach (glob(__DIR__ . '/../Controllers/*Controller.php') as $controllerFile) {
    require_once $controllerFile;
}

// Composer autoload
$autoload = dirname(__DIR__, 2) . '/vendor/autoload.php';
if (is_file($autoload)) {
    require_once $autoload;
}

// CORS setup
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header('Access-Control-Allow-Origin: ' . $origin);
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Credentials: true');

// Handle preflight requests
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}
