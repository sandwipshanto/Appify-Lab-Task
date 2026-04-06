'use client';

import { useState } from 'react';
import type { Post } from './CreatePost';
import LikeButton from './LikeButton';
import LikesList from './LikesList';
import TimeAgo from '../ui/TimeAgo';
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
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function PostCard({ post, currentUser, onDelete, onToggleComments }: PostCardProps) {
  const [showLikes, setShowLikes] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [likesPatch, setLikesPatch] = useState<{ action: 'add' | 'remove'; user: { id: string; firstName: string; lastName: string; avatar: string | null } } | null>(null);
  const isOwner = post.authorId === currentUser.id;

  async function handleDelete() {
    if (!confirm('Delete this post?')) return;
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
      setMenuOpen(false);
    }
  }

  return (
    <div className="_feed_inner_timeline_post_area _b_radious6 _padd_b24 _padd_t24 _mar_b16">
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
            <div className="_feed_inner_timeline_post_box_dropdown" style={{ position: 'relative' }}>
              <div className="_feed_timeline_post_dropdown">
                <button
                  className="_feed_timeline_post_dropdown_link"
                  type="button"
                  onClick={() => setMenuOpen(!menuOpen)}
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
                        onClick={handleDelete}
                        disabled={deleting}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px' }}
                      >
                        <span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 18 18">
                            <path stroke="#1890FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M2.25 4.5h13.5M6 4.5V3a1.5 1.5 0 011.5-1.5h3A1.5 1.5 0 0112 3v1.5m2.25 0V15a1.5 1.5 0 01-1.5 1.5h-7.5a1.5 1.5 0 01-1.5-1.5V4.5h10.5z" />
                          </svg>
                        </span>
                        {deleting ? 'Deleting...' : 'Delete Post'}
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
            <img src={post.imageUrl} alt="Post image" className="_time_img" />
          </div>
        )}
      </div>

      <LikeButton
        targetType="post"
        targetId={post.id}
        liked={post.liked}
        likeCount={post.likeCount}
        onLikeCountClick={() => setShowLikes(true)}
        onToggle={(nowLiked) =>
          setLikesPatch({
            action: nowLiked ? 'add' : 'remove',
            user: currentUser,
          })
        }
      />

      <div className="_feed_inner_timeline_reaction" style={{ padding: '0 24px' }}>
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
              {post.commentCount > 0 ? ` ${post.commentCount} Comments` : ' Comment'}
            </span>
          </span>
        </button>
      </div>

      {showLikes && (
        <LikesList
          targetType="post"
          targetId={post.id}
          onClose={() => setShowLikes(false)}
          optimisticPatch={likesPatch}
        />
      )}
    </div>
  );
}
