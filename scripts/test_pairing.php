<?php
/**
 * Pairing Algorithm Test — greedy vs greedy+2-opt
 *
 * Run: php artisan tinker --execute="require base_path('scripts/test_pairing.php');"
 */

use App\Models\Pair;
use App\Models\PairingRequest;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

// ── 0. Clean slate ───────────────────────────────────────────────────────────
Pair::truncate();
PairingRequest::truncate();
User::where('role', 'student')->delete();

// ── 1. Create 20 students ────────────────────────────────────────────────────
$profiles = [
    // Scenario 1: Perfect match (score 12)
    ['name'=>'Ahmed Al-Rashid',    'sid'=>'TST001','level'=>'1_5',        'juz'=>5,  'times'=>['fajr','dhuhr','asr'],      'days'=>['saturday','sunday','monday']],
    ['name'=>'Omar Al-Farouq',     'sid'=>'TST002','level'=>'1_5',        'juz'=>5,  'times'=>['fajr','dhuhr','asr'],      'days'=>['saturday','sunday','monday']],
    // Scenario 2a: Full-hifz evenings (score 10)
    ['name'=>'Salim Ibn Abi Talib','sid'=>'TST003','level'=>'full_hifz',  'juz'=>27, 'times'=>['asr','isha'],              'days'=>['tuesday','wednesday','thursday']],
    ['name'=>'Faris Al-Ameen',     'sid'=>'TST004','level'=>'full_hifz',  'juz'=>28, 'times'=>['asr','isha','maghrib'],    'days'=>['tuesday','wednesday']],
    // Scenario 2b: 21-29 weekends (score 11)
    ['name'=>'Khalid Ibn Al-Walid','sid'=>'TST005','level'=>'21_29',      'juz'=>21, 'times'=>['fajr','maghrib'],          'days'=>['friday','saturday','sunday']],
    ['name'=>'Tariq Al-Masri',     'sid'=>'TST006','level'=>'21_29',      'juz'=>22, 'times'=>['fajr','maghrib'],          'days'=>['friday','saturday','sunday']],
    // Scenario 2c: Mid-level 6-10 (score 10)
    ['name'=>'Yusuf Al-Siddiq',    'sid'=>'TST007','level'=>'6_10',       'juz'=>10, 'times'=>['fajr','dhuhr'],            'days'=>['monday','tuesday','wednesday']],
    ['name'=>'Ibrahim Al-Khalil',  'sid'=>'TST008','level'=>'6_10',       'juz'=>12, 'times'=>['fajr','dhuhr'],            'days'=>['monday','tuesday','thursday']],
    // Scenario 2d: Beginners, narrow (score 8)
    ['name'=>'Hamza Al-Assad',     'sid'=>'TST009','level'=>'less_than_1','juz'=>1,  'times'=>['fajr'],                   'days'=>['friday']],
    ['name'=>'Zayd Ibn Haritha',   'sid'=>'TST010','level'=>'less_than_1','juz'=>2,  'times'=>['fajr'],                   'days'=>['friday']],
    // Scenario 3: Greedy competition — 4 students where greedy picks suboptimally
    // Greedy:   Bilal+Walid(10) + Majid+Nasir(8)  = 18
    // 2-opt:    Bilal+Majid(10) + Walid+Nasir(9)  = 19  ← should find this
    ['name'=>'Bilal Ibn Rabah',    'sid'=>'TST011','level'=>'11_20',      'juz'=>20, 'times'=>['dhuhr','asr','isha'],      'days'=>['tuesday','thursday']],
    ['name'=>'Walid Al-Makhzumi',  'sid'=>'TST012','level'=>'11_20',      'juz'=>19, 'times'=>['asr','isha'],              'days'=>['tuesday','thursday','friday']],
    ['name'=>'Majid Al-Ansari',    'sid'=>'TST013','level'=>'11_20',      'juz'=>20, 'times'=>['dhuhr','asr'],             'days'=>['tuesday','wednesday','thursday']],
    ['name'=>'Nasir Al-Deen',      'sid'=>'TST014','level'=>'21_29',      'juz'=>21, 'times'=>['asr','isha'],              'days'=>['tuesday','thursday','saturday']],
    // Scenario 4: Flagged pair — share window but 3-level & 12-juz gap (score 4)
    ['name'=>'Rami Al-Hamdani',    'sid'=>'TST015','level'=>'less_than_1','juz'=>3,  'times'=>['dhuhr','asr'],             'days'=>['monday','wednesday','friday']],
    ['name'=>'Nour Al-Huda',       'sid'=>'TST016','level'=>'11_20',      'juz'=>15, 'times'=>['dhuhr','asr'],             'days'=>['monday','wednesday']],
    // Scenario 5: Mutual request — score 0, no overlap at all (honored anyway)
    ['name'=>'Saad Ibn Muadh',     'sid'=>'TST017','level'=>'less_than_1','juz'=>1,  'times'=>['isha'],                   'days'=>['monday']],
    ['name'=>'Umar Al-Hattab',     'sid'=>'TST018','level'=>'full_hifz',  'juz'=>29, 'times'=>['fajr'],                   'days'=>['friday']],
    // Scenario 6: One-sided request Adnan→Jaber (score 10, honored in Pass 2)
    ['name'=>'Adnan Al-Halabi',    'sid'=>'TST019','level'=>'6_10',       'juz'=>8,  'times'=>['fajr','asr'],              'days'=>['saturday','tuesday']],
    ['name'=>'Jaber Al-Khazraji',  'sid'=>'TST020','level'=>'6_10',       'juz'=>9,  'times'=>['fajr','asr','isha'],       'days'=>['saturday','tuesday','wednesday']],
];

