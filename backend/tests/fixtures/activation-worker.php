<?php
declare(strict_types=1);

require __DIR__ . '/../../vendor/autoload.php';

$schema = $argv[1] ?? '';
if (!preg_match('/^yf_tracking_test_[a-f0-9]{16}$/', $schema)) exit(2);
$pdo = new PDO(getenv('TRACKING_TEST_MYSQL_DSN') . ';dbname=' . $schema,
    getenv('TRACKING_TEST_MYSQL_USER') ?: 'root', getenv('TRACKING_TEST_MYSQL_PASSWORD') ?: '',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false]);
$connection = new ReflectionProperty(App\Config\Database::class, 'connection');
$connection->setValue(App\Config\Database::getInstance(), $pdo);
echo "ready\n";
flush();
echo App\Services\ProgressActivationService::recordCounterUpdate(1, (int)($argv[2] ?? 10), 0, 1, true) ? "inserted\n" : "existing\n";
