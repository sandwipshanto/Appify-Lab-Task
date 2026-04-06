'use client';

import { useState, useRef } from 'react';

interface LikeButtonProps {
  targetType: 'post' | 'comment';
  targetId: string;
  liked: boolean;
  likeCount: number;
  onLikeCountClick?: () => void;
  /** Called immediately after the optimistic state flip with the new liked value */
  onToggle?: (liked: boolean) => void;
}

export default function LikeButton({ targetType, targetId, liked: initialLiked, likeCount: initialCount, onLikeCountClick, onToggle }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  // Use a ref-based debounce instead of state-based locking so the button
  // is never visually frozen. A 300 ms window is enough to prevent genuine
  // double-taps without blocking the user after the optimistic update fires.
  const debounceRef = useRef(false);

  async function handleToggle() {
    if (debounceRef.current) return;
    debounceRef.current = true;
    // Release the debounce after a short window — well before the API
    // responds — so rapid-but-intentional second clicks still work.
    setTimeout(() => { debounceRef.current = false; }, 300);

    // Optimistic update — happens instantly, no visual lock needed
    const wasLiked = liked;
    onToggle?.(!wasLiked);
    setLiked(!wasLiked);
    setCount((c) => (wasLiked ? c - 1 : c + 1));

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
    }
  }

  return (
    <div className="_feed_inner_timeline_total_reacts _padd_r24 _padd_l24 _mar_b26" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <button
        className={`_feed_inner_timeline_reaction_emoji _feed_reaction${liked ? ' _feed_reaction_active' : ''}`}
        onClick={handleToggle}
        type="button"
        style={{ cursor: 'pointer' }}
      >
        <span className="_feed_inner_timeline_reaction_link">
          <span>
            {liked ? (
              <svg style={{ transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)', transform: liked ? 'scale(1.2)' : 'scale(1)' }} xmlns="http://www.w3.org/2000/svg" width="19" height="17" fill="none" viewBox="0 0 19 17">
                <path fill="#377DFF" d="M9.5 17l-1.43-1.3C3.2 11.36 0 8.48 0 4.95 0 2.07 2.28 0 5.23 0c1.66 0 3.25.77 4.27 1.99A5.882 5.882 0 0113.77 0C16.72 0 19 2.07 19 4.95c0 3.53-3.2 6.41-8.07 10.75L9.5 17z" />
              </svg>
            ) : (
              <svg style={{ transition: 'transform 0.2s ease-in-out', transform: 'scale(1)' }} xmlns="http://www.w3.org/2000/svg" width="19" height="17" fill="none" viewBox="0 0 19 17">
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
