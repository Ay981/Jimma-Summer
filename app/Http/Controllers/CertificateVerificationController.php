<?php

namespace App\Http\Controllers;

use App\Models\ProgramSetting;
use App\Services\CertificateCode;
use Carbon\Carbon;
use Illuminate\Contracts\View\View;

class CertificateVerificationController extends Controller
{
    public function __invoke(string $code): View
    {
        $code = strtoupper(trim($code));
        $student = CertificateCode::studentForCode($code);
        $endRaw = ProgramSetting::get('program_end_date');
        $end = $endRaw ? Carbon::parse($endRaw) : Carbon::today();

        if (!$student || !hash_equals(CertificateCode::forStudent($student, $end), $code)) {
            return view('certificate-verify', [
                'valid' => false,
                'code' => $code,
            ]);
        }

        $start = Carbon::parse(ProgramSetting::get('program_start_date', Carbon::today()->toDateString()));

        return view('certificate-verify', [
            'valid' => true,
            'code' => $code,
            'student' => $student,
            'program_name' => ProgramSetting::get('program_name', "Muraja'a Monitor"),
            'start' => $start->format('d M Y'),
            'end' => $end->format('d M Y'),
        ]);
    }
}
