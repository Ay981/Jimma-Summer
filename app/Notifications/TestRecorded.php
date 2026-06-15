<?php

namespace App\Notifications;

use App\Models\MurajaTest;
use Illuminate\Notifications\Notification;

class TestRecorded extends Notification
{
  public function __construct(
    private readonly MurajaTest $test,
    private readonly string $leaderName,
  ) {}

  public function via(mixed $notifiable): array
  {
    return ['database'];
  }

  public function toDatabase(mixed $notifiable): array
  {
    $range = [];
    if ($this->test->from_juz && $this->test->to_juz)
      $range[] = "Juz {$this->test->from_juz}–{$this->test->to_juz}";
    if ($this->test->from_page && $this->test->to_page)
      $range[] = "pp. {$this->test->from_page}–{$this->test->to_page}";

    $rangeStr = implode(', ', $range) ?: 'recorded';

    return [
      'message'     => "Your leader {$this->leaderName} recorded a test result: {$rangeStr} — {$this->test->score}/10.",
      'test_id'     => $this->test->id,
      'score'       => $this->test->score,
      'from_juz'    => $this->test->from_juz,
      'to_juz'      => $this->test->to_juz,
      'from_page'   => $this->test->from_page,
      'to_page'     => $this->test->to_page,
      'tested_at'   => $this->test->tested_at->toDateString(),
      'leader_name' => $this->leaderName,
    ];
  }
}
