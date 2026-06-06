<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class AnnouncementController extends Controller
{
    public function index(): Response
    {
        $user    = auth()->user();
        $halqaId = $user->halqa_id;

        $announcements = Announcement::active()
            ->where(function ($q) use ($halqaId) {
                $q->whereNull('halqa_id')->orWhere('halqa_id', $halqaId);
            })
            ->latest('created_at')
            ->get()
            ->map(fn ($a) => [
                'id'         => $a->id,
                'title'      => $a->title,
                'body'       => $a->body,
                'created_at' => Carbon::parse($a->created_at)->format('d M Y'),
            ])->toArray();

        return Inertia::render('Student/Announcements', [
            'announcements' => $announcements,
        ]);
    }
}
