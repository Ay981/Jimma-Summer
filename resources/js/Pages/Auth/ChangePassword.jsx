import { Head, useForm } from '@inertiajs/react';

export default function ChangePassword() {
    const { data, setData, post, processing, errors } = useForm({
        password: '',
        password_confirmation: '',
    });

    function handleSubmit(e) {
        e.preventDefault();
        post('/change-password');
    }

    return (
        <>
            <Head title="Set New Password" />

            <div
                style={{
                    minHeight: '100vh',
                    background: 'var(--background)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.5rem',
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
                        maxWidth: '400px',
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
                            marginBottom: '0.5rem',
                        }}
                    >
                        Set Your Password
                    </h1>
                    <p
                        style={{
                            color: 'var(--muted-foreground)',
                            fontSize: '0.875rem',
                            textAlign: 'center',
                            marginBottom: '1.75rem',
                        }}
                    >
                        You must set a personal password before continuing.
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label
                                htmlFor="password"
                                style={{
                                    display: 'block',
                                    color: 'var(--foreground)',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    marginBottom: '0.375rem',
                                }}
                            >
                                New Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={data.password}
                                onChange={e => setData('password', e.target.value)}
                                placeholder="At least 8 characters"
                                autoFocus
                                style={{
                                    width: '100%',
                                    padding: '0.625rem 0.75rem',
                                    background: 'var(--background)',
                                    border: `1px solid ${errors.password ? 'var(--destructive)' : 'var(--border)'}`,
                                    borderRadius: 'var(--radius-md)',
                                    color: 'var(--foreground)',
                                    fontSize: '0.9375rem',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                }}
                            />
                            {errors.password && (
                                <p style={{ color: 'var(--destructive)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label
                                htmlFor="password_confirmation"
                                style={{
                                    display: 'block',
                                    color: 'var(--foreground)',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    marginBottom: '0.375rem',
                                }}
                            >
                                Confirm Password
                            </label>
                            <input
                                id="password_confirmation"
                                type="password"
                                value={data.password_confirmation}
                                onChange={e => setData('password_confirmation', e.target.value)}
                                placeholder="Re-enter your password"
                                style={{
                                    width: '100%',
                                    padding: '0.625rem 0.75rem',
                                    background: 'var(--background)',
                                    border: `1px solid ${errors.password_confirmation ? 'var(--destructive)' : 'var(--border)'}`,
                                    borderRadius: 'var(--radius-md)',
                                    color: 'var(--foreground)',
                                    fontSize: '0.9375rem',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                }}
                            />
                            {errors.password_confirmation && (
                                <p style={{ color: 'var(--destructive)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                                    {errors.password_confirmation}
                                </p>
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
                            {processing ? 'Saving…' : 'Save Password'}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
