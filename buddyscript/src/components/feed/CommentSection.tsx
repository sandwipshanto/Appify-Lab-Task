'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import LikeButton from './LikeButton';
import LikesList from './LikesList';
import TimeAgo from '../ui/TimeAgo';
import ConfirmModal from '../ui/ConfirmModal';
import toast from 'react-hot-toast';
import { useAutoResizeTextArea } from '@/hooks/useAutoResizeTextArea';

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

interface CurrentUser {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
}

interface CommentSectionProps {
  postId: string;
  currentUser: CurrentUser;
}

const MAX_COMMENT_LENGTH = 2000;
const COUNTER_THRESHOLD = 0.8;

/* ── Character counter component ── */
function CharCounter({ current, max }: { current: number; max: number }) {
  const ratio = current / max;
  if (ratio < COUNTER_THRESHOLD) return null;
  return (
    <span style={{
      fontSize: '11px', fontWeight: 500,
      color: ratio >= 0.95 ? '#ff4d4f' : '#999',
      transition: 'color 0.2s',
    }}>
      {current} / {max}
    </span>
  );
}

/* ── Ctrl+Enter submit handler ── */
function handleKeyboardSubmit(
  e: React.KeyboardEvent<HTMLTextAreaElement>,
  onSubmit: () => void
) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    onSubmit();
  }
}

