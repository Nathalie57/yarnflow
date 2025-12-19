<?php
// Vider l'opcache PHP
if (function_exists('opcache_reset')) {
    opcache_reset();
    echo "Opcache cleared!\n";
} else {
    echo "Opcache not enabled\n";
}
echo "All caches cleared. Try your download again.";
