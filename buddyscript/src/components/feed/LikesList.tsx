'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface LikesListProps {
  targetType: 'post' | 'comment';
  targetId: string;
  onClose: () => void;
  /** Instantly add or remove the current user from the displayed list */
  optimisticPatch?: { action: 'add' | 'remove'; user: LikeUser } | null;
}

interface LikeUser {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
}

export default function LikesList({ targetType, targetId, onClose, optimisticPatch }: LikesListProps) {
  const [users, setUsers] = useState<LikeUser[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);

  const fetchLikes = useCallback(async (nextCursor: string | null, signal?: AbortSignal) => {
    const url = targetType === 'post'
      ? `/api/posts/${targetId}/likes`
      : `/api/comments/${targetId}/likes`;
    const params = nextCursor ? `?cursor=${nextCursor}` : '';
    const res = await fetch(`${url}${params}`, { signal });
    if (!res.ok) return;
    const data = await res.json();
    // On initial load, replace list entirely. On pagination, append.
    setUsers((prev) => nextCursor ? [...prev, ...data.users] : data.users);
    setCursor(data.nextCursor);
    setHasMore(!!data.nextCursor);
    setLoading(false);
  }, [targetType, targetId]);

  useEffect(() => {
    const controller = new AbortController();
    fetchLikes(null, controller.signal).catch((err) => {
      // Ignore AbortError from cleanup — it's expected on unmount/StrictMode double-invoke
      if (err?.name !== 'AbortError') setLoading(false);
    });
    return () => controller.abort();
  }, [fetchLikes]);

  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    // Focus the dialog on mount for accessibility
    dialogRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="People who liked this"
      ref={dialogRef}
      tabIndex={-1}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.5)', zIndex: 1050,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#fff', borderRadius: '8px', padding: '24px',
        maxWidth: '400px', width: '90%', maxHeight: '60vh', overflow: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h5 style={{ margin: 0 }}>Liked by</h5>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
        </div>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#999' }}>Loading...</p>
        ) : users.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999' }}>No likes yet</p>
        ) : (
          <>
            {(() => {
              let displayed = users;
              if (optimisticPatch) {
                if (optimisticPatch.action === 'add') {
                  // Prepend unless already present
                  if (!displayed.some((u) => u.id === optimisticPatch.user.id)) {
                    displayed = [optimisticPatch.user, ...displayed];
                  }
                } else {
                  // Remove
                  displayed = displayed.filter((u) => u.id !== optimisticPatch.user.id);
                }
              }
              return displayed.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#999' }}>No likes yet</p>
              ) : (
                displayed.map((u) => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0' }}>
                    <img
                      src={u.avatar || '/assets/images/profile.png'}
                      alt={`${u.firstName} ${u.lastName}`}
                      style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <span>{u.firstName} {u.lastName}</span>
                  </div>
                ))
              );
            })()}
            {hasMore && (
              <button
                onClick={() => fetchLikes(cursor)}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', background: '#fff', cursor: 'pointer', marginTop: '8px' }}
              >
                Load more
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
