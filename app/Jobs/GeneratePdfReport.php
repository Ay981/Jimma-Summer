<?php

namespace App\Jobs;

use App\Models\PdfExport;
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

    public int $timeout = 120;
    public int $tries   = 2;

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
            $pdf  = $this->buildPdf();
            $path = 'pdf-exports/' . Str::uuid() . '-' . $this->reportType . '.pdf';

            Storage::put($path, $pdf->output());

            $export->update([
                'status'   => 'ready',
                'file_path'=> $path,
                'ready_at' => now(),
            ]);

            // In-app notification
            $admin = User::find($export->requested_by);
            if ($admin) {
                $admin->notifications()->create([
                    'id'              => Str::uuid(),
                    'type'            => 'App\Notifications\PdfReady',
                    'notifiable_type' => User::class,
                    'notifiable_id'   => $admin->id,
                    'data'            => json_encode([
                        'message'   => 'Your PDF report is ready to download.',
                        'export_id' => $this->exportId,
                        'report'    => $this->reportType,
                    ]),
                    'created_at' => now(),
                ]);
            }
        } catch (\Throwable $e) {
            $export->update(['status' => 'failed', 'error_message' => $e->getMessage()]);
        }
    }

    private function buildPdf(): \Barryvdh\DomPDF\PDF
    {
        $today       = Carbon::today();
        $start       = Carbon::parse(ProgramSetting::get('program_start_date', $today->toDateString()));
        $programName = ProgramSetting::get('program_name', "Muraja'a Monitor");

        return Pdf::loadView('pdf.program-report-simple', [
            'program_name' => $programName,
            'generated'    => $today->format('d F Y'),
            'start'        => $start->format('d F Y'),
        ])->setPaper('A4', 'portrait');
    }
}
