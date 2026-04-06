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

/* ── Enter to Submit, Shift+Enter for newline ── */
function handleKeyboardSubmit(
  e: React.KeyboardEvent<HTMLTextAreaElement>,
  onSubmit: () => void
) {
  if (e.key === 'Enter' && !e.shiftKey) {
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
    <div className="_feed_inner_timeline_cooment_area _b_radious6 _padd_b24 _padd_r24 _padd_l24 _mar_b16" style={{ background: 'var(--bg2, #fff)' }}>
      <div className="_feed_inner_comment_box">
        <form className="_feed_inner_comment_box_form" onSubmit={handleSubmit}>
          <div className="_feed_inner_comment_box_content">
            <div className="_feed_inner_comment_box_content_image">
              <img src={currentUser.avatar || '/assets/images/default_avatar.png'} alt="" className="_comment_img" />
            </div>
            <div className="_feed_inner_comment_box_content_txt" style={{ position: 'relative', width: '100%', flex: 1 }}>
              <textarea
                ref={commentInputRef}
                className="form-control _comment_textarea"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => handleKeyboardSubmit(e, () => handleSubmit())}
                maxLength={MAX_COMMENT_LENGTH}
                rows={1}
                style={{ resize: 'none', overflow: 'hidden', minHeight: '38px', paddingTop: '8px' }}
              />
              <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                 <CharCounter current={newComment.length} max={MAX_COMMENT_LENGTH} />
              </div>
            </div>
          </div>
          <div className="_feed_inner_comment_box_icon">
            <button type="submit" disabled={submitting || !newComment.trim()} className="_feed_inner_comment_box_icon_btn" style={{ opacity: (!newComment.trim() || submitting) ? 0.5 : 1 }}>
               {submitting ? '...' : (
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="#377DFF" d="M14.667 8L1.333 14.667V9.333L10.667 8 1.333 6.667V1.333L14.667 8z"/></svg>
               )}
            </button>
          </div>
        </form>
      </div>

      <div className="_timline_comment_main">
        {hasMore && (
          <div className="_previous_comment">
            <button type="button" onClick={() => fetchComments(cursor)} className="_previous_comment_txt">
              View previous comments
            </button>
          </div>
        )}

        {loading ? (
          <p style={{ textAlign: 'center', color: '#999', padding: '16px 0' }}>Loading comments...</p>
        ) : comments.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999', fontSize: '13px', padding: '16px 0' }}>No comments yet</p>
        ) : (
          comments.map((comment) => (
            <CommentCard key={comment.id} comment={comment} postId={postId} currentUser={currentUser} onDelete={markCommentDeleted} />
          ))
        )}
      </div>
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
    <div className="_comment_main" style={deleted ? { opacity: 0.6 } : undefined}>
      <div className="_comment_image">
        <a href="#0" className="_comment_image_link">
          <img
            src={comment.author.avatar || '/assets/images/default_avatar.png'}
            alt=""
            className="_comment_img1"
            style={{ objectFit: 'cover' }}
          />
        </a>
      </div>
      <div className="_comment_area">
        <div className="_comment_details">
          <div className="_comment_details_top">
            <div className="_comment_name">
              <a href="#0">
                <h4 className="_comment_name_title">{comment.author.firstName} {comment.author.lastName}</h4>
              </a>
            </div>
          </div>
          <div className="_comment_status">
            <p className="_comment_status_text">
              <span>{deleted ? <em>This comment has been deleted</em> : comment.content}</span>
            </p>
          </div>
          
          <div className="_total_reactions" onClick={() => setShowLikes(true)} style={comment.likeCount > 0 ? { cursor: 'pointer' } : {}}>
            {comment.likeCount > 0 && (
              <>
                <div className="_total_react">
                  <span className="_reaction_like">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-thumbs-up"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                  </span>
                  <span className="_reaction_heart">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-heart"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                  </span>
                </div>
                <span className="_total">{comment.likeCount}</span>
              </>
            )}
          </div>
          
          {!deleted && (
            <div className="_comment_reply">
              <div className="_comment_reply_num">
                <ul className="_comment_reply_list">
                  <li>
                    <LikeButton targetType="comment" targetId={comment.id} liked={comment.liked} likeCount={comment.likeCount} onToggle={(nowLiked) => setLikesPatch({ action: nowLiked ? 'add' : 'remove', user: currentUser })}>
                      {({ liked, handleToggle }) => (
                         <span onClick={handleToggle} style={{ cursor: 'pointer', fontWeight: liked ? 600 : 'normal', color: liked ? '#377DFF' : 'inherit' }}>Like.</span>
                      )}
                    </LikeButton>
                  </li>
                  <li><span onClick={() => setShowReplies(!showReplies)} style={{ cursor: 'pointer' }}>Reply.</span></li>
                  {isOwner && <li><span onClick={() => setShowConfirm(true)} style={{ cursor: 'pointer', color: '#ff4d4f' }}>{deleting ? '...' : 'Delete'}</span></li>}
                  <li><span className="_time_link"><TimeAgo timestamp={comment.createdAt} /></span></li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {showReplies && (
          <div style={{ marginTop: '16px' }}>
            {replies.map((reply) => (
              <ReplyCard key={reply.id} reply={reply} currentUser={currentUser} onDelete={handleReplyDelete} />
            ))}
            {hasMoreReplies && (
              <button onClick={loadMoreReplies} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#377DFF', fontSize: '13px', padding: '8px 0', marginLeft: '42px', marginBottom: '8px' }}>
                Load more replies...
              </button>
            )}
            
            <div className="_feed_inner_comment_box" style={{ marginTop: '8px' }}>
              <form className="_feed_inner_comment_box_form" onSubmit={handleReplySubmit}>
                <div className="_feed_inner_comment_box_content">
                  <div className="_feed_inner_comment_box_content_image">
                    <img src={currentUser.avatar || '/assets/images/default_avatar.png'} alt="" className="_comment_img" />
                  </div>
                  <div className="_feed_inner_comment_box_content_txt" style={{ position: 'relative', width: '100%', flex: 1 }}>
                    <textarea
                      ref={replyInputRef}
                      className="form-control _comment_textarea"
                      placeholder="Write a reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => handleKeyboardSubmit(e, () => handleReplySubmit())}
                      maxLength={MAX_COMMENT_LENGTH}
                      rows={1}
                      style={{ resize: 'none', overflow: 'hidden', minHeight: '38px', paddingTop: '8px' }}
                    />
                    <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                       <CharCounter current={replyText.length} max={MAX_COMMENT_LENGTH} />
                    </div>
                  </div>
                </div>
                <div className="_feed_inner_comment_box_icon">
                  <button type="submit" disabled={submittingReply || !replyText.trim()} className="_feed_inner_comment_box_icon_btn" style={{ opacity: (!replyText.trim() || submittingReply) ? 0.5 : 1 }}>
                     {submittingReply ? '...' : (
                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="#377DFF" d="M14.667 8L1.333 14.667V9.333L10.667 8 1.333 6.667V1.333L14.667 8z"/></svg>
                     )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

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
    <div className="_comment_main" style={deleted ? { opacity: 0.6 } : undefined}>
      <div className="_comment_image">
        <a href="#0" className="_comment_image_link">
          <img
            src={reply.author.avatar || '/assets/images/default_avatar.png'}
            alt=""
            className="_comment_img1"
            style={{ objectFit: 'cover' }}
          />
        </a>
      </div>
      <div className="_comment_area">
        <div className="_comment_details">
          <div className="_comment_details_top">
            <div className="_comment_name">
              <a href="#0">
                <h4 className="_comment_name_title">{reply.author.firstName} {reply.author.lastName}</h4>
              </a>
            </div>
          </div>
          <div className="_comment_status">
            <p className="_comment_status_text">
              <span>{deleted ? <em>This reply has been deleted</em> : reply.content}</span>
            </p>
          </div>
          
          <div className="_total_reactions" onClick={() => setShowLikes(true)} style={reply.likeCount > 0 ? { cursor: 'pointer' } : {}}>
            {reply.likeCount > 0 && (
              <>
                <div className="_total_react">
                  <span className="_reaction_like">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-thumbs-up"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                  </span>
                  <span className="_reaction_heart">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-heart"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                  </span>
                </div>
                <span className="_total">{reply.likeCount}</span>
              </>
            )}
          </div>
          
          {!deleted && (
            <div className="_comment_reply">
              <div className="_comment_reply_num">
                <ul className="_comment_reply_list">
                  <li>
                    <LikeButton targetType="comment" targetId={reply.id} liked={reply.liked} likeCount={reply.likeCount} onToggle={(nowLiked) => setLikesPatch({ action: nowLiked ? 'add' : 'remove', user: currentUser })}>
                      {({ liked, handleToggle }) => (
                         <span onClick={handleToggle} style={{ cursor: 'pointer', fontWeight: liked ? 600 : 'normal', color: liked ? '#377DFF' : 'inherit' }}>Like.</span>
                      )}
                    </LikeButton>
                  </li>
                  {isOwner && <li><span onClick={() => setShowConfirm(true)} style={{ cursor: 'pointer', color: '#ff4d4f' }}>{deleting ? '...' : 'Delete'}</span></li>}
                  <li><span className="_time_link"><TimeAgo timestamp={reply.createdAt} /></span></li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
      {showLikes && (
        <LikesList targetType="comment" targetId={reply.id} onClose={() => setShowLikes(false)} optimisticPatch={likesPatch} />
      )}
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
