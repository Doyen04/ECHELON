"use client";

import { ReactNode } from "react";
import { LoadingState } from "./loading-state";
import { ErrorState } from "./error-state";

interface ApiGateProps<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  loadingTitle?: string;
  errorMessage?: string;
  onRetry?: () => void;
  children: (data: T) => ReactNode;
}

export function ApiGate<T>({
  data,
  isLoading,
  error,
  loadingTitle,
  errorMessage,
  onRetry,
  children,
}: ApiGateProps<T>) {
  if (isLoading && !data) {
    return <LoadingState title={loadingTitle} />;
  }

  if (error || !data) {
    return (
      <ErrorState
        title={errorMessage || "Failed to load data"}
        description={error || "There was an error fetching the requested resource."}
        onRetry={onRetry}
      />
    );
  }

  return <>{children(data)}</>;
}
