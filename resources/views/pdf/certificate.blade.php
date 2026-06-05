<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: DejaVu Sans, Arial, sans-serif; background: #fff; width: 297mm; height: 210mm; }

.border-outer { border: 8px solid #1a3a2a; width: 100%; height: 100%; position: relative; }
.border-inner  { border: 2px solid #2d6a4f; position: absolute; inset: 10px; }

.geo-top {
    background: #1a3a2a; height: 20px; width: 100%;
    background-image: repeating-linear-gradient(45deg, transparent, transparent 7px, rgba(255,255,255,0.1) 7px, rgba(255,255,255,0.1) 14px);
}
.geo-bottom {
    background: #1a3a2a; height: 20px; width: 100%; position: absolute; bottom: 0;
    background-image: repeating-linear-gradient(45deg, transparent, transparent 7px, rgba(255,255,255,0.1) 7px, rgba(255,255,255,0.1) 14px);
}

.content { padding: 24px 48px; text-align: center; position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }

.org { font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #2d6a4f; font-weight: bold; margin-bottom: 6px; }
.cert-title { font-size: 28px; font-weight: bold; color: #1a3a2a; margin-bottom: 4px; letter-spacing: 0.04em; }
.cert-sub    { font-size: 11px; color: #4b5563; margin-bottom: 22px; }
.presents    { font-size: 10px; color: #6b7280; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 6px; }
.student-name { font-size: 34px; font-weight: bold; color: #1a1a1a; border-bottom: 2px solid #2d6a4f; padding-bottom: 6px; margin: 0 auto 16px; display: inline-block; }

.program-name { font-size: 13px; color: #1a3a2a; font-weight: bold; margin-bottom: 18px; }

.stats { display: flex; gap: 40px; justify-content: center; margin-bottom: 24px; }
.stat-box { text-align: center; }
.stat-val { font-size: 22px; font-weight: bold; color: #1a3a2a; }
.stat-lbl { font-size: 9px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em; }

.logos { display: flex; align-items: center; justify-content: space-between; width: 100%; margin-top: auto; }
.footer-text { font-size: 8px; color: #9ca3af; text-align: center; flex: 1; }
.date-issued { font-size: 9px; color: #6b7280; }
</style>
</head>
<body>
<div class="border-outer">
    <div class="border-inner">
        <div class="geo-top"></div>
        <div class="content">
            <p class="org">Jimma University Muslim Students Union</p>
            <h1 class="cert-title">Certificate of Achievement</h1>
            <p class="cert-sub">Muraja'a Monitor — Summer Program 1446H</p>
            <p class="presents">This certificate is proudly presented to</p>
            <h2 class="student-name">{{ $student->name }}</h2>
            <p class="program-name">for successful completion of <strong>{{ $program_name }}</strong></p>
            <div class="stats">
                <div class="stat-box">
                    <p class="stat-val">{{ $consistency }}%</p>
                    <p class="stat-lbl">Consistency</p>
                </div>
                <div class="stat-box">
                    <p class="stat-val">{{ $pages }}</p>
                    <p class="stat-lbl">Pages Reviewed</p>
                </div>
            </div>
            <div class="logos">
                <div style="width: 80px;"></div>
                <p class="footer-text">Generated {{ $generated }} · Muraja'a Monitor · Jimma University Muslim Students Union</p>
                <p class="date-issued" style="width:80px;text-align:right;">{{ $generated }}</p>
            </div>
        </div>
        <div class="geo-bottom"></div>
    </div>
</div>
</body>
</html>
