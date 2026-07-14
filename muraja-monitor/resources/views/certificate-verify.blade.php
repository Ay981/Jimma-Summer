<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Certificate Verification</title>
    <style>
        :root {
            --ink: #17212b;
            --muted: #53606b;
            --paper: #fbfaf5;
            --gold: #9a6a16;
            --gold-soft: #d8c394;
            --line: #d9d1bf;
            --valid: #17633b;
            --invalid: #9f1d1d;
        }

        * { box-sizing: border-box; }

        body {
            margin: 0;
            min-height: 100vh;
            background:
                linear-gradient(135deg, rgba(154, 106, 22, 0.08), transparent 34%),
                #f6f4ee;
            color: var(--ink);
            font-family: Arial, Helvetica, sans-serif;
        }

        main {
            min-height: 100vh;
            display: grid;
            place-items: center;
            padding: 32px 16px;
        }

        .panel {
            width: min(680px, 100%);
            position: relative;
            background: var(--paper);
            border: 4px solid var(--gold);
            outline: 1px solid var(--ink);
            outline-offset: -10px;
            padding: clamp(28px, 6vw, 52px);
            box-shadow: 0 22px 60px rgba(23, 33, 43, 0.12);
        }

        .panel:before,
        .panel:after {
            content: "";
            position: absolute;
            pointer-events: none;
        }

        .panel:before {
            inset: 18px;
            border: 1px solid var(--gold-soft);
        }

        .panel:after {
            inset: 26px;
            border: 1px solid rgba(154, 106, 22, 0.22);
        }

        .content {
            position: relative;
            z-index: 1;
        }

        .status {
            display: inline-block;
            padding: 5px 10px;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            border: 1px solid currentColor;
            color: {{ $valid ? 'var(--valid)' : 'var(--invalid)' }};
            background: rgba(255, 255, 255, 0.48);
        }

        .eyebrow {
            margin-top: 18px;
            color: var(--gold);
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.18em;
            text-transform: uppercase;
        }

        h1 {
            margin: 8px 0 10px;
            font-size: clamp(30px, 6vw, 44px);
            line-height: 1.08;
        }

        p {
            max-width: 58ch;
            margin: 8px 0;
            line-height: 1.65;
            color: var(--muted);
        }

        dl {
            margin: 26px 0 0;
            display: grid;
            grid-template-columns: 150px 1fr;
            gap: 12px 18px;
            padding-top: 18px;
            border-top: 1px solid var(--gold-soft);
        }

        dt {
            color: #6a7480;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.09em;
        }

        dd {
            margin: 0;
            min-width: 0;
            font-weight: 700;
            overflow-wrap: anywhere;
        }

        code {
            font-family: "Courier New", monospace;
            font-size: 0.94em;
        }

        @media (max-width: 540px) {
            .panel { padding: 34px 28px; }
            dl { grid-template-columns: 1fr; gap: 4px 0; }
            dd + dt { margin-top: 10px; }
        }
    </style>
</head>
<body>
    <main>
        <section class="panel" aria-labelledby="verification-title">
            <div class="content">
                <span class="status">{{ $valid ? 'Verified' : 'Not Verified' }}</span>
                <div class="eyebrow">Jimma University Muslim Students Jema</div>
                <h1 id="verification-title">Certificate Verification</h1>

                @if ($valid)
                    <p>This certificate number matches a completion certificate issued for the official Muraja'a program record.</p>
                    <dl>
                        <dt>Certificate No.</dt><dd><code>{{ $code }}</code></dd>
                        <dt>Recipient</dt><dd>{{ $student->name }}</dd>
                        <dt>Student ID</dt><dd>{{ $student->student_id }}</dd>
                        <dt>Program</dt><dd>{{ $program_name }}</dd>
                        <dt>Period</dt><dd>{{ $start }} - {{ $end }}</dd>
                    </dl>
                @else
                    <p>No certificate could be verified for certificate number <strong><code>{{ $code }}</code></strong>.</p>
                @endif
            </div>
        </section>
    </main>
</body>
</html>
