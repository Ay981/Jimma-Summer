<?php
/**
 * End-to-end pairing verification
 *
 * 1. Seeds 20 students with varied profiles
 * 2. Runs the PRODUCTION PairingController::run()
 * 3. Queries the pairs table to show what was saved
 * 4. Runs an optimality checker — tries every possible swap on the result
 *    and reports whether any improvement exists
 *
 * Run: php artisan tinker --execute="require base_path('scripts/verify_pairing.php');"
 */

use App\Http\Controllers\Admin\PairingController;
use App\Models\Pair;
use App\Models\PairingRequest;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

// ── 0. Clean slate ───────────────────────────────────────────────────────────
Pair::truncate();
PairingRequest::truncate();
User::where('role', 'student')->delete();

// ── 1. Seed 20 students ──────────────────────────────────────────────────────
$profiles = [
    ['name'=>'Ahmed Al-Rashid',    'sid'=>'TST001','level'=>'1_5',        'juz'=>5,  'times'=>['fajr','dhuhr','asr'],   'days'=>['saturday','sunday','monday']],
    ['name'=>'Omar Al-Farouq',     'sid'=>'TST002','level'=>'1_5',        'juz'=>5,  'times'=>['fajr','dhuhr','asr'],   'days'=>['saturday','sunday','monday']],
    ['name'=>'Salim Ibn Abi Talib','sid'=>'TST003','level'=>'full_hifz',  'juz'=>27, 'times'=>['asr','isha'],           'days'=>['tuesday','wednesday','thursday']],
    ['name'=>'Faris Al-Ameen',     'sid'=>'TST004','level'=>'full_hifz',  'juz'=>28, 'times'=>['asr','isha','maghrib'], 'days'=>['tuesday','wednesday']],
    ['name'=>'Khalid Ibn Al-Walid','sid'=>'TST005','level'=>'21_29',      'juz'=>21, 'times'=>['fajr','maghrib'],       'days'=>['friday','saturday','sunday']],
    ['name'=>'Tariq Al-Masri',     'sid'=>'TST006','level'=>'21_29',      'juz'=>22, 'times'=>['fajr','maghrib'],       'days'=>['friday','saturday','sunday']],
    ['name'=>'Yusuf Al-Siddiq',    'sid'=>'TST007','level'=>'6_10',       'juz'=>10, 'times'=>['fajr','dhuhr'],         'days'=>['monday','tuesday','wednesday']],
    ['name'=>'Ibrahim Al-Khalil',  'sid'=>'TST008','level'=>'6_10',       'juz'=>12, 'times'=>['fajr','dhuhr'],         'days'=>['monday','tuesday','thursday']],
    ['name'=>'Hamza Al-Assad',     'sid'=>'TST009','level'=>'less_than_1','juz'=>1,  'times'=>['fajr'],                 'days'=>['friday']],
    ['name'=>'Zayd Ibn Haritha',   'sid'=>'TST010','level'=>'less_than_1','juz'=>2,  'times'=>['fajr'],                 'days'=>['friday']],
    ['name'=>'Bilal Ibn Rabah',    'sid'=>'TST011','level'=>'11_20',      'juz'=>20, 'times'=>['dhuhr','asr','isha'],   'days'=>['tuesday','thursday']],
    ['name'=>'Walid Al-Makhzumi',  'sid'=>'TST012','level'=>'11_20',      'juz'=>19, 'times'=>['asr','isha'],           'days'=>['tuesday','thursday','friday']],
    ['name'=>'Majid Al-Ansari',    'sid'=>'TST013','level'=>'11_20',      'juz'=>20, 'times'=>['dhuhr','asr'],          'days'=>['tuesday','wednesday','thursday']],
    ['name'=>'Nasir Al-Deen',      'sid'=>'TST014','level'=>'21_29',      'juz'=>21, 'times'=>['asr','isha'],           'days'=>['tuesday','thursday','saturday']],
    ['name'=>'Rami Al-Hamdani',    'sid'=>'TST015','level'=>'less_than_1','juz'=>3,  'times'=>['dhuhr','asr'],          'days'=>['monday','wednesday','friday']],
    ['name'=>'Nour Al-Huda',       'sid'=>'TST016','level'=>'11_20',      'juz'=>15, 'times'=>['dhuhr','asr'],          'days'=>['monday','wednesday']],
    ['name'=>'Saad Ibn Muadh',     'sid'=>'TST017','level'=>'less_than_1','juz'=>1,  'times'=>['isha'],                 'days'=>['monday']],
    ['name'=>'Umar Al-Hattab',     'sid'=>'TST018','level'=>'full_hifz',  'juz'=>29, 'times'=>['fajr'],                 'days'=>['friday']],
    ['name'=>'Adnan Al-Halabi',    'sid'=>'TST019','level'=>'6_10',       'juz'=>8,  'times'=>['fajr','asr'],           'days'=>['saturday','tuesday']],
    ['name'=>'Jaber Al-Khazraji',  'sid'=>'TST020','level'=>'6_10',       'juz'=>9,  'times'=>['fajr','asr','isha'],    'days'=>['saturday','tuesday','wednesday']],
];

