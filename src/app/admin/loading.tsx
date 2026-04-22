import { LoadingState } from "@/components/ui/loading-state";

export default function AdminLoading() {
    return <LoadingState title="Loading admin workspace..." rows={6} />;
}
import { LoadingState } from "@/components/ui/state-panels";

export default function Loading() {
    return <LoadingState title="Loading admin workspace" description="Fetching dashboard data and route content." />;
}