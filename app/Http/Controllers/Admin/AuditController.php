<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class AuditController extends Controller
{
    public function index(): Response
    {
        $logs = AuditLog::with('user:id,name,role')
            ->orderByDesc('created_at')
            ->take(500)
            ->get()
            ->map(fn ($l) => [
                'id'          => $l->id,
                'user'        => $l->user ? ['name' => $l->user->name, 'role' => $l->user->role] : null,
                'action'      => $l->action,
                'target_type' => $l->target_type,
                'target_id'   => $l->target_id,
                'meta'        => $l->meta,
                'created_at'  => Carbon::parse($l->created_at)->format('Y-m-d H:i'),
            ])->toArray();

        $actions = AuditLog::distinct()->pluck('action')->sort()->values()->toArray();

        return Inertia::render('Admin/Audit', compact('logs', 'actions'));
    }
}