$created = [];
foreach ($profiles as $p) {
    $user = User::create([
        'name'            => $p['name'],
        'student_id'      => $p['sid'],
        'password'        => Hash::make('Test@1234'),
        'role'            => 'student',
        'is_active'       => true,
        'profile_completed'=> true,
        'memo_level'      => $p['level'],
        'current_juz'     => $p['juz'],
        'available_times' => $p['times'],
        'available_days'  => $p['days'],
    ]);
    $created[$p['sid']] = $user;
}

PairingRequest::updateOrCreate(['student_id' => $created['TST017']->id], ['requested_partner_id' => $created['TST018']->id]);
PairingRequest::updateOrCreate(['student_id' => $created['TST018']->id], ['requested_partner_id' => $created['TST017']->id]);
PairingRequest::updateOrCreate(['student_id' => $created['TST019']->id], ['requested_partner_id' => $created['TST020']->id]);

// ── 2. Shared scoring setup ──────────────────────────────────────────────────
$memoOrder  = ['less_than_1'=>0,'1_5'=>1,'6_10'=>2,'11_20'=>3,'21_29'=>4,'full_hifz'=>5];
$allStudents = User::where('role','student')->where('is_active',true)->get()->keyBy('id');
$requests    = PairingRequest::all();
$requestMap  = $requests->pluck('requested_partner_id','student_id');

$scoreCache = [];
$scoreOf = function(int $aId, int $bId) use ($allStudents, $memoOrder, &$scoreCache): int {
    $key = $aId < $bId ? "{$aId}-{$bId}" : "{$bId}-{$aId}";
    if (isset($scoreCache[$key])) return $scoreCache[$key];
    $a = $allStudents[$aId]; $b = $allStudents[$bId];
    $times     = count(array_intersect($a->available_times ?? [], $b->available_times ?? []));
    $days      = count(array_intersect($a->available_days  ?? [], $b->available_days  ?? []));
    $levelDiff = abs(($memoOrder[$a->memo_level ?? ''] ?? 0) - ($memoOrder[$b->memo_level ?? ''] ?? 0));
    $juzDiff   = abs(($a->current_juz ?? 1) - ($b->current_juz ?? 1));
    return $scoreCache[$key] = $times + $days + max(0, 3 - $levelDiff) + max(0, 3 - intdiv($juzDiff, 4));
};

const MIN_SCORE  = 1;
const FLAG_SCORE = 4;

