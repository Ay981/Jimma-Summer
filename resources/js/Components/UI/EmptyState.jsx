import { Tray } from '@phosphor-icons/react';

// Consistent empty state: a soft icon chip, a short title, and optional supporting
// text — replaces the bare centered "No X yet" paragraphs scattered across pages.
// Pass any Phosphor icon component as `icon`; defaults to a tray.
export default function EmptyState({ icon: Icon = Tray, title, children, style }) {
    return (
        <div className="empty-state" style={style}>
            <span className="empty-state-icon">
                <Icon size={22} weight="duotone" />
            </span>
            {title && <p className="empty-state-title">{title}</p>}
            {children && <p className="empty-state-text">{children}</p>}
        </div>
    );
}
