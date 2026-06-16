<?php

namespace App\Http\Controllers\Leader;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Hash;

class PasswordResetController extends Controller
{
  public function reset(User $student): RedirectResponse
  {
    $leader = auth()->user();
    $halqa = $leader->ledHalqa;

    // Ensure the student belongs to this leader's halqa
    abort_if(!$halqa || $student->halqa_id !== $halqa->id, 403);
    abort_if($student->role !== "student", 403);

    $defaultPassword = \App\Models\ProgramSetting::get(
      "default_password",
      "ChangeMe@" . rand(1000, 9999),
    );
    $student->update([
      "password" => Hash::make($defaultPassword),
      "must_change_password" => true,
    ]);

    return back()->with(
      "success",
      "{$student->name}'s password has been reset. They must change it on next login.",
    );
  }
}
