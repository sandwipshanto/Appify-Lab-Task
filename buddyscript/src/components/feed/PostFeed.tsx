'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Post } from './CreatePost';
import CreatePost from './CreatePost';
import PostCard from './PostCard';
import CommentSection from './CommentSection';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { PostCardSkeletonGroup } from './PostCardSkeleton';



interface PostFeedProps {
  initialPosts: Post[];
  initialCursor: string | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
}

export default function PostFeed({ initialPosts, initialCursor, user }: PostFeedProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [hasMore, setHasMore] = useState(!!initialCursor);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [newPostIds, setNewPostIds] = useState<Set<string>>(new Set());
  const cursorRef = useRef(cursor);
  const feedTopRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  cursorRef.current = cursor;

  useEffect(() => {
    // We need to wait a tick for the ref to be mounted and the layout to be established
    const timer = setTimeout(() => {
      const scrollParent = feedTopRef.current?.closest('._layout_middle_wrap');
      if (!scrollParent) return;

      const handleScroll = () => {
        setShowScrollTop(scrollParent.scrollTop > 500);
      };

      scrollParent.addEventListener('scroll', handleScroll, { passive: true });
      return () => scrollParent.removeEventListener('scroll', handleScroll);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  function scrollToTop() {
    const scrollParent = feedTopRef.current?.closest('._layout_middle_wrap');
    if (scrollParent) {
      scrollParent.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  const loadMore = useCallback(async () => {
    if (!cursorRef.current) return;
    try {
      const res = await fetch(`/api/posts?cursor=${cursorRef.current}`);
      if (!res.ok) return;
      const data = await res.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped = data.posts.map((p: any) => ({
        ...p,
        liked: p.liked ?? (p.likes?.length > 0),
      }));
      setPosts((prev) => [...prev, ...mapped]);
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch {
      // Silently fail — user can scroll again
    }
  }, []);

  const { sentinelRef, isLoading } = useInfiniteScroll(loadMore, hasMore);

  function handlePostCreated(post: Post) {
    setPosts((prev) => [{ ...post, liked: false }, ...prev]);
    setNewPostIds((prev) => new Set(prev).add(post.id));

    // Scroll to top of feed so user sees their new post
    requestAnimationFrame(() => {
      const scrollParent = feedTopRef.current?.closest('._layout_middle_wrap');
      if (scrollParent) {
        scrollParent.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    // Clear the "new" flag after animation plays
    setTimeout(() => {
      setNewPostIds((prev) => {
        const next = new Set(prev);
        next.delete(post.id);
        return next;
      });
    }, 500);
  }

  function handleDelete(postId: string) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  function toggleComments(postId: string) {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  }

  return (
    <>
      <div ref={feedTopRef} />
      <CreatePost userAvatar={user.avatar} onPostCreated={handlePostCreated} />

      {posts.length === 0 ? (
        <div className="_feed_inner_area _b_radious6 _padd_t24 _padd_b24 _padd_r24 _padd_l24" style={{ textAlign: 'center' }}>
          <div style={{ padding: '24px 0' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" viewBox="0 0 24 24" style={{ opacity: 0.3, marginBottom: '12px' }}>
              <path stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            <p style={{ color: '#999', fontSize: '15px', margin: 0 }}>No posts yet. Create your first post!</p>
          </div>
        </div>
      ) : (
        posts.map((post) => (
          <div key={post.id}>
            <PostCard
              post={post}
              currentUser={user}
              onDelete={handleDelete}
              onToggleComments={toggleComments}
              isNew={newPostIds.has(post.id)}
            />
            {expandedComments.has(post.id) && (
              <CommentSection postId={post.id} currentUser={user} />
            )}
          </div>
        ))
      )}

      <div ref={sentinelRef} />
      {isLoading && <PostCardSkeletonGroup count={2} />}

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          style={{
            position: 'fixed',
            bottom: '40px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 20px',
            borderRadius: '24px',
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            color: '#444',
            border: '1px solid #eaeaea',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            zIndex: 100,
            fontSize: '14px',
            fontWeight: 500,
            animation: 'fadeInUp 0.3s ease-out',
          }}
          aria-label="Scroll to top"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
          Scroll to top
          <style>{`
            @keyframes fadeInUp {
              from { opacity: 0; transform: translate(-50%, 10px) scale(0.95); }
              to { opacity: 1; transform: translate(-50%, 0) scale(1); }
            }
          `}</style>
        </button>
      )}
    </>
  );
}
