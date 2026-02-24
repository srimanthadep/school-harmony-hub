import { useRef, useState, useCallback } from "react";
import { Student, AttendanceStatus } from "@/data/students";
import { Check, X, User, Hash, BookOpen } from "lucide-react";

interface SwipeCardProps {
  student: Student;
  onSwipe: (status: AttendanceStatus) => void;
}

const SWIPE_THRESHOLD = 100;

export default function SwipeCard({ student, onSwipe }: SwipeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isExiting, setIsExiting] = useState<AttendanceStatus | null>(null);
  const startPos = useRef({ x: 0, y: 0 });

  const swipeProgress = Math.min(Math.abs(offset.x) / SWIPE_THRESHOLD, 1);
  const direction: AttendanceStatus | null =
    offset.x > 30 ? "present" : offset.x < -30 ? "absent" : null;

  const handleStart = useCallback((clientX: number, clientY: number) => {
    startPos.current = { x: clientX, y: clientY };
    setIsDragging(true);
  }, []);

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging) return;
      setOffset({
        x: clientX - startPos.current.x,
        y: (clientY - startPos.current.y) * 0.3,
      });
    },
    [isDragging]
  );

  const handleEnd = useCallback(() => {
    setIsDragging(false);
    if (Math.abs(offset.x) >= SWIPE_THRESHOLD) {
      const status: AttendanceStatus = offset.x > 0 ? "present" : "absent";
      setIsExiting(status);
      setTimeout(() => onSwipe(status), 300);
    } else {
      setOffset({ x: 0, y: 0 });
    }
  }, [offset.x, onSwipe]);

  const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchEnd = () => handleEnd();
  const onMouseDown = (e: React.MouseEvent) => { e.preventDefault(); handleStart(e.clientX, e.clientY); };
  const onMouseMove = (e: React.MouseEvent) => handleMove(e.clientX, e.clientY);
  const onMouseUp = () => handleEnd();
  const onMouseLeave = () => { if (isDragging) handleEnd(); };

  const rotation = offset.x * 0.08;
  const exitX = isExiting === "present" ? 600 : isExiting === "absent" ? -600 : 0;

  const cardStyle: React.CSSProperties = {
    transform: isExiting
      ? `translateX(${exitX}px) rotate(${exitX * 0.05}deg)`
      : `translateX(${offset.x}px) translateY(${offset.y}px) rotate(${rotation}deg)`,
    transition: isDragging ? "none" : "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s",
    opacity: isExiting ? 0 : 1,
  };

  const initials = student.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div
      ref={cardRef}
      className="swipe-card absolute w-full max-w-sm cursor-grab active:cursor-grabbing"
      style={cardStyle}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      <div className="relative overflow-hidden rounded-2xl bg-card shadow-xl border border-border">
        {/* Present/Absent overlay badges */}
        <div
          className="absolute top-6 left-6 z-10 rounded-xl border-4 border-present px-4 py-2 font-extrabold text-present text-2xl -rotate-12"
          style={{ opacity: direction === "present" ? swipeProgress : 0, transition: "opacity 0.15s" }}
        >
          PRESENT
        </div>
        <div
          className="absolute top-6 right-6 z-10 rounded-xl border-4 border-absent px-4 py-2 font-extrabold text-absent text-2xl rotate-12"
          style={{ opacity: direction === "absent" ? swipeProgress : 0, transition: "opacity 0.15s" }}
        >
          ABSENT
        </div>

        {/* Student info - text only */}
        <div className="px-6 pt-10 pb-8 flex flex-col items-center text-center space-y-5">
          {/* Avatar initials */}
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 border-2 border-primary/20">
            <span className="text-2xl font-bold text-primary">{initials}</span>
          </div>

          {/* Name */}
          <h2 className="text-2xl font-bold text-card-foreground tracking-tight">{student.name}</h2>

          {/* Details grid */}
          <div className="w-full grid grid-cols-1 gap-3">
            <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3">
              <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="text-left">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">Roll Number</p>
                <p className="text-sm font-semibold text-card-foreground">{student.rollNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3">
              <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="text-left">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">Class & Section</p>
                <p className="text-sm font-semibold text-card-foreground">{student.classSection}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Color glow based on swipe direction */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            boxShadow:
              direction === "present"
                ? `inset 0 0 60px hsl(var(--present) / ${swipeProgress * 0.25})`
                : direction === "absent"
                ? `inset 0 0 60px hsl(var(--absent) / ${swipeProgress * 0.25})`
                : "none",
            transition: "box-shadow 0.15s",
          }}
        />
      </div>
    </div>
  );
}

// Button bar for manual present/absent
export function SwipeActions({
  onPresent,
  onAbsent,
}: {
  onPresent: () => void;
  onAbsent: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-8 mt-6">
      <button
        onClick={onAbsent}
        className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-absent bg-absent/10 text-absent shadow-lg transition-all hover:scale-110 hover:bg-absent hover:text-absent-foreground active:scale-95"
        aria-label="Mark Absent"
      >
        <X className="h-8 w-8" strokeWidth={3} />
      </button>
      <button
        onClick={onPresent}
        className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-present bg-present/10 text-present shadow-lg transition-all hover:scale-110 hover:bg-present hover:text-present-foreground active:scale-95"
        aria-label="Mark Present"
      >
        <Check className="h-8 w-8" strokeWidth={3} />
      </button>
    </div>
  );
}
