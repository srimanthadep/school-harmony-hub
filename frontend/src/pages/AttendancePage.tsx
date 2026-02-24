import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MdUndo, MdSave, MdFilterList, MdCheck, MdClose, MdDownload } from 'react-icons/md';
import API from '../utils/api';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { useAttendance, AttendanceStudent } from '../hooks/useAttendance';
import SwipeCard, { SwipeActions } from '../components/attendance/SwipeCard';
import AttendanceSummary from '../components/attendance/AttendanceSummary';
import { getCurrentAcademicYear } from '../utils/academicYear';

const CLASSES = ['All', 'Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];

export default function AttendancePage() {
    const [mode, setMode] = useState<'mark' | 'view'>('mark');
    const [selectedClass, setSelectedClass] = useState('1st');
    const [submitting, setSubmitting] = useState(false);
    const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);
    const [viewClass, setViewClass] = useState('All');
    const today = new Date().toISOString().split('T')[0];
    const academicYear = getCurrentAcademicYear();

    const { data, isLoading } = useQuery({
        queryKey: ['students-for-attendance', selectedClass],
        queryFn: async () => {
            const params: any = { limit: 200, academicYear };
            if (selectedClass !== 'All') params.class = selectedClass;
            const res = await API.get('/students', { params });
            return res.data;
        },
    });

    // Query for all students (used in view mode to resolve names)
    const { data: allStudentsData } = useQuery({
        queryKey: ['students-all', academicYear],
        queryFn: async () => {
            const res = await API.get('/students', { params: { limit: 500, academicYear } });
            return res.data;
        },
        enabled: mode === 'view',
    });

    // Query for attendance records for the selected view date
    const { data: viewAttendanceData, isLoading: viewLoading, error: viewError } = useQuery({
        queryKey: ['view-attendance', viewDate],
        queryFn: async () => {
            const res = await API.get(`/attendance/${viewDate}`);
            return res.data;
        },
        enabled: mode === 'view',
        retry: false,
    });

    const students: AttendanceStudent[] = (data?.students || []).map((s: any) => ({
        _id: s._id,
        name: s.name,
        rollNo: s.rollNo || s.staffId || '',
        class: s.class || '',
        gender: s.gender || 'male',
    }));

    const {
        currentStudent,
        isComplete,
        totalStudents,
        markedCount,
        presentCount,
        absentCount,
        records,
        markAttendance,
        undo,
        reset,
        exportCSV,
    } = useAttendance(students);

    const handleSubmit = async () => {
        if (records.length === 0) return;
        setSubmitting(true);
        try {
            await API.post('/attendance', {
                date: today,
                class: selectedClass,
                academicYear,
                records: records.map((r) => ({
                    studentId: r.studentId,
                    status: r.status,
                    timestamp: r.timestamp.toISOString(),
                })),
            });
            toast.success(`Attendance saved for ${selectedClass}!`);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to save attendance');
        } finally {
            setSubmitting(false);
        }
    };

    const allStudents: AttendanceStudent[] = (allStudentsData?.students || []).map((s: any) => ({
        _id: s._id,
        name: s.name,
        rollNo: s.rollNo || s.staffId || '',
        class: s.class || '',
        gender: s.gender || 'male',
    }));

    const viewRecords: { studentId: string; status: 'present' | 'absent' }[] =
        viewAttendanceData?.attendance?.records || [];

    const filteredViewRecords = viewClass === 'All'
        ? viewRecords
        : viewRecords.filter((record) => {
            const student = allStudents.find((s) => s._id === record.studentId);
            return student?.class === viewClass;
        });

    const viewPresent = filteredViewRecords.filter((r) => r.status === 'present').length;
    const viewAbsent = filteredViewRecords.filter((r) => r.status === 'absent').length;

    const exportViewCSV = () => {
        const escapeCSV = (value: string) => `"${value.replace(/"/g, '""')}"`;
        const header = 'Roll No,Name,Class,Status\n';
        const rows = filteredViewRecords
            .map((record) => {
                const student = allStudents.find((s) => s._id === record.studentId);
                const name = student?.name || record.studentId;
                return [
                    escapeCSV(student?.rollNo || ''),
                    escapeCSV(name),
                    escapeCSV(student?.class || ''),
                    escapeCSV(record.status),
                ].join(',');
            })
            .join('\n');
        const blob = new Blob([header + rows], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance-${viewDate}${viewClass !== 'All' ? `-${viewClass}` : ''}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ maxWidth: 600, margin: '0 auto' }}
        >
            {/* Page Header */}
            <div className="card-header" style={{ marginBottom: 16, padding: 0, border: 'none', background: 'transparent' }}>
                <div>
                    <h1 style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.5px' }}>
                        📋 Attendance
                    </h1>
                    <p style={{ color: '#64748b', fontSize: 13 }}>
                        {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                {mode === 'mark' && isComplete && records.length > 0 && (
                    <button
                        className="btn btn-primary"
                        onClick={handleSubmit}
                        disabled={submitting}
                        style={{ gap: 8, borderRadius: 12 }}
                    >
                        <MdSave /> {submitting ? 'Saving…' : 'Save to Server'}
                    </button>
                )}
            </div>

            {/* Mode Toggle */}
            <div className="card glass" style={{ padding: '8px', marginBottom: 24, display: 'flex', gap: 4 }}>
                <button
                    onClick={() => setMode('mark')}
                    style={{
                        flex: 1, padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                        border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                        background: mode === 'mark' ? 'var(--primary)' : 'transparent',
                        color: mode === 'mark' ? 'white' : 'var(--text-muted)',
                    }}
                >
                    ✏️ Mark Attendance
                </button>
                <button
                    onClick={() => setMode('view')}
                    style={{
                        flex: 1, padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                        border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                        background: mode === 'view' ? 'var(--primary)' : 'transparent',
                        color: mode === 'view' ? 'white' : 'var(--text-muted)',
                    }}
                >
                    👁️ View Attendance
                </button>
            </div>

            {/* View Attendance Mode */}
            {mode === 'view' && (
                <div>
                    {/* Date Picker */}
                    <div className="card glass" style={{ padding: '16px 20px', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>📅 Date:</span>
                            <input
                                type="date"
                                value={viewDate}
                                max={today}
                                onChange={(e) => setViewDate(e.target.value)}
                                style={{
                                    border: '1px solid var(--border-light)', borderRadius: 10,
                                    padding: '8px 12px', fontSize: 13, fontWeight: 600,
                                    background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer',
                                }}
                            />
                        </div>
                    </div>

                    {/* Class Filter */}
                    <div className="card glass" style={{ padding: '16px 20px', marginBottom: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <MdFilterList style={{ color: 'var(--text-muted)', fontSize: 18 }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Class:</span>
                            {CLASSES.map((cls) => (
                                <button
                                    key={cls}
                                    onClick={() => setViewClass(cls)}
                                    style={{
                                        padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
                                        background: viewClass === cls ? 'var(--primary)' : 'var(--bg-primary)',
                                        color: viewClass === cls ? 'white' : 'var(--text-secondary)',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {cls}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Attendance Records */}
                    {viewLoading ? (
                        <div className="loading-spinner"><div className="spinner" /></div>
                    ) : viewError || !viewAttendanceData?.success ? (
                        <div className="card glass">
                            <div className="empty-state">
                                <div className="empty-state-icon">📭</div>
                                <h3>No Records Found</h3>
                                <p>No attendance was saved for <strong>{viewDate}</strong>.</p>
                            </div>
                        </div>
                    ) : (
                        <div>
                            {/* Summary Stats */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                                <div style={{
                                    background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                                    borderRadius: 16, padding: 20, textAlign: 'center',
                                }}>
                                    <div style={{ fontSize: 36, fontWeight: 900, color: '#10b981' }}>{viewPresent}</div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: '#10b981', opacity: 0.8 }}>Present</div>
                                </div>
                                <div style={{
                                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                                    borderRadius: 16, padding: 20, textAlign: 'center',
                                }}>
                                    <div style={{ fontSize: 36, fontWeight: 900, color: '#ef4444' }}>{viewAbsent}</div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: '#ef4444', opacity: 0.8 }}>Absent</div>
                                </div>
                            </div>

                            {/* Download Button */}
                            <div style={{ marginBottom: 16 }}>
                                <button
                                    onClick={exportViewCSV}
                                    className="btn btn-success"
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, padding: '12px 20px' }}
                                >
                                    <MdDownload size={18} /> Download CSV{viewClass !== 'All' ? ` (${viewClass})` : ''}
                                </button>
                            </div>

                            {/* Student List */}
                            <div style={{ borderRadius: 16, background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
                                {filteredViewRecords.map((record) => {
                                    const student = allStudents.find((s) => s._id === record.studentId);
                                    const name = student?.name || record.studentId;
                                    const initials = name.split(' ').filter((n: string) => n).map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
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
                                                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {name}
                                                </div>
                                                {student && (
                                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                                        {student.rollNo && `${student.rollNo} • `}{student.class}
                                                    </div>
                                                )}
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
                                {filteredViewRecords.length === 0 && (
                                    <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                                        No records for {viewClass === 'All' ? 'this date' : `class ${viewClass}`}.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Mark Attendance Mode */}
            {mode === 'mark' && (<>
            {/* Class Filter */}
            <div className="card glass" style={{ padding: '16px 20px', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <MdFilterList style={{ color: 'var(--text-muted)', fontSize: 18 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Class:</span>
                    {CLASSES.map((cls) => (
                        <button
                            key={cls}
                            onClick={() => { setSelectedClass(cls); reset(); }}
                            style={{
                                padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
                                background: selectedClass === cls ? 'var(--primary)' : 'var(--bg-primary)',
                                color: selectedClass === cls ? 'white' : 'var(--text-secondary)',
                                transition: 'all 0.2s',
                            }}
                        >
                            {cls}
                        </button>
                    ))}
                </div>
            </div>

            {/* Loading State */}
            {isLoading ? (
                <div className="loading-spinner"><div className="spinner" /></div>
            ) : totalStudents === 0 ? (
                <div className="card glass">
                    <div className="empty-state">
                        <div className="empty-state-icon">📋</div>
                        <h3>No Students Found</h3>
                        <p>No students are enrolled in <strong>{selectedClass}</strong> for {academicYear}.</p>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {!isComplete ? (
                        <>
                            {/* Progress */}
                            <div style={{ width: '100%', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                                    <span>{markedCount} of {totalStudents} students</span>
                                    <span>{totalStudents > 0 ? Math.round((markedCount / totalStudents) * 100) : 0}%</span>
                                </div>
                                <div style={{ height: 8, borderRadius: 99, background: 'var(--bg-primary)', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%', borderRadius: 99,
                                        background: 'linear-gradient(90deg, var(--primary), #4f46e5)',
                                        width: `${totalStudents > 0 ? (markedCount / totalStudents) * 100 : 0}%`,
                                        transition: 'width 0.3s ease',
                                    }} />
                                </div>
                            </div>

                            {/* Swipe Area */}
                            <div style={{
                                position: 'relative', height: 400, width: '100%', maxWidth: 360,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8,
                            }}>
                                {currentStudent && (
                                    <SwipeCard
                                        key={currentStudent._id}
                                        student={currentStudent}
                                        onSwipe={markAttendance}
                                    />
                                )}
                            </div>

                            {/* Action Buttons */}
                            <SwipeActions
                                onPresent={() => markAttendance('present')}
                                onAbsent={() => markAttendance('absent')}
                            />

                            {/* Undo */}
                            {markedCount > 0 && (
                                <button
                                    onClick={undo}
                                    style={{
                                        marginTop: 16, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
                                        fontWeight: 600, color: 'var(--text-muted)', background: 'none', border: 'none',
                                        cursor: 'pointer', transition: 'color 0.2s',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                                >
                                    <MdUndo size={16} /> Undo last
                                </button>
                            )}

                            {/* Hint */}
                            <p style={{ marginTop: 20, fontSize: 12, color: 'var(--text-muted)', opacity: 0.6, textAlign: 'center' }}>
                                Swipe right for Present · Swipe left for Absent
                            </p>
                        </>
                    ) : (
                        <AttendanceSummary
                            records={records}
                            students={students}
                            presentCount={presentCount}
                            absentCount={absentCount}
                            onExportCSV={exportCSV}
                            onReset={reset}
                        />
                    )}
                </div>
            )}
            </>)}
        </motion.div>
    );
}
