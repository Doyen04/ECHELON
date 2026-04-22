import { LoadingState } from "@/components/ui/loading-state";

export default function SignInLoading() {
    return <LoadingState title="Preparing sign-in page..." rows={3} />;
}
import { LoadingState } from "@/components/ui/state-panels";

export default function Loading() {
    return <LoadingState title="Loading sign-in" description="Preparing the authentication screen." />;
}