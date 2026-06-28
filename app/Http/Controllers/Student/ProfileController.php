<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function show(): Response
    {
        $user = auth()->user();

        return Inertia::render('Student/ProfileComplete', [
            'user' => [
                'name'              => $user->name,
                'current_juz'       => $user->current_juz,
                'memo_level'        => $user->memo_level,
                'available_times'   => $user->available_times ?? [],
                'available_days'    => $user->available_days  ?? [],
                'telegram_username' => $user->telegram_username ?? '',
            ],
        ]);
    }

    public function edit(): Response
    {
        $user = auth()->user();
        return Inertia::render('Student/Profile', [
            'profile' => [
                'memo_level'      => $user->memo_level,
                'current_juz'     => $user->current_juz,
                'available_times' => $user->available_times ?? [],
                'available_days'  => $user->available_days  ?? [],
            ],
            'student' => [
                'name'            => $user->name,
                'student_id'      => $user->student_id,
                'halqa'           => $user->halqa?->name,
                'telegram_username' => $user->telegram_username ?? '',
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $request->validate([
            'memo_level'        => ['required', 'string', 'in:less_than_1,1_5,6_10,11_20,21_29,full_hifz'],
            'current_juz'       => ['required', 'integer', 'min:1', 'max:30'],
            'available_times'   => ['required', 'array', 'min:1'],
            'available_times.*' => ['in:after_subhi,after_zuhr,after_asr,after_maghrib,after_isha'],
            'available_days'    => ['required', 'array', 'min:1'],
            'available_days.*'  => ['in:monday,tuesday,wednesday,thursday,friday,saturday,sunday'],
            'telegram_username' => ['nullable', 'string', 'max:64'],
        ]);

        $request->user()->update([
            'memo_level'      => $request->memo_level,
            'current_juz'     => $request->current_juz,
            'available_times' => $request->available_times,
            'available_days'  => $request->available_days,
            'telegram_username'=> $request->telegram_username ?? null,
        ]);

        return back()->with('success', 'Profile updated.');
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'memo_level'        => ['required', 'string', 'in:less_than_1,1_5,6_10,11_20,21_29,full_hifz'],
            'current_juz'       => ['required', 'integer', 'min:1', 'max:30'],
            'available_times'   => ['required', 'array', 'min:1'],
            'available_times.*' => ['in:after_subhi,after_zuhr,after_asr,after_maghrib,after_isha'],
            'available_days'    => ['required', 'array', 'min:1'],
            'available_days.*'  => ['in:monday,tuesday,wednesday,thursday,friday,saturday,sunday'],
        ]);

        $request->user()->update([
            'memo_level'      => $request->memo_level,
            'current_juz'     => $request->current_juz,
            'available_times' => $request->available_times,
            'available_days'  => $request->available_days,
            'profile_completed' => true,
        ]);

        return redirect()->route('student.dashboard')->with('success', 'Profile completed. Welcome!');
    }
}
