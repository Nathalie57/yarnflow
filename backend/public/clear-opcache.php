<?php
// Script temporaire pour vider le cache OPcache
if (function_exists('opcache_reset')) {
    opcache_reset();
    echo "✅ OPcache vidé avec succès";
} else {
    echo "ℹ️ OPcache non activé";
}
