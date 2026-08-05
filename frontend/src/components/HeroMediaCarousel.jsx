'use client';

import { useEffect, useRef, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';
const SLIDE_DURATION_MS = 6000;

// Auto-rotating carousel for the hero banner — fetches whatever images/
// videos currently sit in the media/hero/ upload folder (see
// api/media-hero/list.php) and rotates through them. No admin UI needed:
// dropping a new file into that folder via File Manager is the entire
// "publishing" workflow.
export default function HeroMediaCarousel() {
  const [items, setItems] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const timerRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/media-hero/list.php`)
      .then((res) => res.json())
      .then((data) => setItems(data.items || []))
      .catch(() => setItems([]));
  }, []);

  // Auto-advance on a timer — but NOT while the visitor has deliberately
  // unmuted a video to listen to it. Cutting off an important announcement
  // mid-sentence because a fixed timer fired would defeat the whole point
  // of adding sound support.
  //
  // Depends on activeIndex too (not just items/isMuted) so the timer
  // restarts fresh on every slide change — otherwise a muted video
  // shorter than SLIDE_DURATION_MS could finish and advance early via
  // handleVideoEnded, while the OLD timer (still counting toward the
  // previous slide) fires moments later and causes an extra, unwanted skip.
  useEffect(() => {
    if (!items || items.length <= 1 || !isMuted) return;

    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, SLIDE_DURATION_MS);

    return () => clearInterval(timerRef.current);
  }, [items, isMuted, activeIndex]);

  // Every time the active slide changes, reset to muted — so unmuting one
  // video doesn't carry over and cause the NEXT video to unexpectedly
  // autoplay with sound (which browsers would block anyway, but this
  // keeps the intent clean: each video starts silent until clicked).
  useEffect(() => {
    setIsMuted(true);
  }, [activeIndex]);

  function toggleMute() {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  }

  function handleVideoEnded() {
    if (!items || items.length <= 1) return;
    setIsMuted(true); // resume normal rotation
    setActiveIndex((prev) => (prev + 1) % items.length);
  }

  if (items === null) {
    return (
      <div className="rounded-soft bg-white/10 border border-white/15 aspect-[4/3] animate-pulse" />
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-soft bg-white/10 border border-white/15 aspect-[4/3] flex items-center justify-center p-6 text-center">
        <p className="text-sm text-cream/60">
          [ No media uploaded yet. Add photos/videos to the media/hero/
          folder on the server to show them here. ]
        </p>
      </div>
    );
  }

  const current = items[activeIndex];

  return (
    <div className="relative rounded-soft overflow-hidden bg-navy/40 border border-white/15 aspect-[4/3]">
      {current.type === 'video' ? (
        <video
          key={current.url}
          ref={videoRef}
          src={current.url}
          autoPlay
          muted
          loop={false}
          playsInline
          onEnded={handleVideoEnded}
          className="w-full h-full object-cover"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={current.url}
          src={current.url}
          alt="Sunshine Social Foundation — recent activity"
          className="w-full h-full object-cover"
        />
      )}

      {current.type === 'video' && (
        <button
          onClick={toggleMute}
          aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          className="absolute top-3 right-3 h-9 w-9 rounded-full bg-navy/70 hover:bg-navy/90 transition-colors flex items-center justify-center text-cream"
        >
          {isMuted ? (
            // Muted (speaker-off) icon
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            // Unmuted (speaker-on) icon
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          )}
        </button>
      )}

      {items.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {items.map((item, i) => (
            <button
              key={item.url}
              onClick={() => setActiveIndex(i)}
              aria-label={`Show slide ${i + 1}`}
              className={`h-2 rounded-full transition-all ${
                i === activeIndex ? 'w-6 bg-sun-soft' : 'w-2 bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
