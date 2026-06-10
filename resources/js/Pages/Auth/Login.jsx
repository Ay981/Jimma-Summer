import { Head, useForm } from '@inertiajs/react';
import PasswordInput from '@/Components/UI/PasswordInput';
import Logo from '@/Components/UI/Logo';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        student_id: '',
        password: '',
    });

    function handleSubmit(e) {
        e.preventDefault();
        post('/login');
    }

    return (
        <>
            <Head title="Sign In" />

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
                <Logo
                    height={210}
                    style={{ marginBottom: '1.75rem' }}
                />

                {/* Card */}
                <div
                    style={{
                        width: '100%',
                        maxWidth: '400px',
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '2rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,.08)',
                    }}
                >
                    <h1
                        style={{
                            color: 'var(--foreground)',
                            fontSize: '1.25rem',
                            fontWeight: 700,
                            textAlign: 'center',
                            marginBottom: '0.25rem',
                        }}
                    >
                        Muraja'a Monitor
                    </h1>
                    <p
                        style={{
                            color: 'var(--muted-foreground)',
                            fontSize: '0.875rem',
                            textAlign: 'center',
                            marginBottom: '1.75rem',
                        }}
                    >
                        Jimma University MSU — Summer Revision Program
                    </p>

                    <form onSubmit={handleSubmit}>
                        {/* Student ID */}
                        <div style={{ marginBottom: '1rem' }}>
                            <label
                                htmlFor="student_id"
                                style={{
                                    display: 'block',
                                    color: 'var(--foreground)',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    marginBottom: '0.375rem',
                                }}
                            >
                                Student ID
                            </label>
                            <input
                                id="student_id"
                                type="text"
                                value={data.student_id}
                                onChange={e => setData('student_id', e.target.value)}
                                placeholder="Enter your student ID"
                                autoFocus
                                style={{
                                    width: '100%',
                                    padding: '0.625rem 0.75rem',
                                    background: 'var(--background)',
                                    border: `1px solid ${errors.student_id ? 'var(--destructive)' : 'var(--border)'}`,
                                    borderRadius: 'var(--radius-md)',
                                    color: 'var(--foreground)',
                                    fontSize: '0.9375rem',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                }}
                            />
                            {errors.student_id && (
                                <p style={{ color: 'var(--destructive)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                                    {errors.student_id}
                                </p>
                            )}
                        </div>

                        {/* Password */}
                        <div style={{ marginBottom: '1.5rem' }}>
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
                                Password
                            </label>
                            <PasswordInput
                                id="password"
                                value={data.password}
                                onChange={e => setData('password', e.target.value)}
                                placeholder="Enter your password"
                                hasError={!!errors.password}
                            />
                            {errors.password && (
                                <p style={{ color: 'var(--destructive)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                                    {errors.password}
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
                            {processing ? 'Signing in…' : 'Sign In'}
                        </button>
                    </form>

                    {/* Forgot password note */}
                    <p
                        style={{
                            marginTop: '1.25rem',
                            textAlign: 'center',
                            fontSize: '0.8125rem',
                            color: 'var(--muted-foreground)',
                        }}
                    >
                        Forgot your password?{' '}
                        <span style={{ color: 'var(--foreground)', fontWeight: 500 }}>
                            Contact your halqa leader.
                        </span>
                    </p>
                </div>

            </div>
        </>
    );
}
