<?php

namespace App\Http\Controllers;

use Symfony\Component\Process\Process;

class OnboardingController extends Controller
{
    public function downloadStudent()
    {
        return $this->servePdf('student-guide.pdf', 'student-onboarding-guide.pdf');
    }

    public function downloadLeader()
    {
        return $this->servePdf('leader-guide.pdf', 'leader-onboarding-guide.pdf');
    }

    public function recapture()
    {
        $process = new Process(
            ['node', base_path('scripts/capture-onboarding.mjs')],
            base_path(),
            array_merge($_ENV, ['APP_URL' => config('app.url')]),
        );
        $process->setTimeout(300);
        $process->run();

        if ($process->isSuccessful()) {
            return back()->with('success', 'Onboarding guides regenerated successfully.');
        }

        return back()->with('error', 'Regeneration failed: ' . $process->getErrorOutput());
    }

    private function servePdf(string $filename, string $downloadName): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $path = storage_path('app/private/onboarding/' . $filename);

        abort_unless(file_exists($path), 503, 'Onboarding guide not yet generated. Ask your admin to regenerate it.');

        return response()->download($path, $downloadName, ['Content-Type' => 'application/pdf']);
    }
}
