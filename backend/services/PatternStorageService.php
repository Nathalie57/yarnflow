<?php
declare(strict_types=1);

namespace App\Services;

use App\Config\Database;
use PDO;

class PatternStorageService
{
    // Quota en octets par plan (null = illimité)
    private const STORAGE_QUOTAS = [
        'free'          => 100 * 1024 * 1024, // 100 MB
        'plus'          => null,
        'plus_annual'   => null,
        'pro'           => null,
        'pro_annual'    => null,
        'early_bird'    => null,
    ];

    private const MAX_PDF_SIZE    = 20 * 1024 * 1024; // 20 MB
    private const MAX_IMAGE_SIZE  = 50 * 1024 * 1024; // 50 MB (compressé ensuite)
    private const IMAGE_MAX_DIM   = 2048;
    private const IMAGE_QUALITY   = 85;

    private PDO $db;
    private string $publicDir;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
        $this->publicDir = __DIR__ . '/../public';
    }

    /**
     * Valide la taille du fichier selon son type et lève une exception si dépassée.
     */
    public function validateFileSize(array $file): void
    {
        $isPdf = $file['type'] === 'application/pdf';
        $max   = $isPdf ? self::MAX_PDF_SIZE : self::MAX_IMAGE_SIZE;
        $label = $isPdf ? '20 Mo' : '50 Mo';

        if ($file['size'] > $max) {
            throw new \InvalidArgumentException("Fichier trop volumineux (max $label)");
        }
    }

    /**
     * Retourne les infos de stockage pour un utilisateur.
     * ['used' => int (octets), 'limit' => int|null, 'unlimited' => bool]
     */
    public function getStorageInfo(int $userId): array
    {
        $stmt = $this->db->prepare('SELECT subscription_type FROM users WHERE id = :id');
        $stmt->execute([':id' => $userId]);
        $subType = $stmt->fetchColumn() ?: 'free';

        $limit = self::STORAGE_QUOTAS[$subType] ?? self::STORAGE_QUOTAS['free'];

        $used = $this->calculateUsedStorage($userId);

        return [
            'used'      => $used,
            'limit'     => $limit,
            'unlimited' => $limit === null,
            'used_mb'   => round($used / 1024 / 1024, 1),
            'limit_mb'  => $limit ? round($limit / 1024 / 1024) : null,
        ];
    }

    /**
     * Lève une exception si le quota est dépassé.
     * $fileSize : taille du fichier qu'on s'apprête à ajouter.
     */
    public function assertQuotaNotExceeded(int $userId, int $fileSize): void
    {
        $info = $this->getStorageInfo($userId);

        if ($info['unlimited']) return;

        if ($info['used'] + $fileSize > $info['limit']) {
            $usedMb  = $info['used_mb'];
            $limitMb = $info['limit_mb'];
            throw new \RuntimeException(
                "Quota de stockage atteint ({$usedMb} Mo / {$limitMb} Mo). " .
                "Passez en PLUS pour bénéficier d'un espace illimité."
            );
        }
    }

    /**
     * Déplace et compresse une image (JPG/PNG/WEBP → JPEG 85%).
     * Pour un PDF, fait un simple move_uploaded_file.
     * Retourne le chemin relatif public du fichier sauvegardé.
     */
    public function savePatternFile(array $file, string $uploadDir, string $filenameBase): string
    {
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $isPdf = $file['type'] === 'application/pdf';

        if ($isPdf) {
            $filename    = $filenameBase . '.pdf';
            $destination = $uploadDir . '/' . $filename;

            if (!move_uploaded_file($file['tmp_name'], $destination)) {
                throw new \RuntimeException('Erreur lors de l\'enregistrement du fichier PDF');
            }
        } else {
            $filename    = $filenameBase . '.jpg';
            $destination = $uploadDir . '/' . $filename;
            $this->compressImage($file['tmp_name'], $destination, $file['size']);
        }

        // Chemin relatif depuis public/
        $relative = str_replace($this->publicDir, '', $uploadDir) . '/' . $filename;
        return $relative;
    }

    // -------------------------------------------------------------------------

    private function calculateUsedStorage(int $userId): int
    {
        $total = 0;

        // Patrons de projets
        $stmt = $this->db->prepare(
            'SELECT pattern_path FROM projects WHERE user_id = :id AND pattern_path IS NOT NULL'
        );
        $stmt->execute([':id' => $userId]);
        foreach ($stmt->fetchAll(PDO::FETCH_COLUMN) as $path) {
            $abs = $this->publicDir . $path;
            if (file_exists($abs)) $total += filesize($abs);
        }

        // Bibliothèque de patrons
        $stmt = $this->db->prepare(
            'SELECT file_path FROM pattern_library WHERE user_id = :id AND file_path IS NOT NULL'
        );
        $stmt->execute([':id' => $userId]);
        foreach ($stmt->fetchAll(PDO::FETCH_COLUMN) as $path) {
            $abs = $this->publicDir . $path;
            if (file_exists($abs)) $total += filesize($abs);
        }

        return $total;
    }

    private function compressImage(string $tmpPath, string $destPath, int $originalSize): void
    {
        $imageInfo = getimagesize($tmpPath);
        if (!$imageInfo) {
            throw new \RuntimeException('Impossible de lire l\'image');
        }

        $src = match ($imageInfo[2]) {
            IMAGETYPE_JPEG => imagecreatefromjpeg($tmpPath),
            IMAGETYPE_PNG  => imagecreatefrompng($tmpPath),
            IMAGETYPE_WEBP => imagecreatefromwebp($tmpPath),
            default        => throw new \RuntimeException('Format image non supporté'),
        };

        if (!$src) throw new \RuntimeException('Erreur lecture image GD');

        // Correction orientation EXIF
        if ($imageInfo[2] === IMAGETYPE_JPEG && function_exists('exif_read_data')) {
            $exif        = @exif_read_data($tmpPath);
            $orientation = $exif['Orientation'] ?? 1;
            $src         = match ($orientation) {
                3       => imagerotate($src, 180, 0),
                6       => imagerotate($src, -90, 0),
                8       => imagerotate($src, 90, 0),
                default => $src,
            };
        }

        $srcW = imagesx($src);
        $srcH = imagesy($src);

        if ($srcW > self::IMAGE_MAX_DIM || $srcH > self::IMAGE_MAX_DIM) {
            $ratio = min(self::IMAGE_MAX_DIM / $srcW, self::IMAGE_MAX_DIM / $srcH);
            $newW  = (int) round($srcW * $ratio);
            $newH  = (int) round($srcH * $ratio);
        } else {
            $newW = $srcW;
            $newH = $srcH;
        }

        $dst = imagecreatetruecolor($newW, $newH);
        imagecopyresampled($dst, $src, 0, 0, 0, 0, $newW, $newH, $srcW, $srcH);
        imagedestroy($src);

        imagejpeg($dst, $destPath, self::IMAGE_QUALITY);
        imagedestroy($dst);

        error_log(sprintf(
            '[PATTERN COMPRESS] %dx%d → %dx%d | %s KB → %s KB',
            $srcW, $srcH, $newW, $newH,
            round($originalSize / 1024),
            round(filesize($destPath) / 1024)
        ));
    }
}
