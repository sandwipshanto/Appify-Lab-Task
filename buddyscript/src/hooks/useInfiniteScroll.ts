'use client';

import { useRef, useCallback, useEffect, useState } from 'react';

export function useInfiniteScroll(loadMore: () => Promise<void>, hasMore: boolean) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleIntersect = useCallback(
    async (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasMore && !isLoading) {
        setIsLoading(true);
        await loadMore();
        setIsLoading(false);
      }
    },
    [loadMore, hasMore, isLoading]
  );

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: '200px',
    });
    observer.observe(node);

    return () => observer.disconnect();
  }, [handleIntersect]);

  return { sentinelRef, isLoading };
}
