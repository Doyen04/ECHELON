// src/lib/api.ts
import { useState, useCallback, useEffect } from "react";

interface ApiRequestOptions {
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    body?: unknown;
    headers?: Record<string, string>;
    immediate?: boolean; // If true, fires the request immediately on mount (useful for GET)
}

export function useApi<TData = unknown>(
    endpoint: string,
    options: ApiRequestOptions = {}
) {
    const [data, setData] = useState<TData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(options.immediate ?? false);

    const execute = useCallback(
        async (overrideOptions?: ApiRequestOptions): Promise<TData> => {
            setIsLoading(true);
            setError(null);

            const method = overrideOptions?.method || options.method || "GET";
            const body = overrideOptions?.body || options.body;
            const headers = {
                "Content-Type": "application/json",
                ...(options.headers || {}),
                ...(overrideOptions?.headers || {}),
            };

            try {
                const response = await fetch(endpoint, {
                    method,
                    headers,
                    body: body ? JSON.stringify(body) : undefined,
                });

                const contentType = response.headers.get("content-type");
                const isJson = contentType && contentType.includes("application/json");

                let responseData;
                if (isJson) {
                    responseData = await response.json();
                } else {
                    responseData = await response.text();
                }

                if (!response.ok) {
                    const errorMessage =
                        responseData?.error ||
                        responseData?.message ||
                        (typeof responseData === "string" ? responseData : `HTTP error ${response.status}`);
                    throw new Error(errorMessage);
                }

                setData(responseData);
                return responseData;
            } catch (err: unknown) {
                const errorObj = err as Error;
                setError(errorObj.message || "An unexpected error occurred");
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [endpoint, options.method, options.body, options.headers]
    );

    // Auto-fetch if immediate is set to true
    useEffect(() => {
        if (options.immediate) {
            // catch attached here since errors are also stored in state
            // Wrap in setTimeout to avoid synchronous setState warning in effect
            const timer = setTimeout(() => {
                execute().catch(() => { });
            }, 0);
            return () => clearTimeout(timer);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [options.immediate]);

    return {
        data,
        error,
        isLoading,
        execute,
        mutate: setData, // helpful for optimistic updates
    };
}

/**
 * Basic fetch wrapper for non-React contexts or instances where a hook isn't suitable.
 */
export async function fetchApi<T = unknown>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
    const response = await fetch(endpoint, {
        method: options.method || 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const contentType = response.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");

    let responseData;
    if (isJson) {
        responseData = await response.json();
    } else {
        responseData = await response.text();
    }

    if (!response.ok) {
        throw new Error(
            responseData?.error ||
            responseData?.message ||
            (typeof responseData === 'string' ? responseData : `HTTP error ${response.status}`)
        );
    }

    return responseData;
}