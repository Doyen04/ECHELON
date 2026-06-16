import { LoadingState } from "@/components/shared/loading-state";

export default function ResultViewLoading() {
    return <LoadingState title="Fetching secure result details..." rows={5} />;
}
