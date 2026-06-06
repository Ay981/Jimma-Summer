<?php

namespace App\Http\Controllers\Leader;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class AnnouncementController extends Controller
{
    public function index(): Response
    {
        $leader  = auth()->user();
        $halqa   = $leader->ledHalqa;
        $halqaId = $halqa?->id;

        $announcements = Announcement::active()
            ->where(function ($q) use ($halqaId) {
                $q->whereNull('halqa_id');
                if ($halqaId) {
                    $q->orWhere('halqa_id', $halqaId);
                }
            })
            ->latest('created_at')
            ->get()
            ->map(fn ($a) => [
                'id'         => $a->id,
                'title'      => $a->title,
                'body'       => $a->body,
                'created_at' => Carbon::parse($a->created_at)->format('d M Y'),
            ])->toArray();

        return Inertia::render('Leader/Announcements', [
            'announcements' => $announcements,
        ]);
    }
}
