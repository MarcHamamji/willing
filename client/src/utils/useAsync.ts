import { useState, useCallback, useEffect, useRef } from 'react';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export default function useAsync<T, Args extends unknown[]>(
  asyncFunction: (...args: Args) => Promise<T>,
  immediate = false,
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const hasRunImmediate = useRef(false);

  const trigger = useCallback(
    async (...args: Args): Promise<T> => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const response = await asyncFunction(...args);
        setState({ data: response, loading: false, error: null });
        return response;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setState({ data: null, loading: false, error });
        throw error;
      }
    },
    [asyncFunction],
  );

  useEffect(() => {
    if (immediate && !hasRunImmediate.current) {
      (trigger as () => Promise<T>)();
      hasRunImmediate.current = true;
    }
  }, [trigger, immediate]);

  return { ...state, trigger };
}
