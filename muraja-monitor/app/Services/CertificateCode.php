<?php

namespace App\Services;

use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;

class CertificateCode
{
    public static function forStudent(User $student, CarbonInterface|string|null $programEnd = null): string
    {
        [$year, $serial] = self::partsFromStudentId($student->student_id);

        $year ??= self::yearFromDate($programEnd);
        $serial ??= (string) $student->id;

        return 'IMS-' . $year . '-' . str_pad($serial, 4, '0', STR_PAD_LEFT);
    }

    public static function verificationUrl(string $code): string
    {
        return rtrim(config('app.url'), '/') . '/verify/certificate/' . rawurlencode(strtoupper($code));
    }

    public static function studentForCode(string $code): ?User
    {
        $parts = self::parse($code);
        if (!$parts) {
            return null;
        }

        $serial = ltrim($parts['serial'], '0') ?: '0';
        $studentIds = array_values(array_unique([
            'JUMU-' . $parts['year'] . '-' . $parts['serial'],
            'JUMU-' . $parts['year'] . '-' . str_pad($serial, 3, '0', STR_PAD_LEFT),
            'JUMU-' . $parts['year'] . '-' . $serial,
        ]));

        return User::where('role', 'student')
            ->whereIn('student_id', $studentIds)
            ->first()
            ?? User::where('role', 'student')->whereKey((int) $serial)->first();
    }

    private static function parse(string $code): ?array
    {
        if (!preg_match('/^IMS-(\d{4})-(\d{3,6})$/', strtoupper(trim($code)), $matches)) {
            return null;
        }

        return ['year' => $matches[1], 'serial' => $matches[2]];
    }

    private static function partsFromStudentId(?string $studentId): array
    {
        if ($studentId && preg_match('/^JUMU-(\d{4})-(\d+)$/i', $studentId, $matches)) {
            return [$matches[1], $matches[2]];
        }

        return [null, null];
    }

    private static function yearFromDate(CarbonInterface|string|null $date): string
    {
        if ($date instanceof CarbonInterface) {
            return $date->format('Y');
        }

        return $date ? Carbon::parse($date)->format('Y') : now()->format('Y');
    }
}
