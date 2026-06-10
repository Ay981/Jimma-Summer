<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
    @page { margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: DejaVu Sans, Arial, sans-serif; }

    /* ── Full-perimeter decorative frame ───────────────────────────── */
    .cert {
        position: absolute; inset: 0;
        border: 7px solid #1a3a2a;
        /* geometric lattice band shows through the padding on all four sides */
        background-color: #1a3a2a;
        background-image:
            repeating-linear-gradient(45deg, rgba(201,162,39,0) 0 7px, rgba(201,162,39,0.40) 7px 8px),
            repeating-linear-gradient(-45deg, rgba(201,162,39,0) 0 7px, rgba(201,162,39,0.40) 7px 8px);
        padding: 15px;
    }
    .inner {
        position: relative;
        height: 100%; width: 100%;
        background: #fff;
        border: 2px solid #C9A227;
        outline: 4px solid #fff;        /* small white gutter between gold line and band */
    }
    /* gold corner ornaments */
    .corner { position: absolute; width: 26px; height: 26px; border: 3px solid #C9A227; }
    .corner.tl { top: 8px;  left: 8px;  border-right: none; border-bottom: none; }
    .corner.tr { top: 8px;  right: 8px; border-left: none;  border-bottom: none; }
    .corner.bl { bottom: 8px; left: 8px;  border-right: none; border-top: none; }
    .corner.br { bottom: 8px; right: 8px; border-left: none;  border-top: none; }

    .content { padding: 30px 54px 22px; text-align: center; }

    .org { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #2d6a4f; font-weight: bold; margin: 10px 0 2px; }
    .cert-title { font-size: 30px; font-weight: bold; color: #1a3a2a; letter-spacing: 0.05em; margin-bottom: 3px; }
    .cert-sub { font-size: 11px; color: #6b7280; margin-bottom: 14px; }

    /* award ribbon */
    .award { margin: 0 auto 14px; display: inline-block; background: #faf4dd; border: 1.5px solid #C9A227; border-radius: 22px; padding: 6px 18px 6px 10px; }
    .award table { border-collapse: collapse; }
    .award td { vertical-align: middle; }
    .award-text { padding-left: 8px; text-align: left; }
    .award-cat { font-size: 12px; font-weight: bold; color: #1a3a2a; }
    .award-place { font-size: 9px; color: #9a7b12; text-transform: uppercase; letter-spacing: 0.1em; font-weight: bold; }

    .presents { font-size: 10px; color: #6b7280; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 8px; }
    .student-name { font-size: 36px; font-weight: bold; color: #1a1a1a; display: inline-block; border-bottom: 2px solid #C9A227; padding: 0 24px 6px; margin-bottom: 12px; }
    .for-line { font-size: 12px; color: #374151; margin-bottom: 20px; }
    .for-line strong { color: #1a3a2a; }

    /* four stat boxes */
    .stats { width: 100%; border-collapse: separate; border-spacing: 10px 0; margin-bottom: 18px; }
    .stat-box { width: 25%; background: #f0f5f2; border: 1px solid #c6d9cf; border-top: 3px solid #2d6a4f; border-radius: 6px; padding: 12px 6px; text-align: center; }
    .stat-val { font-size: 24px; font-weight: bold; color: #1a3a2a; }
    .stat-lbl { font-size: 8.5px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.07em; margin-top: 3px; }

    /* detail line */
    .details { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    .details td { font-size: 10px; color: #374151; padding: 5px 6px; border-bottom: 1px solid #eef2f0; }
    .details .k { color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; font-size: 8px; font-weight: bold; }

    /* signature + seal */
    .sign-row { width: 100%; border-collapse: collapse; margin-top: 22px; }
    .sign-cell { width: 45%; vertical-align: bottom; text-align: center; }
    .seal-cell { width: 10%; }
    .sign-line { border-top: 1.5px solid #1a3a2a; margin: 0 10px; padding-top: 5px; font-size: 10px; color: #374151; }
    .sign-sub { font-size: 8px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.08em; }

    .seal { width: 86px; height: 86px; margin: 0 auto; border: 2px solid #C9A227; border-radius: 50%; text-align: center; }
    .seal-inner { width: 72px; height: 72px; margin: 5px auto 0; border: 1px dashed #2d6a4f; border-radius: 50%; padding-top: 16px; }
    .seal-mark { font-size: 15px; font-weight: bold; color: #1a3a2a; letter-spacing: 0.05em; }
    .seal-year { font-size: 7px; color: #2d6a4f; text-transform: uppercase; letter-spacing: 0.12em; margin-top: 2px; }

    .cert-footer { position: absolute; bottom: 14px; left: 0; right: 0; text-align: center; font-size: 8px; color: #9ca3af; }
</style>
</head>
<body>
<div class="cert">
    <div class="inner">
        <span class="corner tl"></span><span class="corner tr"></span>
        <span class="corner bl"></span><span class="corner br"></span>

        <div class="content">
            @include('pdf.partials.logo', ['w' => 76])

            <p class="org">Jimma University Muslim Students Union</p>
            <h1 class="cert-title">Certificate of Achievement</h1>
            <p class="cert-sub">{{ $program_name }} · Summer Muraja'ah 1446H</p>

            @if (!empty($award))
            <div class="award">
                <table><tr>
                    <td>@include('pdf.partials.medal', ['place' => $award['place'], 'size' => 34])</td>
                    <td class="award-text">
                        <div class="award-cat">{{ $award['title'] }}</div>
                        <div class="award-place">{{ $award['place_label'] }}</div>
                    </td>
                </tr></table>
            </div>
            @endif

            <p class="presents">This certificate is proudly presented to</p>
            <h2 class="student-name">{{ $student->name }}</h2>
            <p class="for-line">for outstanding dedication and successful participation in <strong>{{ $program_name }}</strong></p>

            <table class="stats"><tr>
                <td class="stat-box"><div class="stat-val">{{ $consistency }}%</div><div class="stat-lbl">Consistency</div></td>
                <td class="stat-box"><div class="stat-val">{{ $streak }}</div><div class="stat-lbl">Longest Streak (days)</div></td>
                <td class="stat-box"><div class="stat-val">{{ $pages }}</div><div class="stat-lbl">Pages Reviewed</div></td>
                <td class="stat-box"><div class="stat-val">{{ $juz_covered }}</div><div class="stat-lbl">Juz Covered</div></td>
            </tr></table>

            <table class="details"><tr>
                <td><div class="k">Halqa</div>{{ $halqa ?? '—' }}</td>
                <td><div class="k">Revision Partner</div>{{ $partner ?? '—' }}</td>
                <td><div class="k">Program Period</div>{{ $start }} — {{ $end }}</td>
                <td><div class="k">Badges Earned</div>{{ $badges }}</td>
            </tr></table>

            <table class="sign-row"><tr>
                <td class="sign-cell">
                    <div class="sign-line">Program Coordinator</div>
                    <div class="sign-sub">Muraja'a Monitor</div>
                </td>
                <td class="seal-cell"></td>
                <td class="sign-cell">
                    <div class="seal">
                        <div class="seal-inner">
                            <div class="seal-mark">JUMSU</div>
                            <div class="seal-year">Official · 1446H</div>
                        </div>
                    </div>
                </td>
            </tr></table>
        </div>

        <div class="cert-footer">Generated {{ $generated }} · Muraja'a Monitor · Jimma University Muslim Students Union</div>
    </div>
</div>
</body>
</html>
