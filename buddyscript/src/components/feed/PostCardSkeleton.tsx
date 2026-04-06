'use client';

import './PostCardSkeleton.css';

export default function PostCardSkeleton({ showImage = false }: { showImage?: boolean }) {
  return (
    <div className="_feed_inner_timeline_post_area _b_radious6 _padd_b24 _padd_t24 _mar_b16 skeleton-post" aria-hidden="true">
      <div className="_feed_inner_timeline_content _padd_r24 _padd_l24">
        {/* Header: avatar + name/time */}
        <div className="_feed_inner_timeline_post_top">
          <div className="_feed_inner_timeline_post_box">
            <div className="skeleton-avatar" />
            <div className="_feed_inner_timeline_post_box_txt">
              <div className="skeleton-line skeleton-name" />
              <div className="skeleton-line skeleton-time" />
            </div>
          </div>
        </div>

        {/* Content text lines */}
        <div className="skeleton-content">
          <div className="skeleton-line skeleton-text-full" />
          <div className="skeleton-line skeleton-text-mid" />
        </div>

        {/* Optional image placeholder */}
        {showImage && (
          <div className="skeleton-line skeleton-image" />
        )}
      </div>

      {/* Reaction bar */}
      <div className="skeleton-reactions">
        <div className="skeleton-line skeleton-btn" />
        <div className="skeleton-line skeleton-btn" />
      </div>
    </div>
  );
}

export function PostCardSkeletonGroup({ count = 2 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <PostCardSkeleton key={i} showImage={i % 2 === 0} />
      ))}
    </>
  );
}
