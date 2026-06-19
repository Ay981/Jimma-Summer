// Lightweight password strength meter. Scores 0–4 from length + character variety
// and renders four segments using the existing red/amber/green palette. Purely a
// visual hint — it does not block submission.
const LEVELS = ['', 'weak', 'fair', 'good', 'strong'];
const LABELS = {
    weak: 'Weak password',
    fair: 'Fair — add more variety',
    good: 'Good password',
    strong: 'Strong password',
};

function score(pw) {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8) s++;
    if (pw.length >= 12) s++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
    if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
    return Math.min(4, s);
}

export default function PasswordStrength({ value }) {
    if (!value) return null;
    const n = score(value);
    const level = LEVELS[n];

    return (
        <div aria-live="polite">
            <div className="pw-strength">
                {[0, 1, 2, 3].map((i) => (
                    <span key={i} className={`pw-strength-seg${i < n ? ` ${level}` : ''}`} />
                ))}
            </div>
            {level && <p className="pw-strength-label">{LABELS[level]}</p>}
        </div>
    );
}
