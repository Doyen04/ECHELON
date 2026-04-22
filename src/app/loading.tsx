import { LoadingState } from "@/components/ui/loading-state";

export default function AppLoading() {
    return <LoadingState title="Loading application workspace..." rows={4} />;
}
import { LoadingState } from "@/components/ui/state-panels";

export default function Loading() {
    return <LoadingState title="Loading application" description="Preparing the workspace." />;
}