'use client';

import { useState, useEffect, useCallback } from 'react';
import LikeButton from './LikeButton';
import LikesList from './LikesList';

interface Comment {
  id: string;
  content: string | null;
  likeCount: number;
  createdAt: string;
  authorId: string;
  liked: boolean;
  deleted: boolean;
  author: { id: string; firstName: string; lastName: string; avatar: string | null };
  replies?: Comment[];
  hasMoreReplies?: boolean;
}

interface CommentSectionProps {
  postId: string;
  currentUserId: string;
}

export default function CommentSection({ postId, currentUserId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async (nextCursor: string | null) => {
    const params = nextCursor ? `?cursor=${nextCursor}` : '';
    const res = await fetch(`/api/posts/${postId}/comments${params}`);
    if (!res.ok) return;
    const data = await res.json();
    setComments((prev) => nextCursor ? [...prev, ...data.comments] : data.comments);
    setCursor(data.nextCursor);
    setHasMore(!!data.nextCursor);
    setLoading(false);
  }, [postId]);

  useEffect(() => { fetchComments(null); }, [fetchComments]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [{ ...data.comment, liked: false, deleted: false, replies: [], hasMoreReplies: false }, ...prev]);
        setNewComment('');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="_b_radious6 _padd_b24 _padd_r24 _padd_l24 _mar_b16" style={{ background: 'var(--bg2, #fff)' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', marginBottom: '16px', paddingTop: '16px' }}>
        <input
          type="text"
          className="form-control"
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          maxLength={2000}
        />
        <button type="submit" className="_btn1" disabled={submitting || !newComment.trim()} style={{ padding: '6px 16px', whiteSpace: 'nowrap' }}>
          {submitting ? '...' : 'Send'}
        </button>
      </form>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#999' }}>Loading comments...</p>
      ) : comments.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#999', fontSize: '13px' }}>No comments yet</p>
      ) : (
        comments.map((comment) => (
          <CommentCard key={comment.id} comment={comment} postId={postId} currentUserId={currentUserId} />
        ))
      )}

      {hasMore && (
        <button onClick={() => fetchComments(cursor)} style={{ width: '100%', padding: '8px', border: '1px solid #eee', borderRadius: '4px', background: 'transparent', cursor: 'pointer', marginTop: '8px', color: '#666' }}>
          Load more comments
        </button>
      )}
    </div>
  );
}

function CommentCard({ comment, postId, currentUserId }: { comment: Comment; postId: string; currentUserId: string }) {
  const [showReplies, setShowReplies] = useState(!!comment.replies?.length);
  const [replies, setReplies] = useState<Comment[]>(comment.replies || []);
  const [hasMoreReplies, setHasMoreReplies] = useState(comment.hasMoreReplies || false);
  const [replyCursor, setReplyCursor] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [showLikes, setShowLikes] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwner = comment.authorId === currentUserId;

  async function loadMoreReplies() {
    const params = replyCursor ? `?cursor=${replyCursor}` : '';
    const res = await fetch(`/api/comments/${comment.id}/replies${params}`);
    if (!res.ok) return;
    const data = await res.json();
    setReplies((prev) => [...prev, ...data.replies]);
    setReplyCursor(data.nextCursor);
    setHasMoreReplies(!!data.nextCursor);
  }

  async function handleReplySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim() || submittingReply) return;
    setSubmittingReply(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyText.trim(), parentId: comment.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setReplies((prev) => [...prev, { ...data.comment, liked: false, deleted: false }]);
        setReplyText('');
        setShowReplies(true);
      }
    } finally {
      setSubmittingReply(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this comment?')) return;
    setDeleting(true);
    try {
      await fetch(`/api/comments/${comment.id}`, { method: 'DELETE' });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div style={{ marginBottom: '12px', paddingLeft: '0' }}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <img
          src={comment.author.avatar || '/assets/images/profile.png'}
          alt={`${comment.author.firstName}`}
          style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', marginTop: '2px' }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ background: '#f5f5f5', borderRadius: '12px', padding: '8px 12px' }}>
            <strong style={{ fontSize: '13px' }}>{comment.author.firstName} {comment.author.lastName}</strong>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: comment.deleted ? '#999' : '#333' }}>
              {comment.deleted ? <em>This comment has been deleted</em> : comment.content}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '4px', fontSize: '12px', color: '#999' }}>
            <LikeButton
              targetType="comment"
              targetId={comment.id}
              liked={comment.liked}
              likeCount={comment.likeCount}
              onLikeCountClick={() => setShowLikes(true)}
            />
            <button type="button" onClick={() => setShowReplies(!showReplies)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', fontSize: '12px' }}>
              Reply
            </button>
            {isOwner && !comment.deleted && (
              <button type="button" onClick={handleDelete} disabled={deleting} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff4d4f', fontSize: '12px' }}>
                {deleting ? '...' : 'Delete'}
              </button>
            )}
          </div>
        </div>
      </div>

      {showReplies && (
        <div style={{ marginLeft: '42px', marginTop: '8px' }}>
          {replies.map((reply) => (
            <ReplyCard key={reply.id} reply={reply} currentUserId={currentUserId} />
          ))}
          {hasMoreReplies && (
            <button onClick={loadMoreReplies} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#377DFF', fontSize: '12px', padding: '4px 0' }}>
              Load more replies
            </button>
          )}
          <form onSubmit={handleReplySubmit} style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Write a reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              maxLength={2000}
              style={{ fontSize: '13px', padding: '4px 8px' }}
            />
            <button type="submit" className="_btn1" disabled={submittingReply || !replyText.trim()} style={{ padding: '4px 12px', fontSize: '12px', whiteSpace: 'nowrap' }}>
              Reply
            </button>
          </form>
        </div>
      )}

      {showLikes && (
        <LikesList targetType="comment" targetId={comment.id} onClose={() => setShowLikes(false)} />
      )}
    </div>
  );
}

function ReplyCard({ reply, currentUserId }: { reply: Comment; currentUserId: string }) {
  const [showLikes, setShowLikes] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isOwner = reply.authorId === currentUserId;

  async function handleDelete() {
    if (!confirm('Delete this reply?')) return;
    setDeleting(true);
    try {
      await fetch(`/api/comments/${reply.id}`, { method: 'DELETE' });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
        <img
          src={reply.author.avatar || '/assets/images/profile.png'}
          alt={`${reply.author.firstName}`}
          style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', marginTop: '2px' }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ background: '#f0f0f0', borderRadius: '10px', padding: '6px 10px' }}>
            <strong style={{ fontSize: '12px' }}>{reply.author.firstName} {reply.author.lastName}</strong>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: reply.deleted ? '#999' : '#333' }}>
              {reply.deleted ? <em>This reply has been deleted</em> : reply.content}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '2px', fontSize: '11px' }}>
            <LikeButton
              targetType="comment"
              targetId={reply.id}
              liked={reply.liked}
              likeCount={reply.likeCount}
              onLikeCountClick={() => setShowLikes(true)}
            />
            {isOwner && !reply.deleted && (
              <button type="button" onClick={handleDelete} disabled={deleting} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff4d4f', fontSize: '11px' }}>
                {deleting ? '...' : 'Delete'}
              </button>
            )}
          </div>
        </div>
      </div>
      {showLikes && (
        <LikesList targetType="comment" targetId={reply.id} onClose={() => setShowLikes(false)} />
      )}
    </div>
  );
}
