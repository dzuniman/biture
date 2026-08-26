<?php

declare(strict_types=1);

require_once __DIR__ . '/Http.php';
require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/../Services/TokenService.php';
require_once __DIR__ . '/../Controllers/ResourceController.php';
require_once __DIR__ . '/../Controllers/AuthController.php';
foreach (glob(__DIR__ . '/../Controllers/*Controller.php') as $controllerFile) require_once $controllerFile;
$autoload = dirname(__DIR__, 2) . '/vendor/autoload.php';
if (is_file($autoload)) require_once $autoload;

loadEnvFile(dirname(__DIR__, 2) . '/.env');

$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header('Access-Control-Allow-Origin: ' . $origin);
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Credentials: true');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
