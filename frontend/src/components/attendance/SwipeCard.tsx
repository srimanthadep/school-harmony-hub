import React, { useRef, useState, useCallback } from 'react';
import { MdCheck, MdClose } from 'react-icons/md';
import { AttendanceStatus, AttendanceStudent } from '../../hooks/useAttendance';

interface SwipeCardProps {
    student: AttendanceStudent;
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
        offset.x > 30 ? 'present' : offset.x < -30 ? 'absent' : null;

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
            const status: AttendanceStatus = offset.x > 0 ? 'present' : 'absent';
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
    const exitX = isExiting === 'present' ? 600 : isExiting === 'absent' ? -600 : 0;

    const initials = student.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const cardStyle: React.CSSProperties = {
        transform: isExiting
            ? `translateX(${exitX}px) rotate(${exitX * 0.05}deg)`
            : `translateX(${offset.x}px) translateY(${offset.y}px) rotate(${rotation}deg)`,
        transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s',
        opacity: isExiting ? 0 : 1,
        position: 'absolute',
        width: '100%',
        maxWidth: 360,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
    };

    return (
        <div
            ref={cardRef}
            style={cardStyle}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
        >
            <div style={{
                position: 'relative', overflow: 'hidden', borderRadius: 24,
                background: 'var(--bg-secondary)', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                border: '1px solid var(--border-light)',
            }}>
                {/* Present Badge */}
                <div style={{
                    position: 'absolute', top: 24, left: 20, zIndex: 10,
                    border: '4px solid #10b981', borderRadius: 12, padding: '6px 16px',
                    fontWeight: 900, fontSize: 22, color: '#10b981', transform: 'rotate(-12deg)',
                    opacity: direction === 'present' ? swipeProgress : 0,
                    transition: 'opacity 0.15s', background: 'rgba(16,185,129,0.1)',
                    letterSpacing: 1,
                }}>
                    PRESENT
                </div>
                {/* Absent Badge */}
                <div style={{
                    position: 'absolute', top: 24, right: 20, zIndex: 10,
                    border: '4px solid #ef4444', borderRadius: 12, padding: '6px 16px',
                    fontWeight: 900, fontSize: 22, color: '#ef4444', transform: 'rotate(12deg)',
                    opacity: direction === 'absent' ? swipeProgress : 0,
                    transition: 'opacity 0.15s', background: 'rgba(239,68,68,0.1)',
                    letterSpacing: 1,
                }}>
                    ABSENT
                </div>

                {/* Card Content */}
                <div style={{ padding: '40px 24px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                    {/* Avatar */}
                    <div style={{
                        width: 88, height: 88, borderRadius: '50%', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        background: 'linear-gradient(135deg, var(--primary), #4f46e5)',
                        boxShadow: '0 8px 24px rgba(26,35,126,0.3)',
                    }}>
                        <span style={{ fontSize: 28, fontWeight: 800, color: 'white' }}>{initials}</span>
                    </div>

                    {/* Name */}
                    <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', margin: 0, textAlign: 'center', letterSpacing: '-0.5px' }}>
                        {student.name}
                    </h2>

                    {/* Details */}
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            background: 'var(--bg-primary)', borderRadius: 12, padding: '12px 16px',
                        }}>
                            <span style={{ fontSize: 18 }}>🎯</span>
                            <div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Roll Number</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{student.rollNo || 'N/A'}</div>
                            </div>
                        </div>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            background: 'var(--bg-primary)', borderRadius: 12, padding: '12px 16px',
                        }}>
                            <span style={{ fontSize: 18 }}>📖</span>
                            <div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Class</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{student.class}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Color glow overlay */}
                <div style={{
                    pointerEvents: 'none', position: 'absolute', inset: 0, borderRadius: 24,
                    boxShadow: direction === 'present'
                        ? `inset 0 0 60px rgba(16,185,129,${swipeProgress * 0.25})`
                        : direction === 'absent'
                            ? `inset 0 0 60px rgba(239,68,68,${swipeProgress * 0.25})`
                            : 'none',
                    transition: 'box-shadow 0.15s',
                }} />
            </div>
        </div>
    );
}

// Action buttons bar
export function SwipeActions({ onPresent, onAbsent }: { onPresent: () => void; onAbsent: () => void }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40, marginTop: 24 }}>
            <button
                onClick={onAbsent}
                aria-label="Mark Absent"
                style={{
                    width: 64, height: 64, borderRadius: '50%',
                    border: '2px solid #ef4444', background: 'rgba(239,68,68,0.1)',
                    color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.2s', fontSize: 28, boxShadow: '0 4px 16px rgba(239,68,68,0.2)',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#ef4444'; (e.currentTarget as HTMLElement).style.color = 'white'; (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'; (e.currentTarget as HTMLElement).style.color = '#ef4444'; (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            >
                <MdClose size={32} />
            </button>
            <button
                onClick={onPresent}
                aria-label="Mark Present"
                style={{
                    width: 64, height: 64, borderRadius: '50%',
                    border: '2px solid #10b981', background: 'rgba(16,185,129,0.1)',
                    color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.2s', fontSize: 28, boxShadow: '0 4px 16px rgba(16,185,129,0.2)',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#10b981'; (e.currentTarget as HTMLElement).style.color = 'white'; (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.1)'; (e.currentTarget as HTMLElement).style.color = '#10b981'; (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            >
                <MdCheck size={32} />
            </button>
        </div>
    );
}
