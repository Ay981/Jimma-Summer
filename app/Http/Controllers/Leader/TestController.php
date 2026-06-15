<?php

namespace App\Http\Controllers\Leader;

use App\Http\Controllers\Controller;
use App\Models\MurajaTest;
use App\Models\Pair;
use App\Models\User;
use App\Notifications\TestRecorded;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TestController extends Controller
{
  public function store(Request $request, Pair $pair): RedirectResponse
  {
    $leader = auth()->user();
    $halqa  = $leader->ledHalqa;
    abort_if(!$halqa || $pair->halqa_id !== $halqa->id, 403);

    $data = $request->validate([
      'student_id' => ['required', 'integer'],
      'from_page'  => ['nullable', 'integer', 'min:1', 'max:604'],
      'to_page'    => ['nullable', 'integer', 'min:1', 'max:604', 'gte:from_page'],
      'from_juz'   => ['nullable', 'integer', 'min:1', 'max:30'],
      'to_juz'     => ['nullable', 'integer', 'min:1', 'max:30', 'gte:from_juz'],
      'score'      => ['required', 'integer', 'min:0', 'max:10'],
      'tested_at'  => ['required', 'date'],
    ]);

    abort_if(!in_array($data['student_id'], [$pair->student_a_id, $pair->student_b_id]), 403);

    $test = MurajaTest::create([
      ...$data,
      'leader_id' => $leader->id,
    ]);

    $student = User::find($data['student_id']);
    $student?->notify(new TestRecorded($test, $leader->name));

    return back()->with('success', 'Test recorded.');
  }

  public function update(Request $request, Pair $pair, MurajaTest $test): RedirectResponse
  {
    $leader = auth()->user();
    $halqa  = $leader->ledHalqa;
    abort_if(!$halqa || $pair->halqa_id !== $halqa->id, 403);
    abort_if($test->leader_id !== $leader->id, 403);

    $data = $request->validate([
      'from_page' => ['nullable', 'integer', 'min:1', 'max:604'],
      'to_page'   => ['nullable', 'integer', 'min:1', 'max:604', 'gte:from_page'],
      'from_juz'  => ['nullable', 'integer', 'min:1', 'max:30'],
      'to_juz'    => ['nullable', 'integer', 'min:1', 'max:30', 'gte:from_juz'],
      'score'     => ['required', 'integer', 'min:0', 'max:10'],
      'tested_at' => ['required', 'date'],
    ]);

    $test->update($data);

    return back()->with('success', 'Test updated.');
  }

  public function destroy(Pair $pair, MurajaTest $test): RedirectResponse
  {
    $leader = auth()->user();
    $halqa  = $leader->ledHalqa;
    abort_if(!$halqa || $pair->halqa_id !== $halqa->id, 403);
    abort_if($test->leader_id !== $leader->id, 403);

    $test->delete();

    return back()->with('success', 'Test deleted.');
  }
}
