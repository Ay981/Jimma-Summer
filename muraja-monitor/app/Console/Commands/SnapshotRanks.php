<?php

namespace App\Console\Commands;

use App\Http\Controllers\Admin\LeaderboardController;
use App\Models\RankSnapshot;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class SnapshotRanks extends Command
{
    protected $signature   = 'muraja:snapshot-ranks';
    protected $description = 'Capture each student\'s and leader\'s current leaderboard rank + score, so movement can be shown over time.';

    public function handle(LeaderboardController $leaderboard): int
    {
        $today = Carbon::today()->toDateString();

        // Read fresh rather than the 5-minute cached board.
        Cache::forget('leaderboard_data');

        $students = $leaderboard->studentBoard();
        $leaders  = $leaderboard->leaderBoard();

        foreach ($students as $row) {
            RankSnapshot::updateOrCreate(
                ['subject_type' => 'student', 'subject_id' => $row['id'], 'captured_on' => $today],
                ['rank' => $row['rank'], 'rank_score' => $row['rank_score']],
            );
        }

        foreach ($leaders as $row) {
            RankSnapshot::updateOrCreate(
                ['subject_type' => 'leader', 'subject_id' => $row['id'], 'captured_on' => $today],
                ['rank' => $row['rank'], 'rank_score' => $row['score']],
            );
        }

        $this->info(sprintf(
            'Snapshotted %d student(s), %d leader(s) for %s.',
            count($students),
            count($leaders),
            $today,
        ));

        return self::SUCCESS;
    }
}