export default function CommentSection({ postId, currentUser }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  useAutoResizeTextArea(commentInputRef, newComment);

  // Auto-focus comment input when section mounts
  useEffect(() => {
    // Small delay to let the DOM settle after expand animation
    const timer = setTimeout(() => {
      commentInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

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

  function markCommentDeleted(commentId: string) {
    setComments((prev) => prev.map((c) => {
      if (c.id === commentId) return { ...c, content: null, deleted: true };
      if (c.replies) {
        return { ...c, replies: c.replies.map((r) => r.id === commentId ? { ...r, content: null, deleted: true } : r) };
      }
      return c;
    }));
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: window.location.origin },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [{ ...data.comment, liked: false, deleted: false, replies: [], hasMoreReplies: false }, ...prev]);
        setNewComment('');
        toast.success("Comment posted");
      } else {
        toast.error("Failed to post comment");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="_b_radious6 _padd_b24 _padd_r24 _padd_l24 _mar_b16" style={{ background: 'var(--bg2, #fff)' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', marginBottom: '16px', paddingTop: '16px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <textarea
            ref={commentInputRef}
            className="form-control"
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => handleKeyboardSubmit(e, () => handleSubmit())}
            maxLength={MAX_COMMENT_LENGTH}
            rows={1}
            style={{ resize: 'none', overflow: 'hidden' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
            <span style={{ fontSize: '11px', color: '#bbb' }}>Ctrl+Enter to send</span>
            <CharCounter current={newComment.length} max={MAX_COMMENT_LENGTH} />
          </div>
        </div>
        <button type="submit" className="_btn1" disabled={submitting || !newComment.trim()} style={{ padding: '6px 16px', whiteSpace: 'nowrap', alignSelf: 'flex-start' }}>
          {submitting ? '...' : 'Send'}
        </button>
      </form>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#999' }}>Loading comments...</p>
      ) : comments.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#999', fontSize: '13px' }}>No comments yet</p>
      ) : (
        comments.map((comment) => (
          <CommentCard key={comment.id} comment={comment} postId={postId} currentUser={currentUser} onDelete={markCommentDeleted} />
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

function CommentCard({ comment, postId, currentUser, onDelete }: { comment: Comment; postId: string; currentUser: CurrentUser; onDelete: (id: string) => void }) {
  const [showReplies, setShowReplies] = useState(!!comment.replies?.length);
  const [replies, setReplies] = useState<Comment[]>(comment.replies || []);
  const [hasMoreReplies, setHasMoreReplies] = useState(comment.hasMoreReplies || false);
  const [replyCursor, setReplyCursor] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [showLikes, setShowLikes] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(comment.deleted);
  const [showConfirm, setShowConfirm] = useState(false);
  const [likesPatch, setLikesPatch] = useState<{ action: 'add' | 'remove'; user: CurrentUser } | null>(null);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);

  useAutoResizeTextArea(replyInputRef, replyText);

  const isOwner = comment.authorId === currentUser.id;

  async function loadMoreReplies() {
    const params = replyCursor ? `?cursor=${replyCursor}` : '';
    const res = await fetch(`/api/comments/${comment.id}/replies${params}`);
    if (!res.ok) return;
    const data = await res.json();
    setReplies((prev) => [...prev, ...data.replies]);
    setReplyCursor(data.nextCursor);
    setHasMoreReplies(!!data.nextCursor);
  }

  async function handleReplySubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!replyText.trim() || submittingReply) return;
    setSubmittingReply(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: window.location.origin },
        body: JSON.stringify({ content: replyText.trim(), parentId: comment.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setReplies((prev) => [...prev, { ...data.comment, liked: false, deleted: false }]);
        setReplyText('');
        setShowReplies(true);
        toast.success("Reply posted");
      } else {
        toast.error("Failed to post reply");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSubmittingReply(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/comments/${comment.id}`, { method: 'DELETE', headers: { Origin: window.location.origin } });
      if (res.ok) {
        setDeleted(true);
        onDelete(comment.id);
        toast.success("Comment deleted");
      } else {
        toast.error("Failed to delete comment");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  }

  function handleReplyDelete(replyId: string) {
    setReplies((prev) => prev.map((r) => r.id === replyId ? { ...r, content: null, deleted: true } : r));
    onDelete(replyId);
  }

  // Auto-focus reply input when replies section opens
  useEffect(() => {
    if (showReplies && replyInputRef.current) {
      const timer = setTimeout(() => replyInputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [showReplies]);

  return (
    <div style={{ marginBottom: '12px', paddingLeft: '0' }}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <img
          src={comment.author.avatar || '/assets/images/default_avatar.png'}
          alt={`${comment.author.firstName}`}
          style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', marginTop: '2px' }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ background: '#f5f5f5', borderRadius: '12px', padding: '8px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '13px' }}>{comment.author.firstName} {comment.author.lastName}</strong>
              <span style={{ fontSize: '11px', color: '#999' }}><TimeAgo timestamp={comment.createdAt} /></span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: deleted ? '#999' : '#333' }}>
              {deleted ? <em>This comment has been deleted</em> : comment.content}
            </p>
          </div>
          {!deleted && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '4px', fontSize: '12px', color: '#999' }}>
              <LikeButton
                targetType="comment"
                targetId={comment.id}
                liked={comment.liked}
                likeCount={comment.likeCount}
                onLikeCountClick={() => setShowLikes(true)}
                onToggle={(nowLiked) =>
                  setLikesPatch({
                    action: nowLiked ? 'add' : 'remove',
                    user: currentUser,
                  })
                }
              />
              <button type="button" onClick={() => setShowReplies(!showReplies)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', fontSize: '12px' }}>
                Reply
              </button>
              {isOwner && (
                <button type="button" onClick={() => setShowConfirm(true)} disabled={deleting} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff4d4f', fontSize: '12px' }}>
                  {deleting ? '...' : 'Delete'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showReplies && (
        <div style={{ marginLeft: '42px', marginTop: '8px' }}>
          {replies.map((reply) => (
            <ReplyCard key={reply.id} reply={reply} currentUser={currentUser} onDelete={handleReplyDelete} />
          ))}
          {hasMoreReplies && (
            <button onClick={loadMoreReplies} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#377DFF', fontSize: '12px', padding: '4px 0' }}>
              Load more replies
            </button>
          )}
          <form onSubmit={handleReplySubmit} style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
            <div style={{ flex: 1 }}>
              <textarea
                ref={replyInputRef}
                className="form-control"
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => handleKeyboardSubmit(e, () => handleReplySubmit())}
                maxLength={MAX_COMMENT_LENGTH}
                rows={1}
                style={{ fontSize: '13px', padding: '4px 8px', resize: 'none', overflow: 'hidden' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                <span style={{ fontSize: '10px', color: '#bbb' }}>Ctrl+Enter</span>
                <CharCounter current={replyText.length} max={MAX_COMMENT_LENGTH} />
              </div>
            </div>
            <button type="submit" className="_btn1" disabled={submittingReply || !replyText.trim()} style={{ padding: '4px 12px', fontSize: '12px', whiteSpace: 'nowrap', alignSelf: 'flex-start' }}>
              Reply
            </button>
          </form>
        </div>
      )}

      {showLikes && (
        <LikesList targetType="comment" targetId={comment.id} onClose={() => setShowLikes(false)} optimisticPatch={likesPatch} />
      )}

      {/* Styled confirm dialog for comment deletion */}
      {showConfirm && (
        <ConfirmModal
          title="Delete Comment"
          message="Are you sure you want to delete this comment?"
          confirmLabel="Delete"
          danger
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}

function ReplyCard({ reply, currentUser, onDelete }: { reply: Comment; currentUser: CurrentUser; onDelete: (id: string) => void }) {
  const [showLikes, setShowLikes] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(reply.deleted);
  const [showConfirm, setShowConfirm] = useState(false);
  const [likesPatch, setLikesPatch] = useState<{ action: 'add' | 'remove'; user: CurrentUser } | null>(null);
  const isOwner = reply.authorId === currentUser.id;

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/comments/${reply.id}`, { method: 'DELETE', headers: { Origin: window.location.origin } });
      if (res.ok) {
        setDeleted(true);
        onDelete(reply.id);
        toast.success("Reply deleted");
      } else {
        toast.error("Failed to delete reply");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  }

  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
        <img
          src={reply.author.avatar || '/assets/images/default_avatar.png'}
          alt={`${reply.author.firstName}`}
          style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', marginTop: '2px' }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ background: '#f0f0f0', borderRadius: '10px', padding: '6px 10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '12px' }}>{reply.author.firstName} {reply.author.lastName}</strong>
              <span style={{ fontSize: '10px', color: '#999' }}><TimeAgo timestamp={reply.createdAt} /></span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: deleted ? '#999' : '#333' }}>
              {deleted ? <em>This reply has been deleted</em> : reply.content}
            </p>
          </div>
          {!deleted && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '2px', fontSize: '11px' }}>
              <LikeButton
                targetType="comment"
                targetId={reply.id}
                liked={reply.liked}
                likeCount={reply.likeCount}
                onLikeCountClick={() => setShowLikes(true)}
                onToggle={(nowLiked) =>
                  setLikesPatch({
                    action: nowLiked ? 'add' : 'remove',
                    user: currentUser,
                  })
                }
              />
              {isOwner && (
                <button type="button" onClick={() => setShowConfirm(true)} disabled={deleting} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff4d4f', fontSize: '11px' }}>
                  {deleting ? '...' : 'Delete'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {showLikes && (
        <LikesList targetType="comment" targetId={reply.id} onClose={() => setShowLikes(false)} optimisticPatch={likesPatch} />
      )}
      {/* Styled confirm dialog for reply deletion */}
      {showConfirm && (
        <ConfirmModal
          title="Delete Reply"
          message="Are you sure you want to delete this reply?"
          confirmLabel="Delete"
          danger
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}
