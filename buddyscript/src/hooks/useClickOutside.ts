'use client';

import { useEffect, RefObject } from 'react';

/**
 * Fires `handler` when a click/touch occurs outside the element(s) referenced
 * by `refs`. Useful for closing dropdowns, modals, and menus.
 */
export function useClickOutside(
  refs: RefObject<HTMLElement | null> | RefObject<HTMLElement | null>[],
  handler: () => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;

    const refArray = Array.isArray(refs) ? refs : [refs];

    function onPointerDown(e: MouseEvent | TouchEvent) {
      const target = e.target as Node;
      const isOutside = refArray.every(
        (ref) => ref.current && !ref.current.contains(target)
      );
      if (isOutside) handler();
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [refs, handler, enabled]);
}
