<?php
$source = __DIR__ . '/icon-512x512.png';

if (!file_exists($source)) {
    die('icon-512x512.png introuvable');
}

$sizes = [72, 96, 128, 144, 152, 192, 384, 512];

$src = imagecreatefrompng($source);

foreach ($sizes as $size) {
    $dst = imagecreatetruecolor($size, $size);
    imagealphablending($dst, false);
    imagesavealpha($dst, true);
    $transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
    imagefill($dst, 0, 0, $transparent);
    imagecopyresampled($dst, $src, 0, 0, 0, 0, $size, $size, 512, 512);
    imagepng($dst, __DIR__ . "/icon-{$size}x{$size}.png");
    imagedestroy($dst);
    echo "icon-{$size}x{$size}.png généré\n";
}

// Maskable icons (192 et 512 avec padding 10%)
foreach ([192, 512] as $size) {
    $dst = imagecreatetruecolor($size, $size);
    $bg = imagecolorallocate($dst, 246, 248, 246); // primary-50 #f6f8f6
    imagefill($dst, 0, 0, $bg);
    $padding = (int)($size * 0.1);
    $innerSize = $size - ($padding * 2);
    imagecopyresampled($dst, $src, $padding, $padding, 0, 0, $innerSize, $innerSize, 512, 512);
    imagepng($dst, __DIR__ . "/icon-maskable-{$size}x{$size}.png");
    imagedestroy($dst);
    echo "icon-maskable-{$size}x{$size}.png généré\n";
}

imagedestroy($src);
echo "\nTerminé !";
