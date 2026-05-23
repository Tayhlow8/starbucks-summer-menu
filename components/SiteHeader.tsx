"use client";

import { useEffect, useState } from "react";

export default function SiteHeader() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => {
      setIsVisible(window.scrollY > window.innerHeight * 0.82);
    };

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);

    return () => {
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
    };
  }, []);

  return (
    <header className={`site-header ${isVisible ? "is-visible" : ""}`} aria-label="Starbucks summer navigation">
      <a className="brand" href="#top" aria-label="Starbucks Summer Menu home">
        <img src="/assets/figma/starbucks%20logo.png" alt="" />
        <span>Starbucks Summer</span>
      </a>
      <nav>
        <a href="#feature">Featured</a>
        <a href="#menu">Menu</a>
        <a href="#pickup">Order</a>
      </nav>
    </header>
  );
}
