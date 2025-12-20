<?php
/**
 * @file PDFService.php
 * @brief Service de génération de PDF avec filigrane
 * @author Nathalie + AI Assistants
 * @created 2025-11-12
 * @modified 2025-11-12 by [AI:Claude] - Création initiale
 */

declare(strict_types=1);

namespace App\Services;

use TCPDF;
use App\Models\Pattern;

/**
 * [AI:Claude] Service de génération de PDF avec filigrane de protection
 */
class PDFService
{
    private Pattern $patternModel;
    private string $outputDir;

    public function __construct()
    {
        $this->patternModel = new Pattern();
        $this->outputDir = __DIR__.'/../../generated/';

        if (!is_dir($this->outputDir))
            mkdir($this->outputDir, 0755, true);
    }

    /**
     * [AI:Claude] Générer un PDF pour un patron avec filigrane
     *
     * @param int $patternId ID du patron
     * @param string $watermarkText Texte du filigrane (email utilisateur)
     * @return array Résultat avec chemin du fichier
     * @throws \Exception Si le patron n'existe pas
     */
    public function generatePDF(int $patternId, string $watermarkText): array
    {
        $pattern = $this->patternModel->findById($patternId);

        if ($pattern === null)
            throw new \Exception('Patron introuvable');

        $pdf = new TCPDF(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);

        $pdf->SetCreator('Patron Maker Crochet');
        $pdf->SetAuthor('Patron Maker');
        $pdf->SetTitle($pattern['title']);
        $pdf->SetSubject('Patron de crochet');

        $pdf->setPrintHeader(false);
        $pdf->setPrintFooter(false);

        $pdf->SetMargins(15, 15, 15);
        $pdf->SetAutoPageBreak(true, 15);

        $pdf->AddPage();

        $pdf->SetFont('dejavusans', 'B', 20);
        $pdf->Cell(0, 10, $pattern['title'], 0, 1, 'C');
        $pdf->Ln(5);

        $pdf->SetFont('dejavusans', '', 10);
        $pdf->SetTextColor(100, 100, 100);
        $pdf->Cell(0, 5, 'Niveau : '.ucfirst($pattern['level']), 0, 1);
        $pdf->Cell(0, 5, 'Type : '.ucfirst($pattern['type']), 0, 1);

        if ($pattern['size'])
            $pdf->Cell(0, 5, 'Taille : '.$pattern['size'], 0, 1);

        if ($pattern['estimated_time'])
            $pdf->Cell(0, 5, 'Temps estimé : '.$pattern['estimated_time'], 0, 1);

        $pdf->Ln(5);

        $pdf->SetFont('dejavusans', 'B', 14);
        $pdf->SetTextColor(0, 0, 0);
        $pdf->Cell(0, 8, 'Matériel nécessaire', 0, 1);
        $pdf->SetFont('dejavusans', '', 10);

        if ($pattern['yarn_weight'])
            $pdf->Cell(0, 5, '• Fil : '.$pattern['yarn_weight'], 0, 1);

        if ($pattern['hook_size'])
            $pdf->Cell(0, 5, '• Crochet : '.$pattern['hook_size'], 0, 1);

        if ($pattern['materials']) {
            $materials = json_decode($pattern['materials'], true);

            if (is_array($materials)) {
                foreach ($materials as $material)
                    $pdf->Cell(0, 5, '• '.$material, 0, 1);
            }
        }

        $pdf->Ln(5);

        $pdf->SetFont('dejavusans', 'B', 14);
        $pdf->Cell(0, 8, 'Instructions', 0, 1);
        $pdf->SetFont('dejavusans', '', 10);

        $content = $pattern['content'] ?? '';
        $pdf->writeHTML($this->formatMarkdownToHTML($content), true, false, true, false, '');

        $this->addWatermark($pdf, $watermarkText);

        $filename = 'patron_'.$patternId.'_'.time().'.pdf';
        $filepath = $this->outputDir.$filename;

        $pdf->Output($filepath, 'F');

        return [
            'success' => true,
            'filename' => $filename,
            'filepath' => $filepath,
            'size' => filesize($filepath)
        ];
    }

    /**
     * [AI:Claude] Ajouter un filigrane sur toutes les pages
     *
     * @param TCPDF $pdf Instance PDF
     * @param string $text Texte du filigrane
     */
    private function addWatermark(TCPDF $pdf, string $text): void
    {
        $pageCount = $pdf->getNumPages();

        for ($i = 1; $i <= $pageCount; $i++) {
            $pdf->setPage($i);

            $pdf->SetAlpha(0.2);
            $pdf->SetFont('dejavusans', 'B', 30);
            $pdf->SetTextColor(200, 200, 200);

            $pdf->StartTransform();
            $pdf->Rotate(45, 105, 148);
            $pdf->Text(30, 150, $text);
            $pdf->Text(30, 180, 'Patron Maker Crochet');
            $pdf->StopTransform();

            $pdf->SetAlpha(1);
            $pdf->SetTextColor(0, 0, 0);
        }
    }

    /**
     * [AI:Claude] Convertir markdown simple en HTML pour TCPDF
     *
     * @param string $markdown Texte markdown
     * @return string HTML formaté
     */
    private function formatMarkdownToHTML(string $markdown): string
    {
        $html = $markdown;

        $html = preg_replace('/\*\*(.+?)\*\*/', '<b>$1</b>', $html);
        $html = preg_replace('/\*(.+?)\*/', '<i>$1</i>', $html);

        $html = preg_replace('/^### (.+)$/m', '<h3>$1</h3>', $html);
        $html = preg_replace('/^## (.+)$/m', '<h2>$1</h2>', $html);
        $html = preg_replace('/^# (.+)$/m', '<h1>$1</h1>', $html);

        $html = preg_replace('/^- (.+)$/m', '• $1<br>', $html);

        $html = nl2br($html);

        return $html;
    }

    /**
     * [AI:Claude] Obtenir le chemin d'un PDF généré
     *
     * @param string $filename Nom du fichier
     * @return string|null Chemin complet ou null si inexistant
     */
    public function getPDFPath(string $filename): ?string
    {
        $filepath = $this->outputDir.$filename;
        return file_exists($filepath) ? $filepath : null;
    }

    /**
     * [AI:Claude] Supprimer un PDF
     *
     * @param string $filename Nom du fichier
     * @return bool Succès de la suppression
     */
    public function deletePDF(string $filename): bool
    {
        $filepath = $this->outputDir.$filename;

        if (file_exists($filepath))
            return unlink($filepath);

        return false;
    }

    /**
     * [AI:Claude] Nettoyer les anciens PDF (plus de 30 jours)
     *
     * @return int Nombre de fichiers supprimés
     */
    public function cleanOldPDFs(): int
    {
        $deleted = 0;
        $files = glob($this->outputDir.'*.pdf');
        $expirationTime = time() - (30 * 24 * 60 * 60);

        foreach ($files as $file) {
            if (filemtime($file) < $expirationTime) {
                if (unlink($file))
                    $deleted++;
            }
        }

        return $deleted;
    }
}
