const STATUS = {
    on_track: { label: 'On Track', className: 'status-tag status-on-track' },
    slipping: { label: 'Slipping', className: 'status-tag status-slipping' },
    at_risk:  { label: 'At Risk',  className: 'status-tag status-at-risk' },
    inactive: { label: 'Inactive', className: 'status-tag status-inactive' },
};

export default function StatusTag({ status = 'inactive' }) {
    const s = STATUS[status] ?? STATUS.inactive;
    return (
        <span className={s.className}>
            {s.label}
        </span>
    );
}
