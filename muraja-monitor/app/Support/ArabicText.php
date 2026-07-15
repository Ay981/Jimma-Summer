<?php

namespace App\Support;

use Arphp\Glyphs;

/**
 * Shapes Arabic text into presentation-form glyphs (reversed for LTR renderers).
 *
 * DomPDF has no Arabic shaping/bidi engine, so raw Arabic pulled from the
 * database (e.g. halqa names like "مع القرآن") renders with disconnected,
 * left-to-right letters. Running it through utf8Glyphs() produces the same
 * pre-shaped, visually-ordered form that the hard-coded Bismillah uses,
 * so DomPDF draws it correctly.
 */
class ArabicText
{
    private static ?Glyphs $glyphs = null;

    /** True when the string contains any Arabic-script character. */
    public static function hasArabic(?string $text): bool
    {
        return $text !== null && preg_match('/[\x{0600}-\x{06FF}\x{0750}-\x{077F}\x{FB50}-\x{FDFF}\x{FE70}-\x{FEFF}]/u', $text) === 1;
    }

    /** Shape Arabic text for DomPDF; non-Arabic strings are returned unchanged. */
    public static function shape(?string $text): string
    {
        if ($text === null || $text === '') {
            return '';
        }

        if (! self::hasArabic($text)) {
            return $text;
        }

        self::$glyphs ??= new Glyphs();

        return self::$glyphs->utf8Glyphs($text);
    }
}
