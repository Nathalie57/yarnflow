<?php

declare(strict_types=1);

namespace App\Services;

/** Sélection verbatim, sans appel IA ni rapprochement approximatif des sections. */
final class FlowPatternContextSelector
{
    public const MAX_CHARACTERS = 30000;

    public static function select(string $text, ?array $activeSection): string
    {
        if (mb_strlen($text) <= self::MAX_CHARACTERS) {
            return $text;
        }

        $blocks = self::blocks($text);
        $active = self::findActiveBlock($blocks, $activeSection);
        $notice = "[PATTERN PARTIEL — extraits verbatim dans l’ordre du patron ; des passages sont omis. Une définition non visible ne doit pas être inventée.]\n";
        if ($active === null) {
            $notice .= "[La section active n’a pas de correspondance unique dans le texte disponible. Le début du patron est fourni sans supposer de correspondance.]\n";
            return $notice . mb_substr($text, 0, self::MAX_CHARACTERS - mb_strlen($notice));
        }

        // Réserver d’abord les instructions actives et leurs définitions nommées.
        // Les autres passages remplissent seulement le budget restant.
        $selected = [];
        $remaining = self::MAX_CHARACTERS - mb_strlen($notice);
        $add = static function (int $index, int $allowance) use (&$selected, &$remaining, $blocks): void {
            $separator = "\n\n[EXTRAIT DU PATRON ; une éventuelle coupure est signalée ci-dessous]\n";
            $cut = "\n[Suite de ce passage omise.]";
            $available = min($allowance, $remaining - mb_strlen($separator) - mb_strlen($cut));
            if ($available <= 0 || isset($selected[$index])) return;
            $block = $blocks[$index]['text'];
            $excerpt = mb_substr($block, 0, $available);
            if (mb_strlen($block) > $available) $excerpt .= $cut;
            $selected[$index] = $separator . $excerpt;
            $remaining -= mb_strlen($selected[$index]);
        };

        $add($active, 12000);
        $references = ($activeSection['description'] ?? '') . "\n" . $blocks[$active]['text'];
        $visited = [$active => true];
        // Inclure aussi les renvois des définitions retenues (avec borne explicite).
        for ($depth = 0; $depth < 3; $depth++) {
            $nextReferences = '';
            foreach ($blocks as $index => $block) {
                if (isset($visited[$index]) || !self::isReferenced($block['title'], $references)) continue;
                $visited[$index] = true;
                $add($index, 8000);
                $nextReferences .= "\n" . $block['text'];
            }
            if ($nextReferences === '') break;
            $references = $nextReferences;
        }
        // Début du patron, tailles, matériel, sections voisines : uniquement après
        // la section active et les références, sans dépasser la limite existante.
        foreach ($blocks as $index => $block) {
            $add($index, $remaining);
        }
        ksort($selected);
        return $notice . implode('', $selected);
    }

    private static function blocks(string $text): array
    {
        // Le format d’extraction/traduction utilise ###. Les notes libres peuvent
        // aussi contenir des titres de définition en capitales, comme chez DROPS.
        preg_match_all('/^(?:#{1,6}\h+([^\r\n]+)|([\p{Lu}\d][\p{Lu}\d\h\-–—’\x27\/()]{3,100}):?\h*|([\p{Lu}][^\r\n]{3,100}):\h*)\r?$/mu', $text, $matches, PREG_OFFSET_CAPTURE);
        $starts = [];
        foreach ($matches[0] as $i => $match) {
            $title = ($matches[1][$i][0] ?? '') ?: (($matches[2][$i][0] ?? '') ?: ($matches[3][$i][0] ?? ''));
            $starts[] = ['offset' => $match[1], 'title' => trim($title, " \t:")];
        }
        if (!$starts || $starts[0]['offset'] > 0) {
            array_unshift($starts, ['offset' => 0, 'title' => '']);
        }
        $blocks = [];
        foreach ($starts as $i => $start) {
            $end = $starts[$i + 1]['offset'] ?? strlen($text);
            $blocks[] = ['title' => $start['title'], 'text' => substr($text, $start['offset'], $end - $start['offset'])];
        }
        return $blocks;
    }

    private static function findActiveBlock(array &$blocks, ?array $section): ?int
    {
        $name = self::normalize((string)($section['name'] ?? ''));
        $matches = [];
        foreach ($blocks as $index => $block) {
            if ($name !== '' && self::normalize($block['title']) === $name) $matches[] = $index;
        }
        if (count($matches) === 1) return $matches[0];
        // Une description identique peut établir un repère même si le nom manuel
        // diffère. Aucun choix par position, similarité floue ou traduction supposée.
        $description = trim((string)($section['description'] ?? ''));
        if (mb_strlen($description) < 40) return null;
        $matches = [];
        foreach ($blocks as $index => $block) {
            $occurrences = substr_count($block['text'], $description);
            if ($occurrences > 1) return null;
            if ($occurrences === 1) $matches[] = $index;
        }
        if (count($matches) !== 1) return null;
        $index = $matches[0];
        $offset = strpos($blocks[$index]['text'], $description);
        // Un texte libre peut contenir la description loin après son début.
        // Découper à ce repère exact évite de conserver seulement le préambule.
        if ($offset > 1000) {
            $text = $blocks[$index]['text'];
            $blocks[$index]['text'] = substr($text, 0, $offset);
            array_splice($blocks, $index + 1, 0, [['title' => '', 'text' => substr($text, $offset)]]);
            return $index + 1;
        }
        return $index;
    }

    private static function normalize(string $text): string
    {
        return trim((string)preg_replace('/[^\p{L}\p{N}]+/u', ' ', mb_strtolower($text)));
    }

    private static function isReferenced(string $title, string $instructions): bool
    {
        $name = self::normalize($title);
        if (mb_strlen($name) < 4) return false;
        $instructions = ' ' . self::normalize($instructions) . ' ';
        if (str_contains($instructions, ' ' . $name . ' ')) return true;
        // Un renvoi aux bandes inclut leurs deux variantes explicitement nommées.
        $base = preg_replace('/\s+(?:beginning|end) of (?:row|round)$|\s+(?:début|fin) (?:du|de) (?:rang|tour)$/u', '', $name);
        return $base !== $name && mb_strlen($base) >= 4
            && str_contains($instructions, ' ' . $base . ' ');
    }
}
