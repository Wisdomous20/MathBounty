"use client";

import { useRef, useEffect } from "react";
import { useBountyFeed } from "@/lib/use-bounty-feed";

const LINE_HEIGHT = 18;

function formatLine(item: {
  address: string;
  reward: string;
  status: string;
  deadline: string;
  title: string;
}): string {
  const addr = item.address.slice(0, 6) + "…" + item.address.slice(-4);
  const reward = item.reward.padStart(5, "0");
  const status = item.status.padEnd(7, " ");
  const deadline = item.deadline.padStart(4, " ");
  const title = item.title.length > 26 ? item.title.slice(0, 26) + "…" : item.title;
  return `${addr} | ${reward} ETH | ${status} | ${deadline} | ${title}`;
}

interface BountyPylonProps {
  onNewBounty?: () => void;
}

export function BountyPylon({ onNewBounty }: BountyPylonProps) {
  const { items, latestItem } = useBountyFeed(2800);
  const containerRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<(HTMLDivElement | null)[]>([]);
  const dataRef = useRef<{ text: string; isNew: boolean; age: number }[]>([]);
  const offsetRef = useRef(0);
  const animRef = useRef(0);
  const prevIdRef = useRef<string | null>(null);
  const reducedMotion = useRef(false);
  const initializedRef = useRef(false);
  const lineCount = 30;

  // Initialize
  useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    dataRef.current = Array.from({ length: lineCount }, () => ({
      text: "",
      isNew: false,
      age: 0,
    }));
  }, []);

  // Pre-fill with existing feed items on first load
  useEffect(() => {
    if (initializedRef.current) return;

    if (items.length === 0) {
      // Empty state — feed has no data yet
      dataRef.current = [
        { text: "// Waiting for network activity...", isNew: false, age: 0 },
        ...Array.from({ length: lineCount - 1 }, () => ({ text: "", isNew: false, age: 0 })),
      ];
      linesRef.current.forEach((el, i) => {
        if (!el) return;
        const d = dataRef.current[i];
        if (d) {
          el.textContent = d.text;
          el.className = `whitespace-pre transition-colors duration-500 ${
            i === 0 ? "text-ink-faint italic" : "text-ink-faint"
          }`;
        }
      });
      initializedRef.current = true;
      return;
    }

    initializedRef.current = true;

    dataRef.current = items.slice(0, lineCount).map((item) => ({
      text: formatLine(item),
      isNew: false,
      age: 0,
    }));
    while (dataRef.current.length < lineCount) {
      dataRef.current.push({ text: "", isNew: false, age: 0 });
    }

    linesRef.current.forEach((el, i) => {
      if (!el) return;
      const d = dataRef.current[i];
      if (d) {
        el.textContent = d.text;
        el.className = `whitespace-pre transition-colors duration-500 ${
          i < 6 ? "text-ink-muted" : "text-ink-faint"
        }`;
      }
    });
  }, [items]);

  // When new bounty arrives
  useEffect(() => {
    if (!latestItem || latestItem.id === prevIdRef.current) return;
    prevIdRef.current = latestItem.id;
    onNewBounty?.();

    const newData = {
      text: formatLine(latestItem),
      isNew: true,
      age: 0,
    };

    dataRef.current = [newData, ...dataRef.current.slice(0, dataRef.current.length - 1)];

    linesRef.current.forEach((el, i) => {
      if (!el) return;
      const d = dataRef.current[i];
      if (d) {
        el.textContent = d.text;
        el.className = `whitespace-pre transition-colors duration-500 ${
          d.isNew ? "text-brand" : i < 6 ? "text-ink-muted" : "text-ink-faint"
        }`;
      }
    });
  }, [latestItem, onNewBounty]);

  // Animation loop
  useEffect(() => {
    if (reducedMotion.current) return;

    let lastTime = performance.now();
    const speed = 16; // px per second

    const animate = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      offsetRef.current += speed * dt;

      if (offsetRef.current >= LINE_HEIGHT) {
        offsetRef.current -= LINE_HEIGHT;
      }

      if (containerRef.current) {
        containerRef.current.style.transform = `translateY(-${offsetRef.current}px)`;
      }

      // Age new lines
      dataRef.current.forEach((d, i) => {
        if (d.isNew) {
          d.age += dt;
          if (d.age > 1.2) {
            d.isNew = false;
            const el = linesRef.current[i];
            if (el) {
              el.className = `whitespace-pre transition-colors duration-500 ${
                i < 6 ? "text-ink-muted" : "text-ink-faint"
              }`;
            }
          }
        }
      });

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div className="relative h-[580px] md:h-[620px] overflow-hidden border-2 border-border bg-surface-sunken shadow-[8px_8px_0px_0px_rgba(255,59,0,0.15)]">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 border-b-2 border-border bg-surface px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-brand font-bold">
            Live Feed
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-success animate-pulse" />
            <span className="font-mono text-[11px] text-ink-faint uppercase tracking-wider">ONLINE</span>
          </div>
        </div>
      </div>

      {/* Lines */}
      <div
        ref={containerRef}
        className="absolute top-10 left-0 right-0 font-mono text-[11px] leading-[18px] px-3"
      >
        {Array.from({ length: lineCount }).map((_, i) => (
          <div
            key={i}
            ref={(el) => {
              linesRef.current[i] = el;
            }}
            className="whitespace-pre text-ink-faint"
          />
        ))}
      </div>

      {/* Bottom fade — brutalist, no blur */}
      <div
        className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none"
        style={{
          background: "linear-gradient(to top, var(--surface-sunken) 0%, transparent 100%)",
        }}
      />
    </div>
  );
}