// ── 3. Run both algorithms on the same student pool ──────────────────────────
$runPairing = function(bool $with2opt) use ($allStudents, $requestMap, $scoreOf): array {
    $paired = [];
    $result = []; // ['a','b','score','how']

    $studentsByHalqa = $allStudents->groupBy(fn ($s) => $s->halqa_id ?? '__none__');

    foreach ($studentsByHalqa as $halqaKey => $halqaStudents) {
        $halqaId  = $halqaKey === '__none__' ? null : (int) $halqaKey;
        $groupIds = $halqaStudents->keyBy('id');

        $groupRequestMap = $requestMap->filter(
            fn ($pid, $sid) => $groupIds->has($sid) && $groupIds->has($pid)
        );

        // Pass 1: mutual
        foreach ($groupRequestMap as $sid => $pid) {
            if (isset($paired[$sid]) || isset($paired[$pid])) continue;
            if ((int)($requestMap[$pid] ?? 0) === (int)$sid) {
                $result[] = ['a'=>$sid,'b'=>$pid,'score'=>$scoreOf($sid,$pid),'how'=>'mutual'];
                $paired[$sid] = $paired[$pid] = true;
            }
        }

        // Pass 2: one-sided
        foreach ($groupRequestMap as $sid => $pid) {
            if (isset($paired[$sid]) || isset($paired[$pid])) continue;
            if (!$requestMap->has($pid)) {
                $result[] = ['a'=>$sid,'b'=>$pid,'score'=>$scoreOf($sid,$pid),'how'=>'one-sided'];
                $paired[$sid] = $paired[$pid] = true;
            }
        }

        // Pass 3: greedy
        $remaining = $groupIds->keys()->reject(fn ($id) => isset($paired[$id]))->values()->toArray();
        $viable    = array_values(array_filter($remaining, function ($id) use ($remaining, $scoreOf) {
            foreach ($remaining as $oid) { if ($oid !== $id && $scoreOf($id,$oid) >= MIN_SCORE) return true; }
            return false;
        }));
        if (count($viable) % 2 !== 0) array_pop($viable); // drop the odd one out (simplified)

        $candidates = [];
        for ($i = 0; $i < count($viable); $i++)
            for ($j = $i+1; $j < count($viable); $j++) {
                $s = $scoreOf($viable[$i], $viable[$j]);
                if ($s >= MIN_SCORE) $candidates[] = [$viable[$i],$viable[$j],$s];
            }
        usort($candidates, fn ($x,$y) => $y[2] <=> $x[2]);

        $used = []; $greedyPairs = [];
        foreach ($candidates as [$a,$b,$s]) {
            if (in_array($a,$used) || in_array($b,$used)) continue;
            $greedyPairs[] = [$a,$b,$halqaId,$s];
            $used[] = $a; $used[] = $b;
        }

        if ($with2opt) {
            $improved = true;
            while ($improved) {
                $improved = false;
                $n = count($greedyPairs);
                for ($i = 0; $i < $n-1; $i++) {
                    for ($j = $i+1; $j < $n; $j++) {
                        [$aId,$bId,,$sAB] = $greedyPairs[$i];
                        [$cId,$dId,,$sCD] = $greedyPairs[$j];
                        $cur = $sAB + $sCD;

                        $sAC = $scoreOf($aId,$cId); $sBD = $scoreOf($bId,$dId);
                        if ($sAC+$sBD > $cur && $sAC >= MIN_SCORE && $sBD >= MIN_SCORE) {
                            $greedyPairs[$i] = [min($aId,$cId),max($aId,$cId),$halqaId,$sAC];
                            $greedyPairs[$j] = [min($bId,$dId),max($bId,$dId),$halqaId,$sBD];
                            $improved = true; continue 2;
                        }
                        $sAD = $scoreOf($aId,$dId); $sBC = $scoreOf($bId,$cId);
                        if ($sAD+$sBC > $cur && $sAD >= MIN_SCORE && $sBC >= MIN_SCORE) {
                            $greedyPairs[$i] = [min($aId,$dId),max($aId,$dId),$halqaId,$sAD];
                            $greedyPairs[$j] = [min($bId,$cId),max($bId,$cId),$halqaId,$sBC];
                            $improved = true; continue 2;
                        }
                    }
                }
            }
        }

        foreach ($greedyPairs as [$a,$b,,$s]) {
            $result[] = ['a'=>$a,'b'=>$b,'score'=>$s,'how'=>'greedy'.($with2opt?' +2opt':'')];
        }
    }
    return $result;
};

$greedy  = $runPairing(false);
$opt     = $runPairing(true);

// ── 4. Print comparison ──────────────────────────────────────────────────────
$name = fn($id) => $allStudents[$id]->name;

$printTable = function(array $pairs, string $title) use ($name) {
    echo "\n$title\n" . str_repeat('─', 72) . "\n";
    echo sprintf("  %-26s  %-26s  %5s  %s\n", 'Student A', 'Student B', 'Score', 'How');
    echo str_repeat('─', 72) . "\n";
    $total = 0;
    foreach ($pairs as $p) {
        $flag   = $p['score'] <= FLAG_SCORE ? ' ⚑' : '';
        $total += $p['score'];
        echo sprintf("  %-26s  %-26s  %5d%s  %s\n",
            $name($p['a']), $name($p['b']), $p['score'], $flag, $p['how']);
    }
    echo str_repeat('─', 72) . "\n";
    echo sprintf("  Total score: %d across %d pairs\n", $total, count($pairs));
};

$printTable($greedy, '▶ GREEDY only');
$printTable($opt,    '▶ GREEDY + 2-opt');

// ── 5. Highlight what changed ────────────────────────────────────────────────
echo "\n▶ CHANGES made by 2-opt\n" . str_repeat('─', 72) . "\n";
$greedyMap = [];
foreach ($greedy as $p) { $greedyMap[min($p['a'],$p['b']).'-'.max($p['a'],$p['b'])] = $p['score']; }
$changed = false;
foreach ($opt as $p) {
    $key = min($p['a'],$p['b']).'-'.max($p['a'],$p['b']);
    if (!isset($greedyMap[$key])) {
        echo sprintf("  NEW  %-26s + %-26s  score %d\n", $name($p['a']), $name($p['b']), $p['score']);
        $changed = true;
    }
}
foreach ($greedy as $p) {
    $key = min($p['a'],$p['b']).'-'.max($p['a'],$p['b']);
    $inOpt = false;
    foreach ($opt as $q) { if (min($q['a'],$q['b']).'-'.max($q['a'],$q['b']) === $key) { $inOpt = true; break; } }
    if (!$inOpt) {
        echo sprintf("  DROP %-26s + %-26s  score %d\n", $name($p['a']), $name($p['b']), $p['score']);
        $changed = true;
    }
}
$greedyTotal = array_sum(array_column($greedy, 'score'));
$optTotal    = array_sum(array_column($opt,    'score'));
if (!$changed) echo "  None — greedy was already optimal.\n";
echo str_repeat('─', 72) . "\n";
echo sprintf("  Score improvement: %d → %d  (+%d)\n", $greedyTotal, $optTotal, $optTotal - $greedyTotal);
echo str_repeat('─', 72) . "\n";
