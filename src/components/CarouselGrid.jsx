import { useRef, useEffect, useState } from 'react';

export default function CarouselGrid({ page, dir, children }) {
  const [slots, setSlots] = useState([{ id: page, dir, content: children }]);
  const prevRef = useRef({ page, dir });

  useEffect(() => {
    if (page === prevRef.current.page) {
      // Same page but children changed (e.g. data loaded) — update in place
      setSlots([{ id: page, dir, content: children }]);
      return;
    }
    const exitDir = dir === 'right' ? 'exit-left' : 'exit-right';
    const prevId = prevRef.current.page;
    prevRef.current = { page, dir };

    // Render both: exiting (old) + entering (new)
    setSlots((prev) => {
      const exiting = prev.find((s) => s.id === prevId);
      const exitSlot = exiting ? { ...exiting, dir: exitDir, exiting: true } : null;
      const enterSlot = { id: page, dir, content: children };
      return exitSlot ? [exitSlot, enterSlot] : [enterSlot];
    });

    // Remove the exiting slot after animation completes
    const t = setTimeout(() => {
      setSlots([{ id: page, dir, content: children }]);
    }, 380);
    return () => clearTimeout(t);
  }, [page, dir]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep content fresh on non-page changes
  useEffect(() => {
    setSlots((prev) =>
      prev.map((s) => (s.id === page && !s.exiting ? { ...s, content: children } : s))
    );
  }, [children, page]);

  return (
    <div className="carousel-track">
      {slots.map((slot) => (
        <div key={slot.id} className={`carousel-slide carousel-slide--${slot.dir}`}>
          {slot.content}
        </div>
      ))}
    </div>
  );
}