<?php

namespace App\Http\Controllers\Leader;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
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
                'posted_by'  => $a->poster?->name ?? '—',
                'mine'       => $a->posted_by === $leader->id,
                'created_at' => Carbon::parse($a->created_at)->format('d M Y'),
            ])->toArray();

        return Inertia::render('Leader/Announcements', [
            'announcements' => $announcements,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $leader = auth()->user();
        $halqa  = $leader->ledHalqa;
        abort_if(!$halqa, 403, 'You are not assigned to a halqa.');

        $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'body'  => ['required', 'string', 'max:5000'],
        ]);

        $announcement = Announcement::create([
            'posted_by' => $leader->id,
            'halqa_id'  => $halqa->id,
            'title'     => $request->title,
            'body'      => $request->body,
        ]);

        $students = User::where('halqa_id', $halqa->id)
            ->where('role', 'student')
            ->where('is_active', true)
            ->get();

        foreach ($students as $student) {
            $student->notifications()->create([
                'id'              => Str::uuid(),
                'type'            => 'App\Notifications\NewAnnouncement',
                'notifiable_type' => User::class,
                'notifiable_id'   => $student->id,
                'data'            => json_encode([
                    'message'  => "New announcement from your leader: {$announcement->title}",
                    'redirect' => '/student/announcements',
                ]),
                'created_at' => now(),
            ]);
        }

        return back()->with('success', 'Announcement posted to your halqa.');
    }

    public function destroy(Announcement $announcement): RedirectResponse
    {
        $leader = auth()->user();
        abort_if($announcement->posted_by !== $leader->id, 403);
        $announcement->delete();
        return back()->with('success', 'Announcement deleted.');
    }
}
