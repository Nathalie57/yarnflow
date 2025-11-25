<?php
// Diagnostic PHP
echo "PHP Version: " . PHP_VERSION . "<br>";
echo "Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "<br>";
echo "Script Filename: " . $_SERVER['SCRIPT_FILENAME'] . "<br>";
echo "Current Directory: " . __DIR__ . "<br>";
echo "File exists (vendor/autoload.php): " . (file_exists(__DIR__ . '/../../vendor/autoload.php') ? 'YES' : 'NO') . "<br>";
echo "File exists (config/.env): " . (file_exists(__DIR__ . '/../../config/.env') ? 'YES' : 'NO') . "<br>";
echo "File exists (health.php): " . (file_exists(__DIR__ . '/health.php') ? 'YES' : 'NO') . "<br>";
