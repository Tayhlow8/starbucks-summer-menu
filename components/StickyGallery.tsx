"use client";

import { useEffect, useRef, useState } from "react";

const slides = [
  {
    image: "/assets/menu/coconut%20default.png",
    alt: "Toasted Coconut Cream Cold Brew",
    label: "Coconut Cold Brew",
  },
  {
    image: "/assets/menu/iced%20horchatta%20default.png",
    alt: "Iced Horchata Shaken Espresso",
    label: "Iced Horchata Espresso",
  },
  {
    image: "/assets/menu/dragon%20fruit%20default.png",
    alt: "Mango Dragonfruit Energy Refresher",
    label: "Mango Dragonfruit",
  },
];

export default function StickyGallery() {
  const [active, setActive] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  // Desktop-only: drive active index from scroll progress
  useEffect(() => {
    if (window.matchMedia("(max-width: 1100px)").matches) return;

    let killed = false;

    async function init() {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      const section = sectionRef.current;
      if (!section || killed) return;

      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        onUpdate(self) {
          const i = Math.min(
            slides.length - 1,
            Math.floor(self.progress * slides.length)
          );
          setActive((prev) => (prev === i ? prev : i));
        },
      });

      ScrollTrigger.refresh();
    }

    init();

    return () => {
      killed = true;
      import("gsap/ScrollTrigger").then(({ ScrollTrigger: ST }) => {
        ST.getAll().forEach((t) => t.kill());
      });
    };
  }, []);

  const previewIndex = Math.min(active + 1, slides.length - 1);

  return (
    <section ref={sectionRef} id="feature" className="sticky-gallery">
      <div className="sg-stage">

        {/* ── Left panel ── */}
        <div className="sg-left">
          <p className="sg-eyebrow">Summer 2026</p>
          <h2 className="sg-title">New flavors made for the hottest days.</h2>
          <p className="sg-body">
            Three of our boldest new drinks — each one a reason to come back.
          </p>

          <ul className="sg-labels" aria-label="Drink selection">
            {slides.map((s, i) => (
              <li
                key={i}
                className={`sg-label${active === i ? " is-active" : ""}`}
                onClick={() => setActive(i)}
                role="button"
                tabIndex={0}
                aria-pressed={active === i}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setActive(i);
                }}
              >
                <span className="sg-label-dot" />
                {s.label}
              </li>
            ))}
          </ul>
        </div>

        {/* ── Right panel ── */}
        <div className="sg-right">
          <div className="sg-photos-col">
            <div className="sg-photos">
              {slides.map((s, i) => (
                <div
                  key={i}
                  className={`sg-photo${active === i ? " is-active" : ""}`}
                >
                  <img src={s.image} alt={s.alt} />
                </div>
              ))}
            </div>

            {/* Context-aware captions */}
            <p className="sg-caption sg-caption--scroll">
              scroll through the gallery to check more flavours
            </p>
            <p className="sg-caption sg-caption--tap">
              tap a drink to explore more flavours
            </p>
          </div>

          {/* Preview thumbnail — desktop only, hidden on last slide */}
          {active < slides.length - 1 && (
            <div className="sg-preview" aria-hidden="true">
              {slides.map((s, i) => (
                <div
                  key={i}
                  className={`sg-preview-frame${i === previewIndex ? " is-active" : ""}`}
                >
                  <img src={s.image} alt="" />
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
