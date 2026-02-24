import React from 'react';
import { MdCheck, MdClose, MdDownload, MdRestartAlt } from 'react-icons/md';
import { AttendanceRecord, AttendanceStudent } from '../../hooks/useAttendance';

interface AttendanceSummaryProps {
    records: AttendanceRecord[];
    students: AttendanceStudent[];
    presentCount: number;
    absentCount: number;
    onExportCSV: () => void;
    onReset: () => void;
}

export default function AttendanceSummary({
    records,
    students,
    presentCount,
    absentCount,
    onExportCSV,
    onReset,
}: AttendanceSummaryProps) {
    const total = records.length;
    const presentPct = total > 0 ? Math.round((presentCount / total) * 100) : 0;

    return (
        <div style={{ width: '100%', maxWidth: 420, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24, animation: 'slideUp 0.3s ease' }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, textAlign: 'center', color: 'var(--text-primary)', margin: 0 }}>
                Attendance Complete ✅
            </h2>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{
                    background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                    borderRadius: 16, padding: 20, textAlign: 'center',
                }}>
                    <div style={{ fontSize: 36, fontWeight: 900, color: '#10b981' }}>{presentCount}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#10b981', opacity: 0.8 }}>Present</div>
                </div>
                <div style={{
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: 16, padding: 20, textAlign: 'center',
                }}>
                    <div style={{ fontSize: 36, fontWeight: 900, color: '#ef4444' }}>{absentCount}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#ef4444', opacity: 0.8 }}>Absent</div>
                </div>
            </div>

            {/* Progress bar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                    <span>Attendance Rate</span>
                    <span>{presentPct}%</span>
                </div>
                <div style={{ height: 10, borderRadius: 99, background: 'var(--bg-primary)', overflow: 'hidden' }}>
                    <div style={{
                        height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, #10b981, #34d399)',
                        width: `${presentPct}%`, transition: 'width 0.6s ease',
                    }} />
                </div>
            </div>

            {/* Student list */}
            <div style={{ borderRadius: 16, background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
                <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                    {records.map((record) => {
                        const student = students.find((s) => s._id === record.studentId);
                        if (!student) return null;
                        const initials = student.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
                        return (
                            <div key={record.studentId} style={{
                                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                                borderBottom: '1px solid var(--border-light)',
                            }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                                    background: 'linear-gradient(135deg, var(--primary), #4f46e5)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 12, fontWeight: 800, color: 'white',
                                }}>
                                    {initials}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.name}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{student.rollNo} • {student.class}</div>
                                </div>
                                {record.status === 'present' ? (
                                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                                        <MdCheck size={16} />
                                    </div>
                                ) : (
                                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                                        <MdClose size={16} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 12 }}>
                <button
                    onClick={onExportCSV}
                    className="btn btn-success"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, padding: '14px 20px' }}
                >
                    <MdDownload size={18} /> Export CSV
                </button>
                <button
                    onClick={onReset}
                    className="btn btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, padding: '14px 20px' }}
                >
                    <MdRestartAlt size={18} /> Redo
                </button>
            </div>
        </div>
    );
}
