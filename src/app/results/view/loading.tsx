import { LoadingState } from "@/components/ui/loading-state";

export default function ResultViewLoading() {
    return <LoadingState title="Fetching secure result details..." rows={5} />;
}
