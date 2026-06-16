import { LoadingState } from "@/components/shared/loading-state";

export default function AdminLoading() {
    return <LoadingState title="Loading admin workspace..." rows={6} />;
}
