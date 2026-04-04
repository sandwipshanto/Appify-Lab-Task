'use client';

import { useState } from 'react';

interface LikeButtonProps {
  targetType: 'post' | 'comment';
  targetId: string;
  liked: boolean;
  likeCount: number;
  onLikeCountClick?: () => void;
}

export default function LikeButton({ targetType, targetId, liked: initialLiked, likeCount: initialCount, onLikeCountClick }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  async function handleToggle() {
    if (pending) return;

    // Optimistic update
    const wasLiked = liked;
    setLiked(!wasLiked);
    setCount((c) => (wasLiked ? c - 1 : c + 1));
    setPending(true);

    try {
      const url = targetType === 'post'
        ? `/api/posts/${targetId}/like`
        : `/api/comments/${targetId}/like`;

      const res = await fetch(url, {
        method: wasLiked ? 'DELETE' : 'POST',
        headers: { Origin: window.location.origin },
      });

      if (!res.ok) {
        // Revert optimistic update
        setLiked(wasLiked);
        setCount((c) => (wasLiked ? c + 1 : c - 1));
      } else {
        const data = await res.json();
        // Use server-returned count for accuracy
        if (typeof data.likeCount === 'number') {
          setCount(data.likeCount);
        }
      }
    } catch {
      // Revert on network error
      setLiked(wasLiked);
      setCount((c) => (wasLiked ? c + 1 : c - 1));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="_feed_inner_timeline_total_reacts _padd_r24 _padd_l24 _mar_b26" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <button
        className={`_feed_inner_timeline_reaction_emoji _feed_reaction${liked ? ' _feed_reaction_active' : ''}`}
        onClick={handleToggle}
        type="button"
        style={{ cursor: pending ? 'default' : 'pointer' }}
      >
        <span className="_feed_inner_timeline_reaction_link">
          <span>
            {liked ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="19" height="17" fill="none" viewBox="0 0 19 17">
                <path fill="#377DFF" d="M9.5 17l-1.43-1.3C3.2 11.36 0 8.48 0 4.95 0 2.07 2.28 0 5.23 0c1.66 0 3.25.77 4.27 1.99A5.882 5.882 0 0113.77 0C16.72 0 19 2.07 19 4.95c0 3.53-3.2 6.41-8.07 10.75L9.5 17z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="19" height="17" fill="none" viewBox="0 0 19 17">
                <path stroke="#666" strokeWidth="1.5" d="M9.5 17l-1.43-1.3C3.2 11.36 0 8.48 0 4.95 0 2.07 2.28 0 5.23 0c1.66 0 3.25.77 4.27 1.99A5.882 5.882 0 0113.77 0C16.72 0 19 2.07 19 4.95c0 3.53-3.2 6.41-8.07 10.75L9.5 17z" />
              </svg>
            )}
            {liked ? ' Liked' : ' Like'}
          </span>
        </span>
      </button>
      {count > 0 && (
        <button
          type="button"
          onClick={onLikeCountClick}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', fontSize: '13px' }}
        >
          {count} {count === 1 ? 'like' : 'likes'}
        </button>
      )}
    </div>
  );
}
