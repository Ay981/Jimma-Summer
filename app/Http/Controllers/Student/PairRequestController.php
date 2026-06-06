<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\PairingRequest;
use App\Models\ProgramSetting;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PairRequestController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        if (!ProgramSetting::get('pairing_window_open', false)) {
            return back()->with('error', 'The pairing request window is currently closed.');
        }

        $request->validate([
            'partner_student_id' => ['required', 'string'],
        ]);

        $student = auth()->user();

        // Look up partner by their student_id code
        $partner = User::where('student_id', $request->partner_student_id)
            ->where('role', 'student')
            ->where('is_active', true)
            ->first();

        if (!$partner) {
            return back()->withErrors(['partner_student_id' => 'No active student found with that ID.']);
        }

        if ($partner->id === $student->id) {
            return back()->withErrors(['partner_student_id' => 'You cannot request yourself as a partner.']);
        }

        // Upsert — student can change their request anytime window is open
        PairingRequest::updateOrCreate(
            ['student_id' => $student->id],
            ['requested_partner_id' => $partner->id]
        );

        return back()->with('success', "Partner request sent for {$partner->name}. You can change this anytime before the window closes.");
    }

    public function destroy(): RedirectResponse
    {
        if (!ProgramSetting::get('pairing_window_open', false)) {
            return back()->with('error', 'The pairing request window is currently closed.');
        }

        PairingRequest::where('student_id', auth()->id())->delete();

        return back()->with('success', 'Your partner request has been withdrawn.');
    }
}
