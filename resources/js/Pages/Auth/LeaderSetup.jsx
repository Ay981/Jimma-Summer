import { Head, useForm } from '@inertiajs/react';

export default function LeaderSetup() {
    const { data, setData, post, processing, errors } = useForm({
        code: '',
        name: '',
        student_id: '',
        phone: '',
        password: '',
        password_confirmation: '',
    });

    function handleSubmit(e) {
        e.preventDefault();
        post('/leader/setup');
    }

    const fieldStyle = (hasError) => ({
        width: '100%',
        padding: '0.625rem 0.75rem',
        background: 'var(--background)',
        border: `1px solid ${hasError ? 'var(--destructive)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-md)',
        color: 'var(--foreground)',
        fontSize: '0.9375rem',
        outline: 'none',
        boxSizing: 'border-box',
    });

    const labelStyle = {
        display: 'block',
        color: 'var(--foreground)',
        fontSize: '0.875rem',
        fontWeight: 500,
        marginBottom: '0.375rem',
    };

    const errorStyle = {
        color: 'var(--destructive)',
        fontSize: '0.8125rem',
        marginTop: '0.25rem',
    };

    return (
        <>
            <Head title="Leader Account Setup" />

            <div
                style={{
                    minHeight: '100vh',
                    background: 'var(--background)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem 1.5rem',
                }}
            >
                {/* Logo */}
                <img
                    src="/images/logo.png"
                    alt="Union Logo"
                    style={{
                        width: '80px',
                        height: '80px',
                        objectFit: 'contain',
                        marginBottom: '1.5rem',
                    }}
                />

                <div
                    style={{
                        width: '100%',
                        maxWidth: '440px',
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '2rem',
                    }}
                >
                    <h1
                        style={{
                            color: 'var(--foreground)',
                            fontSize: '1.125rem',
                            fontWeight: 700,
                            textAlign: 'center',
                            marginBottom: '0.375rem',
                        }}
                    >
                        Halqa Leader Setup
                    </h1>
                    <p
                        style={{
                            color: 'var(--muted-foreground)',
                            fontSize: '0.875rem',
                            textAlign: 'center',
                            marginBottom: '1.75rem',
                        }}
                    >
                        Enter the activation code the admin gave you to create your account.
                    </p>

                    <form onSubmit={handleSubmit}>
                        {/* Activation Code */}
                        <div style={{ marginBottom: '1rem' }}>
                            <label htmlFor="code" style={labelStyle}>
                                Activation Code
                            </label>
                            <input
                                id="code"
                                type="text"
                                value={data.code}
                                onChange={e => setData('code', e.target.value.toUpperCase())}
                                placeholder="LDR-XXXX"
                                autoFocus
                                style={fieldStyle(!!errors.code)}
                            />
                            {errors.code && <p style={errorStyle}>{errors.code}</p>}
                        </div>

                        {/* Divider */}
                        <div style={{ borderTop: '1px solid var(--border)', margin: '1.25rem 0' }} />

                        {/* Full Name */}
                        <div style={{ marginBottom: '1rem' }}>
                            <label htmlFor="name" style={labelStyle}>
                                Full Name
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                placeholder="Your full name"
                                style={fieldStyle(!!errors.name)}
                            />
                            {errors.name && <p style={errorStyle}>{errors.name}</p>}
                        </div>

                        {/* Student ID */}
                        <div style={{ marginBottom: '1rem' }}>
                            <label htmlFor="student_id" style={labelStyle}>
                                Student ID
                            </label>
                            <input
                                id="student_id"
                                type="text"
                                value={data.student_id}
                                onChange={e => setData('student_id', e.target.value)}
                                placeholder="Your university ID"
                                style={fieldStyle(!!errors.student_id)}
                            />
                            {errors.student_id && <p style={errorStyle}>{errors.student_id}</p>}
                        </div>

                        {/* Phone */}
                        <div style={{ marginBottom: '1rem' }}>
                            <label htmlFor="phone" style={labelStyle}>
                                Phone{' '}
                                <span style={{ color: 'var(--muted-foreground)', fontWeight: 400 }}>(optional)</span>
                            </label>
                            <input
                                id="phone"
                                type="tel"
                                value={data.phone}
                                onChange={e => setData('phone', e.target.value)}
                                placeholder="09XXXXXXXX"
                                style={fieldStyle(!!errors.phone)}
                            />
                            {errors.phone && <p style={errorStyle}>{errors.phone}</p>}
                        </div>

                        {/* Password */}
                        <div style={{ marginBottom: '1rem' }}>
                            <label htmlFor="password" style={labelStyle}>
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={data.password}
                                onChange={e => setData('password', e.target.value)}
                                placeholder="At least 8 characters"
                                style={fieldStyle(!!errors.password)}
                            />
                            {errors.password && <p style={errorStyle}>{errors.password}</p>}
                        </div>

                        {/* Confirm Password */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label htmlFor="password_confirmation" style={labelStyle}>
                                Confirm Password
                            </label>
                            <input
                                id="password_confirmation"
                                type="password"
                                value={data.password_confirmation}
                                onChange={e => setData('password_confirmation', e.target.value)}
                                placeholder="Re-enter your password"
                                style={fieldStyle(!!errors.password_confirmation)}
                            />
                            {errors.password_confirmation && (
                                <p style={errorStyle}>{errors.password_confirmation}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            style={{
                                width: '100%',
                                padding: '0.6875rem',
                                background: 'var(--primary)',
                                color: 'var(--primary-foreground)',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.9375rem',
                                fontWeight: 600,
                                cursor: processing ? 'not-allowed' : 'pointer',
                                opacity: processing ? 0.7 : 1,
                                transition: 'opacity 0.15s',
                            }}
                        >
                            {processing ? 'Creating account…' : 'Create Account'}
                        </button>
                    </form>

                    <p
                        style={{
                            marginTop: '1.25rem',
                            textAlign: 'center',
                            fontSize: '0.8125rem',
                            color: 'var(--muted-foreground)',
                        }}
                    >
                        Already have an account?{' '}
                        <a
                            href="/login"
                            style={{ color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}
                        >
                            Sign in
                        </a>
                    </p>
                </div>
            </div>
        </>
    );
}
