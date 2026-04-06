'use client';

import { useRef, useCallback, useEffect, useState } from 'react';

export function useInfiniteScroll(loadMore: () => Promise<void>, hasMore: boolean) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isLoadingRef = useRef(false);
  const hasMoreRef = useRef(hasMore);

  // Keep refs in sync with latest values
  hasMoreRef.current = hasMore;

  const handleIntersect = useCallback(
    async (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasMoreRef.current && !isLoadingRef.current) {
        isLoadingRef.current = true;
        setIsLoading(true);
        await loadMore();
        isLoadingRef.current = false;
        setIsLoading(false);
      }
    },
    [loadMore]
  );

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    // Find the nearest scrollable ancestor to use as the observer root.
    // The layout uses ._layout_middle_wrap with overflow:auto as the
    // scroll container, NOT the viewport. Without specifying root, the
    // IntersectionObserver watches the viewport which never intersects
    // with elements inside the overflow container.
    const scrollParent = findScrollParent(node);

    const observer = new IntersectionObserver(handleIntersect, {
      root: scrollParent,
      rootMargin: '200px',
    });
    observer.observe(node);

    return () => observer.disconnect();
  }, [handleIntersect]);

  return { sentinelRef, isLoading };
}

function findScrollParent(el: HTMLElement): HTMLElement | null {
  let parent = el.parentElement;
  while (parent) {
    const style = getComputedStyle(parent);
    const overflow = style.overflow + style.overflowY;
    if (/(auto|scroll)/.test(overflow)) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null; // fallback to viewport
}
