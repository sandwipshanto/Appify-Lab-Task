'use client';

import { useState, useCallback } from 'react';
import type { Post } from './CreatePost';
import CreatePost from './CreatePost';
import PostCard from './PostCard';
import CommentSection from './CommentSection';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

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

  const loadMore = useCallback(async () => {
    if (!cursor) return;
    try {
      const res = await fetch(`/api/posts?cursor=${cursor}`);
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
  }, [cursor]);

  const { sentinelRef, isLoading } = useInfiniteScroll(loadMore, hasMore);

  function handlePostCreated(post: Post) {
    setPosts((prev) => [{ ...post, liked: false }, ...prev]);
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
      <CreatePost userAvatar={user.avatar} onPostCreated={handlePostCreated} />

      {posts.length === 0 ? (
        <div className="_feed_inner_area _b_radious6 _padd_t24 _padd_b24 _padd_r24 _padd_l24" style={{ textAlign: 'center' }}>
          <p style={{ color: '#999' }}>No posts yet. Create your first post!</p>
        </div>
      ) : (
        posts.map((post) => (
          <div key={post.id}>
            <PostCard
              post={post}
              currentUser={user}
              onDelete={handleDelete}
              onToggleComments={toggleComments}
            />
            {expandedComments.has(post.id) && (
              <CommentSection postId={post.id} currentUser={user} />
            )}
          </div>
        ))
      )}

      <div ref={sentinelRef} />
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '16px', color: '#999' }}>
          Loading more posts...
        </div>
      )}
    </>
  );
}
