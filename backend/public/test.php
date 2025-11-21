<?php
// Test simple pour voir si PHP fonctionne
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "PHP fonctionne !<br>";
echo "Version PHP : " . phpversion() . "<br>";
echo "Document Root : " . $_SERVER['DOCUMENT_ROOT'] . "<br>";

// Test autoload
require_once __DIR__.'/../vendor/autoload.php';
echo "Autoload OK !<br>";

// Test .env
require_once __DIR__.'/../config/bootstrap.php';
echo "Bootstrap OK !<br>";

echo "Tout fonctionne !";
