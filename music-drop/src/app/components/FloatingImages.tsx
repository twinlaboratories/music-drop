"use client";
import { useState, useCallback, useRef, useEffect } from "react";

// Seeded PRNG — stable fractional value 0–1 from any integer seed
function sr(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

const ALL_IMAGES = [
  "/moodboard/img-001.jpg","/moodboard/img-002.jpg","/moodboard/img-003.jpg","/moodboard/img-004.jpg","/moodboard/img-005.jpg",
  "/moodboard/img-006.jpg","/moodboard/img-007.jpg","/moodboard/img-008.jpg","/moodboard/img-009.jpg","/moodboard/img-010.png",
  "/moodboard/img-011.jpg","/moodboard/img-012.jpg","/moodboard/img-013.jpg","/moodboard/img-014.jpg","/moodboard/img-015.jpg",
  "/moodboard/img-016.jpg","/moodboard/img-017.jpg","/moodboard/img-018.jpg","/moodboard/img-019.jpg","/moodboard/img-020.jpg",
  "/moodboard/img-021.jpg","/moodboard/img-022.jpg","/moodboard/img-023.jpg","/moodboard/img-024.jpg","/moodboard/img-025.jpg",
  "/moodboard/img-026.jpg","/moodboard/img-027.jpg","/moodboard/img-028.jpg","/moodboard/img-029.jpg","/moodboard/img-030.png",
  "/moodboard/img-031.webp","/moodboard/img-032.jpg","/moodboard/img-033.jpg","/moodboard/img-034.jpg","/moodboard/img-035.jpg",
  "/moodboard/img-036.png","/moodboard/img-037.jpg","/moodboard/img-038.png","/moodboard/img-039.png","/moodboard/img-040.png",
  "/moodboard/img-041.jpg","/moodboard/img-042.jpg","/moodboard/img-043.jpg","/moodboard/img-044.jpg","/moodboard/img-045.jpg",
  "/moodboard/img-046.jpg","/moodboard/img-047.jpg","/moodboard/img-048.jpg","/moodboard/img-049.png","/moodboard/img-050.webp",
  "/moodboard/img-051.jpg","/moodboard/img-052.jpg","/moodboard/img-053.jpg","/moodboard/img-054.jpg","/moodboard/img-055.jpg",
  "/moodboard/img-056.jpg","/moodboard/img-057.jpg","/moodboard/img-058.jpg","/moodboard/img-059.jpg","/moodboard/img-060.png",
  "/moodboard/img-061.jpg","/moodboard/img-062.jpg","/moodboard/img-063.jpg","/moodboard/img-064.jpg","/moodboard/img-065.jpg",
  "/moodboard/img-066.jpg","/moodboard/img-067.jpg","/moodboard/img-068.jpg","/moodboard/img-069.jpg","/moodboard/img-070.jpg",
  "/moodboard/img-071.jpg","/moodboard/img-072.jpg","/moodboard/img-073.jpg","/moodboard/img-074.jpg","/moodboard/img-075.jpg",
  "/moodboard/img-076.jpg","/moodboard/img-077.jpg","/moodboard/img-078.jpg","/moodboard/img-079.jpg","/moodboard/img-080.jpg",
  "/moodboard/img-081.jpg","/moodboard/img-082.jpg","/moodboard/img-083.jpg","/moodboard/img-084.jpg","/moodboard/img-085.jpg",
  "/moodboard/img-086.jpg","/moodboard/img-087.jpg","/moodboard/img-088.jpg","/moodboard/img-089.jpg","/moodboard/img-090.jpg",
  "/moodboard/img-091.png","/moodboard/img-092.png","/moodboard/img-093.jpg","/moodboard/img-094.png","/moodboard/img-095.jpg",
  "/moodboard/img-096.jpg","/moodboard/img-097.jpg","/moodboard/img-098.jpg","/moodboard/img-099.jpg","/moodboard/img-100.jpg",
  "/moodboard/img-101.jpg","/moodboard/img-102.jpg","/moodboard/img-103.jpg","/moodboard/img-104.jpg","/moodboard/img-105.jpg",
  "/moodboard/img-106.jpg","/moodboard/img-107.jpg","/moodboard/img-108.jpg","/moodboard/img-109.jpg","/moodboard/img-110.jpg",
  "/moodboard/img-111.jpg","/moodboard/img-112.jpg","/moodboard/img-113.jpg","/moodboard/img-114.jpg","/moodboard/img-115.jpg",
  "/moodboard/img-116.jpg","/moodboard/img-117.jpg","/moodboard/img-118.jpg","/moodboard/img-119.jpg","/moodboard/img-120.jpg",
  "/moodboard/img-121.jpg","/moodboard/img-122.jpg","/moodboard/img-123.jpg","/moodboard/img-124.jpg","/moodboard/img-125.jpg",
  "/moodboard/img-126.jpg","/moodboard/img-127.jpg","/moodboard/img-128.jpg","/moodboard/img-129.jpg","/moodboard/img-130.jpg",
  "/moodboard/img-131.jpg","/moodboard/img-132.jpg","/moodboard/img-133.jpg","/moodboard/img-134.jpg","/moodboard/img-135.jpg",
  "/moodboard/img-136.jpg","/moodboard/img-137.jpg","/moodboard/img-138.jpg","/moodboard/img-139.jpg","/moodboard/img-140.jpg",
  "/moodboard/img-141.jpg","/moodboard/img-142.jpg","/moodboard/img-143.jpg","/moodboard/img-144.jpg","/moodboard/img-145.jpg",
  "/moodboard/img-146.jpg","/moodboard/img-147.jpg","/moodboard/img-148.jpg","/moodboard/img-149.jpg","/moodboard/img-150.jpg",
  "/moodboard/img-151.jpg","/moodboard/img-152.jpg","/moodboard/img-153.jpg","/moodboard/img-154.jpg","/moodboard/img-155.jpg",
  "/moodboard/img-156.jpg","/moodboard/img-157.jpg","/moodboard/img-158.jpg","/moodboard/img-159.jpg","/moodboard/img-160.jpg",
  "/moodboard/img-161.jpg","/moodboard/img-162.webp","/moodboard/img-163.jpg","/moodboard/img-164.jpg","/moodboard/img-165.jpg",
  "/moodboard/img-166.jpg","/moodboard/img-167.jpg","/moodboard/img-168.jpg","/moodboard/img-169.jpg","/moodboard/img-170.jpg",
  "/moodboard/img-171.png","/moodboard/img-172.jpg","/moodboard/img-173.jpg","/moodboard/img-174.jpg","/moodboard/img-175.jpg",
  "/moodboard/img-176.jpg","/moodboard/img-177.jpg","/moodboard/img-178.jpg","/moodboard/img-179.png","/moodboard/img-180.jpg",
  "/moodboard/img-181.jpg","/moodboard/img-182.jpg","/moodboard/img-183.jpg","/moodboard/img-184.jpg","/moodboard/img-185.jpg",
  "/moodboard/img-186.jpg","/moodboard/img-187.jpg","/moodboard/img-188.jpg","/moodboard/img-189.gif","/moodboard/img-190.jpg",
  "/moodboard/img-191.jpg","/moodboard/img-192.jpg","/moodboard/img-193.jpg","/moodboard/img-194.jpg","/moodboard/img-195.jpg",
  "/moodboard/img-196.jpg","/moodboard/img-197.jpg","/moodboard/img-198.png","/moodboard/img-199.jpg","/moodboard/img-200.jpg",
  "/moodboard/img-201.jpg","/moodboard/img-202.jpg","/moodboard/img-203.jpg","/moodboard/img-204.jpg","/moodboard/img-205.jpg",
  "/moodboard/img-206.jpg","/moodboard/img-207.jpg","/moodboard/img-208.jpg","/moodboard/img-209.jpg","/moodboard/img-210.jpg",
  "/moodboard/img-211.jpg","/moodboard/img-212.jpg","/moodboard/img-213.jpg","/moodboard/img-214.jpg","/moodboard/img-215.jpg",
  "/moodboard/img-216.jpg",
];

// Pick 32 evenly distributed images
const STEP = Math.floor(ALL_IMAGES.length / 32);
const DISPLAYED = ALL_IMAGES.filter((_, i) => i % STEP === 0).slice(0, 32);

interface Item {
  id: number;
  src: string;
  x: number;
  y: number;
  rotation: number;
  width: number;
  floatVariant: number;
  delay: number;
  duration: number;
  z: number;
  dragging: boolean;
}

type DragState = {
  id: number;
  startMouseX: number;
  startMouseY: number;
  startItemX: number;
  startItemY: number;
};

export default function FloatingImages() {
  const [items, setItems] = useState<Item[]>([]);
  const drag = useRef<DragState | null>(null);
  const topZ = useRef(100);

  // Initialise positions client-side only (avoids SSR/hydration mismatch)
  useEffect(() => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    setItems(
      DISPLAYED.map((src, i) => ({
        id: i,
        src,
        x: sr(i * 7 + 1) * W * 0.92 - 10,
        y: sr(i * 13 + 2) * H * 1.3 - H * 0.15,
        rotation: (sr(i * 3 + 3) - 0.5) * 44,
        width: Math.round(sr(i * 11 + 4) * 80 + 90),
        floatVariant: i % 3,
        delay: sr(i * 5 + 5) * 12,
        duration: sr(i * 17 + 6) * 8 + 12,
        z: 10 + i,
        dragging: false,
      }))
    );
  }, []);

  const onMouseDown = useCallback(
    (e: React.MouseEvent, id: number) => {
      e.preventDefault();
      topZ.current += 1;
      const item = items.find((it) => it.id === id);
      if (!item) return;
      drag.current = {
        id,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startItemX: item.x,
        startItemY: item.y,
      };
      setItems((prev) =>
        prev.map((it) =>
          it.id === id ? { ...it, dragging: true, z: topZ.current } : it
        )
      );
    },
    [items]
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!drag.current) return;
      const { id, startMouseX, startMouseY, startItemX, startItemY } = drag.current;
      setItems((prev) =>
        prev.map((it) =>
          it.id === id
            ? {
                ...it,
                x: startItemX + e.clientX - startMouseX,
                y: startItemY + e.clientY - startMouseY,
              }
            : it
        )
      );
    };
    const onUp = () => {
      if (!drag.current) return;
      const id = drag.current.id;
      drag.current = null;
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, dragging: false } : it))
      );
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    // pointer-events:none on the container — only individual image divs are interactive
    <div
      className="fixed inset-0 overflow-visible"
      style={{ zIndex: 10, pointerEvents: "none" }}
      aria-hidden="true"
    >
      {items.map((item) => (
        <div
          key={item.id}
          className="absolute select-none"
          style={{
            left: item.x,
            top: item.y,
            width: item.width,
            zIndex: item.z,
            transform: `rotate(${item.rotation}deg)`,
            cursor: item.dragging ? "grabbing" : "grab",
            pointerEvents: "auto",
          }}
          onMouseDown={(e) => onMouseDown(e, item.id)}
        >
          <div
            className="pink-frame"
            style={{
              animationName: item.dragging ? "none" : `float-${item.floatVariant}`,
              animationDuration: `${item.duration}s`,
              animationDelay: `-${item.delay}s`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.src}
              alt=""
              style={{
                display: "block",
                width: "100%",
                aspectRatio: "1 / 1",
                objectFit: "cover",
                pointerEvents: "none",
              }}
              loading="lazy"
              decoding="async"
              draggable={false}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
