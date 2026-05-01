import { LoadingState } from "@/components/shared/loading-state";

export default function SignInLoading() {
    return <LoadingState title="Preparing sign-in page..." rows={3} />;
}