$created = [];
foreach ($profiles as $p) {
    $created[$p['sid']] = User::create([
        'name'             => $p['name'],
        'student_id'       => $p['sid'],
        'password'         => Hash::make('Test@1234'),
        'role'             => 'student',
        'is_active'        => true,
        'profile_completed'=> true,
        'memo_level'       => $p['level'],
        'current_juz'      => $p['juz'],
        'available_times'  => $p['times'],
        'available_days'   => $p['days'],
    ]);
}

PairingRequest::create(['student_id' => $created['TST017']->id, 'requested_partner_id' => $created['TST018']->id]);
PairingRequest::create(['student_id' => $created['TST018']->id, 'requested_partner_id' => $created['TST017']->id]);
PairingRequest::create(['student_id' => $created['TST019']->id, 'requested_partner_id' => $created['TST020']->id]);

echo "  20 students created, pairing requests set (Saad<->Umar mutual, Adnan->Jaber one-sided)\n\n";

// ── 2. Run the production controller ────────────────────────────────────────
echo "=== Running PairingController::run() (production code) ===\n\n";
$controller = new PairingController();
$response   = $controller->run();

// ── 3. Show what was saved to DB ─────────────────────────────────────────────
$pairs = Pair::with(['studentA','studentB'])->get();

echo str_repeat('─', 76) . "\n";
echo sprintf("  %-26s  %-26s  %5s  %8s\n", 'Student A', 'Student B', 'Score', 'Flagged?');
echo str_repeat('─', 76) . "\n";

foreach ($pairs as $pair) {
    $flag = $pair->needs_review ? '⚑ YES' : '';
    echo sprintf("  %-26s  %-26s  %5d  %s\n",
        $pair->studentA->name,
        $pair->studentB->name ?? '(solo)',
        $pair->compatibility_score,
        $flag
    );
}

$total   = $pairs->sum('compatibility_score');
$flagged = $pairs->where('needs_review', true)->count();
echo str_repeat('─', 76) . "\n";
echo sprintf("  Total score: %d across %d pairs   |   %d flagged for review\n\n",
    $total, $pairs->count(), $flagged);

// ── 4. Optimality check — try every swap on saved pairs ──────────────────────
echo "=== Optimality check (trying all partner swaps on saved result) ===\n\n";

$memoOrder = ['less_than_1'=>0,'1_5'=>1,'6_10'=>2,'11_20'=>3,'21_29'=>4,'full_hifz'=>5];
$students  = User::where('role','student')->where('is_active',true)->get()->keyBy('id');

$scoreOf = function(int $aId, int $bId) use ($students, $memoOrder): int {
    $a = $students[$aId]; $b = $students[$bId];
    $times     = count(array_intersect($a->available_times ?? [], $b->available_times ?? []));
    $days      = count(array_intersect($a->available_days  ?? [], $b->available_days  ?? []));
    $levelDiff = abs(($memoOrder[$a->memo_level ?? ''] ?? 0) - ($memoOrder[$b->memo_level ?? ''] ?? 0));
    $juzDiff   = abs(($a->current_juz ?? 1) - ($b->current_juz ?? 1));
    return $times + $days + max(0, 3 - $levelDiff) + max(0, 3 - intdiv($juzDiff, 4));
};

// Only check greedy pairs (skip request-honored ones — those are intentional)
$requestedIds = PairingRequest::pluck('student_id')->merge(PairingRequest::pluck('requested_partner_id'))->unique();
$greedyPairs  = $pairs->filter(fn ($p) =>
    !$requestedIds->contains($p->student_a_id) && !$requestedIds->contains($p->student_b_id)
)->values();

$improvements = [];
$n = count($greedyPairs);
for ($i = 0; $i < $n - 1; $i++) {
    for ($j = $i + 1; $j < $n; $j++) {
        $aId = $greedyPairs[$i]->student_a_id; $bId = $greedyPairs[$i]->student_b_id;
        $cId = $greedyPairs[$j]->student_a_id; $dId = $greedyPairs[$j]->student_b_id;
        $cur = $greedyPairs[$i]->compatibility_score + $greedyPairs[$j]->compatibility_score;

        foreach ([[$aId,$cId,$bId,$dId], [$aId,$dId,$bId,$cId]] as [$p,$q,$r,$s]) {
            $s1 = $scoreOf($p,$q); $s2 = $scoreOf($r,$s);
            if ($s1 + $s2 > $cur) {
                $improvements[] = sprintf(
                    "  Swap (%s+%s) and (%s+%s)  [%d+%d=%d]  →  (%s+%s) and (%s+%s)  [%d+%d=%d]  gain +%d",
                    $students[$aId]->name, $students[$bId]->name,
                    $students[$cId]->name, $students[$dId]->name,
                    $greedyPairs[$i]->compatibility_score, $greedyPairs[$j]->compatibility_score, $cur,
                    $students[$p]->name, $students[$q]->name,
                    $students[$r]->name, $students[$s]->name,
                    $s1, $s2, $s1+$s2, ($s1+$s2)-$cur
                );
            }
        }
    }
}

if (empty($improvements)) {
    echo "  OPTIMAL — no swap of any two greedy pairs would improve the total score.\n";
} else {
    echo "  NOT OPTIMAL — " . count($improvements) . " improvement(s) still possible:\n\n";
    foreach ($improvements as $imp) echo $imp . "\n";
}

echo "\n" . str_repeat('─', 76) . "\n";
echo "  Skipped optimality check on " . count($pairs) - count($greedyPairs) . " request-honored pair(s) — those are intentional.\n";
echo str_repeat('─', 76) . "\n";
