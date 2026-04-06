'use client';

import { useState, useRef } from 'react';
import type { Post } from './CreatePost';
import LikeButton from './LikeButton';
import LikesList from './LikesList';
import TimeAgo from '../ui/TimeAgo';
import ConfirmModal from '../ui/ConfirmModal';
import ImageLightbox from '../ui/ImageLightbox';
import { useClickOutside } from '@/hooks/useClickOutside';
import toast from 'react-hot-toast';

interface PostCardProps {
  post: Post;
  currentUser: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
  onDelete: (postId: string) => void;
  onToggleComments?: (postId: string) => void;
  isNew?: boolean;
}

export default function PostCard({ post, currentUser, onDelete, onToggleComments, isNew }: PostCardProps) {
  const [showLikes, setShowLikes] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [likesPatch, setLikesPatch] = useState<{ action: 'add' | 'remove'; user: { id: string; firstName: string; lastName: string; avatar: string | null } } | null>(null);
  const isOwner = post.authorId === currentUser.id;

  // Click-outside to close kebab menu
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, () => setMenuOpen(false), menuOpen);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE', headers: { Origin: window.location.origin } });
      if (res.ok) {
        onDelete(post.id);
        toast.success('Post deleted');
      } else {
        toast.error('Failed to delete post');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setDeleting(false);
      setShowConfirm(false);
      setMenuOpen(false);
    }
  }

  return (
    <div
      className="_feed_inner_timeline_post_area _b_radious6 _padd_b24 _padd_t24 _mar_b16"
      style={isNew ? {
        animation: 'postSlideIn 0.35s ease-out',
      } : undefined}
    >
      <div className="_feed_inner_timeline_content _padd_r24 _padd_l24">
        <div className="_feed_inner_timeline_post_top">
          <div className="_feed_inner_timeline_post_box">
            <div className="_feed_inner_timeline_post_box_image">
              <img
                src={post.author.avatar || '/assets/images/default_avatar.png'}
                alt={`${post.author.firstName} ${post.author.lastName}`}
                className="_post_img"
              />
            </div>
            <div className="_feed_inner_timeline_post_box_txt">
              <h4 className="_feed_inner_timeline_post_box_title">
                {post.author.firstName} {post.author.lastName}
              </h4>
              <p className="_feed_inner_timeline_post_box_para">
                <TimeAgo timestamp={post.createdAt} /> &middot; {post.visibility === 'PRIVATE' ? 'Private' : 'Public'}
              </p>
            </div>
          </div>
          {isOwner && (
            <div className="_feed_inner_timeline_post_box_dropdown" style={{ position: 'relative' }} ref={menuRef}>
              <div className="_feed_timeline_post_dropdown">
                <button
                  className="_feed_timeline_post_dropdown_link"
                  type="button"
                  onClick={() => setMenuOpen(!menuOpen)}
                  style={{ padding: '8px 10px' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="4" height="17" fill="none" viewBox="0 0 4 17">
                    <circle cx="2" cy="2" r="2" fill="#C4C4C4" />
                    <circle cx="2" cy="8" r="2" fill="#C4C4C4" />
                    <circle cx="2" cy="15" r="2" fill="#C4C4C4" />
                  </svg>
                </button>
              </div>
              {menuOpen && (
                <div className="_feed_timeline_dropdown _timeline_dropdown" style={{ display: 'block', opacity: 1, visibility: 'visible' }}>
                  <ul className="_feed_timeline_dropdown_list">
                    <li className="_feed_timeline_dropdown_item">
                      <button
                        className="_feed_timeline_dropdown_link"
                        onClick={() => { setMenuOpen(false); setShowConfirm(true); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px' }}
                      >
                        <span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 18 18">
                            <path stroke="#1890FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M2.25 4.5h13.5M6 4.5V3a1.5 1.5 0 011.5-1.5h3A1.5 1.5 0 0112 3v1.5m2.25 0V15a1.5 1.5 0 01-1.5 1.5h-7.5a1.5 1.5 0 01-1.5-1.5V4.5h10.5z" />
                          </svg>
                        </span>
                        Delete Post
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        {post.content && (
          <h4 className="_feed_inner_timeline_post_title">{post.content}</h4>
        )}
        {post.imageUrl && (
          <div className="_feed_inner_timeline_image">
            <img
              src={post.imageUrl}
              alt="Post image"
              className="_time_img"
              style={{ cursor: 'zoom-in' }}
              onClick={() => setShowLightbox(true)}
            />
          </div>
        )}
      </div>

      <LikeButton
        targetType="post"
        targetId={post.id}
        liked={post.liked}
        likeCount={post.likeCount}
        onToggle={(nowLiked) =>
          setLikesPatch({
            action: nowLiked ? 'add' : 'remove',
            user: currentUser,
          })
        }
      >
        {({ liked, likeCount, handleToggle }) => (
          <>
            <div className="_feed_inner_timeline_total_reacts _padd_r24 _padd_l24 _mar_b26">
              <div className="_feed_inner_timeline_total_reacts_image" onClick={() => likeCount > 0 && setShowLikes(true)} style={likeCount > 0 ? { cursor: 'pointer' } : {}}>
                {likeCount > 0 ? (
                  <>
                    {post.likes?.slice(0, 5).map((like, index) => {
                      let className = index === 0 ? '_react_img1' : '_react_img';
                      if (index >= 2) className += ' _rect_img_mbl_none';
                      return (
                        <img
                          key={like.user.id}
                          src={like.user.avatar || '/assets/images/default_avatar.png'}
                          alt={`${like.user.firstName}'s reaction`}
                          className={className}
                        />
                      );
                    })}
                    <p className="_feed_inner_timeline_total_reacts_para">{likeCount}</p>
                  </>
                ) : (
                  <p className="_feed_inner_timeline_total_reacts_para">0</p>
                )}
              </div>
              <div className="_feed_inner_timeline_total_reacts_txt">
                <p className="_feed_inner_timeline_total_reacts_para1" onClick={() => onToggleComments?.(post.id)} style={{ cursor: 'pointer' }}>
                  <span>{post.commentCount}</span> Comment{post.commentCount !== 1 ? 's' : ''}
                </p>
                <p className="_feed_inner_timeline_total_reacts_para2" onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
                  toast.success('Link copied');
                }} style={{ cursor: 'pointer' }}>
                  <span>{post.shareCount || 0}</span> Share
                </p>
              </div>
            </div>

            <div className="_feed_inner_timeline_reaction" style={{ padding: '0 24px' }}>
              <button
                className={`_feed_inner_timeline_reaction_emoji _feed_reaction${liked ? ' _feed_reaction_active' : ''}`}
                onClick={handleToggle}
                type="button"
              >
                <span className="_feed_inner_timeline_reaction_link">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg
                      style={{ transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)', transform: liked ? 'scale(1.2)' : 'scale(1)' }}
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill={liked ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="feather feather-thumbs-up"
                    >
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                    </svg>
                    Like
                  </span>
                </span>
              </button>
              <button
                className="_feed_inner_timeline_reaction_comment _feed_reaction"
                type="button"
                onClick={() => onToggleComments?.(post.id)}
              >
                <span className="_feed_inner_timeline_reaction_link">
                  <span>
                    <svg className="_reaction_svg" xmlns="http://www.w3.org/2000/svg" width="21" height="21" fill="none" viewBox="0 0 21 21">
                      <path stroke="#000" d="M1 10.5c0-.464 0-.696.009-.893A9 9 0 019.607 1.01C9.804 1 10.036 1 10.5 1v0c.464 0 .696 0 .893.009a9 9 0 018.598 8.598c.009.197.009.429.009.893v6.046c0 1.36 0 2.041-.317 2.535a2 2 0 01-.602.602c-.494.317-1.174.317-2.535.317H10.5c-.464 0-.696 0-.893-.009a9 9 0 01-8.598-8.598C1 11.196 1 10.964 1 10.5v0z" />
                      <path stroke="#000" strokeLinecap="round" strokeLinejoin="round" d="M6.938 9.313h7.125M10.5 14.063h3.563" />
                    </svg>
                    Comment
                  </span>
                </span>
              </button>
              <button
                className="_feed_inner_timeline_reaction_share _feed_reaction"
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
                  toast.success('Link copied to clipboard');
                }}
              >
                <span className="_feed_inner_timeline_reaction_link">
                  <span>
                    <svg className="_reaction_svg" xmlns="http://www.w3.org/2000/svg" width="24" height="21" fill="none" viewBox="0 0 24 21">
                      <path stroke="#000" strokeLinejoin="round" d="M23 10.5L12.917 1v5.429C3.267 6.429 1 13.258 1 20c2.785-3.52 5.248-5.429 11.917-5.429V20L23 10.5z" />
                    </svg>
                    Share
                  </span>
                </span>
              </button>
            </div>
          </>
        )}
      </LikeButton>

      {showLikes && (
        <LikesList
          targetType="post"
          targetId={post.id}
          onClose={() => setShowLikes(false)}
          optimisticPatch={likesPatch}
        />
      )}

      {/* Styled confirm dialog for delete */}
      {showConfirm && (
        <ConfirmModal
          title="Delete Post"
          message="Are you sure you want to delete this post? This action cannot be undone."
          confirmLabel="Delete"
          danger
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {/* Image lightbox */}
      {showLightbox && post.imageUrl && (
        <ImageLightbox
          src={post.imageUrl}
          alt="Post image"
          onClose={() => setShowLightbox(false)}
        />
      )}

      {/* Slide-in animation keyframes */}
      {isNew && (
        <style>{`
          @keyframes postSlideIn {
            from { opacity: 0; transform: translateY(-12px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      )}
    </div>
  );
}
