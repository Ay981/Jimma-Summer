<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\LeaderCode;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    // ── Login ────────────────────────────────────────────────────────────────

    public function showLogin(): Response
    {
        return Inertia::render('Auth/Login');
    }

    public function login(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'student_id' => ['required', 'string'],
            'password'   => ['required', 'string'],
        ]);

        $user = User::where('student_id', $credentials['student_id'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            return back()->withErrors([
                'student_id' => 'Invalid student ID or password.',
            ])->onlyInput('student_id');
        }

        if (! $user->is_active) {
            return back()->withErrors([
                'student_id' => 'This account is deactivated. Contact the admin.',
            ])->onlyInput('student_id');
        }

        Auth::login($user, remember: false);
        $request->session()->regenerate();

        AuditLog::create([
            'user_id' => $user->id,
            'action'  => 'login',
        ]);

        return redirect()->intended($user->dashboardRoute());
    }

    // ── Logout ───────────────────────────────────────────────────────────────

    public function logout(Request $request): RedirectResponse
    {
        AuditLog::create([
            'user_id' => Auth::id(),
            'action'  => 'logout',
        ]);

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }

    // ── Change Password ──────────────────────────────────────────────────────

    public function showChangePassword(): Response
    {
        $user = auth()->user();
        return Inertia::render('Auth/ChangePassword', [
            'role'         => $user->role,
            'current_name' => $user->name,
        ]);
    }

    public function changePassword(Request $request): RedirectResponse
    {
        $user = $request->user();

        $rules = [
            'password'              => ['required', 'string', 'min:8', 'confirmed'],
            'password_confirmation' => ['required', 'string'],
        ];

        if ($user->role === 'leader') {
            $rules['name'] = ['required', 'string', 'max:255'];
        }

        $request->validate($rules);

        $updates = [
            'password'             => Hash::make($request->password),
            'must_change_password' => false,
        ];

        if ($user->role === 'leader' && $request->filled('name')) {
            $updates['name'] = $request->name;
        }

        $user->update($updates);

        AuditLog::create([
            'user_id' => $user->id,
            'action'  => 'password_changed',
        ]);

        return redirect($user->dashboardRoute());
    }

    // ── Leader Onboarding ────────────────────────────────────────────────────

    public function showLeaderSetup(): Response
    {
        return Inertia::render('Auth/LeaderSetup');
    }

    public function leaderSetup(Request $request): RedirectResponse
    {
        $request->validate([
            'code'       => ['required', 'string', 'regex:/^LDR-[A-Z0-9]{4}$/'],
            'name'       => ['required', 'string', 'max:255'],
            'student_id' => ['required', 'string', 'max:50', 'unique:users,student_id'],
            'phone'      => ['nullable', 'string', 'max:20'],
            'password'   => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $leaderCode = LeaderCode::where('code', $request->code)
            ->where('is_active', true)
            ->whereNull('used_by')
            ->first();

        if (! $leaderCode) {
            return back()->withErrors([
                'code' => 'Invalid or already-used activation code.',
            ]);
        }

        $user = User::create([
            'name'                 => $request->name,
            'student_id'           => $request->student_id,
            'phone'                => $request->phone,
            'password'             => Hash::make($request->password),
            'role'                 => 'leader',
            'halqa_id'             => $leaderCode->halqa_id,
            'is_active'            => true,
            'must_change_password' => false,
        ]);

        // Assign user as leader of the halqa
        $leaderCode->halqa->update(['leader_id' => $user->id]);

        // Mark the code as used (stays active so admin can see who used it)
        $leaderCode->update(['used_by' => $user->id]);

        AuditLog::create([
            'user_id' => $user->id,
            'action'  => 'leader_onboarded',
            'meta'    => ['code' => $request->code, 'halqa_id' => $leaderCode->halqa_id],
        ]);

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->route('leader.dashboard');
    }
}
