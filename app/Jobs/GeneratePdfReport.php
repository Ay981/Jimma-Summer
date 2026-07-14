<?php

namespace App\Jobs;

use App\Http\Controllers\Admin\LeaderboardController;
use App\Models\PdfExport;
use App\Models\PairSubmission;
use App\Models\ProgramSetting;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class GeneratePdfReport implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    // 10 minutes — enough for 100 certificates with DomPDF at ~2s each
    public int $timeout = 600;

    // Don't retry: the export record is already marked failed and the user can
    // re-trigger manually. A blind retry on a zip job can produce duplicate
    // notifications and orphaned files.
    public int $tries = 1;

    public function __construct(
        public readonly int    $exportId,
        public readonly string $reportType,
    ) {}

    public function handle(): void
    {
        $export = PdfExport::find($this->exportId);
        if (!$export) return;

        $export->update(['status' => 'processing']);

        try {
            $path = $this->generate();

            $export->update([
                'status'    => 'ready',
                'file_path' => $path,
                'ready_at'  => now(),
            ]);

        } catch (\Throwable $e) {
            // Clean up any storage file that was partially written
            if ($export->file_path && Storage::exists($export->file_path)) {
                Storage::delete($export->file_path);
            }
            $export->update([
                'status'        => 'failed',
                'error_message' => $e->getMessage(),
            ]);

        }
    }

    // ── Dispatch ──────────────────────────────────────────────────────────────

    private function generate(): string
    {
        return match ($this->reportType) {
            'certificates_zip' => $this->buildCertificatesZip(),
            default            => $this->buildSinglePdf(),
        };
    }

    // ── ZIP: batch certificate export ─────────────────────────────────────────

    private function buildCertificatesZip(): string
    {
        $threshold = (int) ProgramSetting::get('certificate_threshold', 80);
        $cs        = app(\App\Services\ConsistencyService::class);

        // Eligibility is measured against each student's scheduled days, so a
        // part-week student who attended every scheduled day is not unfairly gated.
        $students = User::where('role', 'student')
            ->where('is_active', true)
            ->with('halqa')
            ->get()
            ->filter(fn ($s) => round($cs->getConsistency($s->id) ?? 0) >= $threshold);

        if ($students->isEmpty()) {
            throw new \RuntimeException('No students have met the certificate threshold.');
        }

        $lb       = new LeaderboardController();
        $awardMap = $lb->studentAwardMap();
        $dataMap  = $lb->batchCertificateData($students, $awardMap);

        $zipPath = sys_get_temp_dir() . '/certificates-' . Str::uuid() . '.zip';

        try {
            $zip = new \ZipArchive();
            if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
                throw new \RuntimeException('Could not create ZIP archive.');
            }

            foreach ($students as $student) {
                $pdf = Pdf::loadView('pdf.certificate', $dataMap[$student->id]);
                $pdf->setPaper('A4', 'landscape');
                $zip->addFromString("certificate-{$student->student_id}.pdf", $pdf->output());
                unset($pdf); // release DomPDF instance between iterations
            }

            $zip->close();

            $storagePath = 'pdf-exports/' . Str::uuid() . '-certificates.zip';
            Storage::put($storagePath, file_get_contents($zipPath));

            return $storagePath;

        } finally {
            // Always remove the temp file — runs even if an exception is thrown
            if (file_exists($zipPath)) {
                @unlink($zipPath);
            }
        }
    }

    // ── Single PDF (existing program_report type) ─────────────────────────────

    private function buildSinglePdf(): string
    {
        $today       = Carbon::today();
        $start       = Carbon::parse(ProgramSetting::get('program_start_date', $today->toDateString()));
        $programName = ProgramSetting::get('program_name', "Muraja'a Monitor");

        $pdf  = Pdf::loadView('pdf.program-report-simple', [
            'program_name' => $programName,
            'generated'    => $today->format('d F Y'),
            'start'        => $start->format('d F Y'),
        ])->setPaper('A4', 'portrait');

        $path = 'pdf-exports/' . Str::uuid() . '-' . $this->reportType . '.pdf';
        Storage::put($path, $pdf->output());

        return $path;
    }

}
