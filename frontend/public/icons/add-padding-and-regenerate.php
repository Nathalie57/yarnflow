<?php
/**
 * Ajoute une marge autour du logo actuel (qui touche les bords) puis régénère
 * toutes les tailles d'icônes PWA à partir de ce nouveau master bien cadré.
 */

$backup = __DIR__ . '/icon-512x512-original-backup.png';
$source = file_exists($backup) ? $backup : __DIR__ . '/icon-512x512.png';
$dest = __DIR__ . '/icon-512x512.png';

if (!file_exists($source)) {
    die('Aucun fichier source trouvé');
}

$original = imagecreatefrompng($source);

// Nouveau master 512x512 : le logo original réduit à 55% et centré,
// avec une marge blanche généreuse tout autour (marge ~22% par côté,
// pour survivre au recadrage supplémentaire des icônes maskable)
$canvasSize = 512;
$contentSize = (int)($canvasSize * 0.55);
$offset = (int)(($canvasSize - $contentSize) / 2);

$master = imagecreatetruecolor($canvasSize, $canvasSize);
$white = imagecolorallocate($master, 255, 255, 255);
imagefill($master, 0, 0, $white);
imagecopyresampled($master, $original, $offset, $offset, 0, 0, $contentSize, $contentSize, 512, 512);

imagepng($master, $dest);
echo "Nouveau master icon-512x512.png généré avec marge\n\n";

// Régénère toutes les tailles standard à partir du nouveau master
$sizes = [72, 96, 128, 144, 152, 192, 384, 512];
$src = imagecreatefrompng($dest);

foreach ($sizes as $size) {
    $dst = imagecreatetruecolor($size, $size);
    imagealphablending($dst, false);
    imagesavealpha($dst, true);
    $transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
    imagefill($dst, 0, 0, $transparent);
    imagecopyresampled($dst, $src, 0, 0, 0, 0, $size, $size, 512, 512);
    imagepng($dst, __DIR__ . "/icon-{$size}x{$size}.png");
    imagedestroy($dst);
    echo "icon-{$size}x{$size}.png régénéré\n";
}

// Maskable icons (192 et 512 avec padding 10% additionnel — le master est déjà marginé)
foreach ([192, 512] as $size) {
    $dst = imagecreatetruecolor($size, $size);
    $bg = imagecolorallocate($dst, 246, 248, 246); // primary-50 #f6f8f6
    imagefill($dst, 0, 0, $bg);
    $padding = (int)($size * 0.1);
    $innerSize = $size - ($padding * 2);
    imagecopyresampled($dst, $src, $padding, $padding, 0, 0, $innerSize, $innerSize, 512, 512);
    imagepng($dst, __DIR__ . "/icon-maskable-{$size}x{$size}.png");
    imagedestroy($dst);
    echo "icon-maskable-{$size}x{$size}.png régénéré\n";
}

imagedestroy($src);
imagedestroy($original);
imagedestroy($master);
echo "\nTerminé !";
