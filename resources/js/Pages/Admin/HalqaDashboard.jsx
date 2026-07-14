import LeaderDashboard from '@/Pages/Leader/Dashboard';
import AdminLayout from '@/Layouts/AdminLayout';

export default function HalqaDashboard(props) {
    return (
        <LeaderDashboard
            {...props}
            layout={AdminLayout}
            readOnly
            backHref="/admin/halqas"
            pairHref={(p) => `/admin/halqas/${props.halqa.id}/members/${p.id}`}
        />
    );
}
