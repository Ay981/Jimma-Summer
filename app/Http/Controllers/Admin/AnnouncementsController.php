<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\Halqa;
use App\Models\User;
use App\Services\FcmService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AnnouncementsController extends Controller
{
    public function index(): Response
    {
        $announcements = Announcement::with(['poster:id,name', 'halqa:id,name'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($a) => [
                'id'         => $a->id,
                'title'      => $a->title,
                'body'       => $a->body,
                'posted_by'  => $a->poster?->name ?? '—',
                'halqa'      => $a->halqa?->name ?? 'All halqas',
                'created_at' => Carbon::parse($a->created_at)->format('d M Y H:i'),
            ])->toArray();

        return Inertia::render('Admin/Announcements', [
            'announcements' => $announcements,
            'halqas'        => Halqa::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'title'    => ['required', 'string', 'max:255'],
            'body'     => ['required', 'string', 'max:5000'],
            'halqa_id' => ['nullable', 'exists:halqas,id'],
        ]);

        $announcement = Announcement::create([
            'posted_by' => auth()->id(),
            'halqa_id'  => $request->halqa_id,
            'title'     => $request->title,
            'body'      => $request->body,
        ]);

        $this->notifyRelevantUsers($announcement);

        return back()->with('success', 'Announcement posted.');
    }

    public function update(Request $request, Announcement $announcement): RedirectResponse
    {
        $request->validate([
            'title'    => ['required', 'string', 'max:255'],
            'body'     => ['required', 'string', 'max:5000'],
            'halqa_id' => ['nullable', 'exists:halqas,id'],
        ]);

        $announcement->update($request->only('title', 'body', 'halqa_id'));
        return back()->with('success', 'Announcement updated.');
    }

    public function destroy(Announcement $announcement): RedirectResponse
    {
        $announcement->delete();
        return back()->with('success', 'Announcement deleted.');
    }

    private function notifyRelevantUsers(Announcement $announcement): void
    {
        $query = User::whereIn('role', ['student', 'leader'])->where('is_active', true);

        if ($announcement->halqa_id) {
            $query->where('halqa_id', $announcement->halqa_id);
        }

        $users = $query->get();
        $route = fn ($u) => $u->role === 'student' ? '/student/announcements' : '/leader/announcements';

        foreach ($users as $user) {
            $user->notifications()->create([
                'id'              => Str::uuid(),
                'type'            => 'App\Notifications\NewAnnouncement',
                'notifiable_type' => User::class,
                'notifiable_id'   => $user->id,
                'data'            => ['message' => "New announcement: {$announcement->title}", 'redirect' => $route($user)],
                'created_at'      => now(),
            ]);
        }

        app(FcmService::class)->sendToUsers(
            $users->pluck('id')->toArray(),
            $announcement->title,
            $announcement->body,
            '/student/announcements',
        );
    }
}
