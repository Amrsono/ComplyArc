'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Generic data-fetching hook with loading/error states.
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  immediate: boolean = true
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const doFetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (immediate) {
      doFetch();
    }
  }, [doFetch, immediate]);

  return { data, loading, error, refetch: doFetch };
}

/**
 * Hook for mutations (POST, PATCH, DELETE) with loading/error.
 */
export function useMutation<TInput, TOutput>(
  mutator: (input: TInput) => Promise<TOutput>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (input: TInput): Promise<TOutput | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await mutator(input);
        return result;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [mutator]
  );

  return { execute, loading, error };
}
