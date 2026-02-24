import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdUndo, MdSave, MdFilterList } from 'react-icons/md';
import API from '../utils/api';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { useAttendance, AttendanceStudent } from '../hooks/useAttendance';
import SwipeCard, { SwipeActions } from '../components/attendance/SwipeCard';
import AttendanceSummary from '../components/attendance/AttendanceSummary';
import { getCurrentAcademicYear } from '../utils/academicYear';

const CLASSES = ['All', 'Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];

export default function AttendancePage() {
    const [selectedClass, setSelectedClass] = useState('1st');
    const [submitting, setSubmitting] = useState(false);
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

    const students: AttendanceStudent[] = (data?.students || []).map((s: any) => ({
        _id: s._id,
        name: s.name,
        rollNo: s.rollNo || s.staffId || '',
        class: s.class || '',
        gender: s.gender || 'male',
    }));

    const {
        currentStudent,
        currentIndex,
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

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ maxWidth: 600, margin: '0 auto' }}
        >
            {/* Page Header */}
            <div className="card-header" style={{ marginBottom: 24, padding: 0, border: 'none', background: 'transparent' }}>
                <div>
                    <h1 style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.5px' }}>
                        📋 Attendance
                    </h1>
                    <p style={{ color: '#64748b', fontSize: 13 }}>
                        {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                {isComplete && records.length > 0 && (
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
        </motion.div>
    );
}
