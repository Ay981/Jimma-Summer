import LeaderPairDetail from '@/Pages/Leader/PairDetail';
import AdminLayout from '@/Layouts/AdminLayout';

export default function HalqaPairDetail(props) {
    return (
        <LeaderPairDetail
            {...props}
            layout={AdminLayout}
            readOnly
            backHref={`/admin/halqas/${props.halqa.id}/dashboard`}
        />
    );
}
