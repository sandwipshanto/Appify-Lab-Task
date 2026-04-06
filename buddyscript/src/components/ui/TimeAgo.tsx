'use client';

import { useEffect, useState } from 'react';

function formatTimeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface TimeAgoProps {
  timestamp: string;
}

export default function TimeAgo({ timestamp }: TimeAgoProps) {
  const [time, setTime] = useState(() => formatTimeAgo(timestamp));

  useEffect(() => {
    // Update every minute to keep it live
    const interval = setInterval(() => {
      setTime(formatTimeAgo(timestamp));
    }, 60000);
    
    // Also update once immediately in case the time just passed a minute mark since initial render
    setTime(formatTimeAgo(timestamp));

    return () => clearInterval(interval);
  }, [timestamp]);

  return <span>{time}</span>;
}
