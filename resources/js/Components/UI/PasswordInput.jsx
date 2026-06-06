import { useState } from 'react';
import { Eye, EyeSlash } from '@phosphor-icons/react';

export default function PasswordInput({ id, value, onChange, placeholder, hasError, autoFocus, style = {} }) {
    const [visible, setVisible] = useState(false);

    return (
        <div style={{ position: 'relative' }}>
            <input
                id={id}
                type={visible ? 'text' : 'password'}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                autoFocus={autoFocus}
                style={{
                    width: '100%',
                    padding: '0.625rem 2.5rem 0.625rem 0.75rem',
                    background: 'var(--background)',
                    border: `1px solid ${hasError ? 'var(--destructive)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--foreground)',
                    fontSize: '0.9375rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    ...style,
                }}
            />
            <button
                type="button"
                onClick={() => setVisible(v => !v)}
                style={{
                    position: 'absolute',
                    right: '0.625rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--muted-foreground)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px',
                }}
                tabIndex={-1}
                aria-label={visible ? 'Hide password' : 'Show password'}
            >
                {visible ? <EyeSlash size={18} /> : <Eye size={18} />}
            </button>
        </div>
    );
}
