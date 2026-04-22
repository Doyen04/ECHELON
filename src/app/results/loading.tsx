import { LoadingState } from "@/components/ui/loading-state";

export default function ResultsLoading() {
    return <LoadingState title="Loading result page..." rows={4} />;
}
import { LoadingState } from "@/components/ui/state-panels";

export default function Loading() {
    return <LoadingState title="Loading result view" description="Preparing the public transcript page." />;
}