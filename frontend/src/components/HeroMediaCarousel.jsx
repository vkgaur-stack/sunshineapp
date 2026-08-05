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
  const timerRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/media-hero/list.php`)
      .then((res) => res.json())
      .then((data) => setItems(data.items || []))
      .catch(() => setItems([]));
  }, []);

  useEffect(() => {
    if (!items || items.length <= 1) return;

    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, SLIDE_DURATION_MS);

    return () => clearInterval(timerRef.current);
  }, [items]);

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
          src={current.url}
          autoPlay
          muted
          loop
          playsInline
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
