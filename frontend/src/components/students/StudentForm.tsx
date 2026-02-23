import React from 'react';
import { MdPerson, MdClose } from 'react-icons/md';

interface StudentFormProps {
    show: boolean;
    editStudent: any;
    formData: any;
    formErrors: any;
    formLoading: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    setFormData: (data: any) => void;
    classes: string[];
}

export default function StudentForm({
    show,
    editStudent,
    formData,
    formErrors,
    formLoading,
    onClose,
    onSubmit,
    setFormData,
    classes
}: StudentFormProps) {
    if (!show) return null;

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal modal-lg">
                <div className="modal-header">
                    <h3><MdPerson /> {editStudent ? 'Edit Student' : 'Add New Student'}</h3>
                    <button className="btn-close" onClick={onClose}><MdClose /></button>
                </div>
                <form onSubmit={onSubmit}>
                    <div className="modal-body">
                        <div className="form-section-title">Personal Information</div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Full Name <span className="required">*</span></label>
                                <input className={`form-control ${formErrors.name ? 'error' : ''}`}
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Student full name" />
                                {formErrors.name && <p className="form-error">{formErrors.name}</p>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Gender</label>
                                <select className="form-control" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Date of Birth</label>
                                <input type="date" className="form-control" value={formData.dateOfBirth}
                                    onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Address</label>
                                <input className="form-control" value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="Residential address" />
                            </div>
                        </div>

                        <div className="form-section-title">Academic Details</div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Class <span className="required">*</span></label>
                                <select className="form-control" value={formData.class}
                                    onChange={e => setFormData({ ...formData, class: e.target.value })}>
                                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Roll Number <span className="required">*</span></label>
                                <input className={`form-control ${formErrors.rollNo ? 'error' : ''}`}
                                    value={formData.rollNo} onChange={e => setFormData({ ...formData, rollNo: e.target.value })}
                                    placeholder="Roll number" />
                                {formErrors.rollNo && <p className="form-error">{formErrors.rollNo}</p>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Academic Year</label>
                                <input className="form-control" value={formData.academicYear}
                                    onChange={e => setFormData({ ...formData, academicYear: e.target.value })} />
                            </div>
                        </div>

                        <div className="form-section-title">Parent / Guardian Details</div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Parent/Guardian Name <span className="required">*</span></label>
                                <input className={`form-control ${formErrors.parentName ? 'error' : ''}`}
                                    value={formData.parentName} onChange={e => setFormData({ ...formData, parentName: e.target.value })}
                                    placeholder="Father/Mother/Guardian name" />
                                {formErrors.parentName && <p className="form-error">{formErrors.parentName}</p>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Parent Phone <span className="required">*</span></label>
                                <input className={`form-control ${formErrors.parentPhone ? 'error' : ''}`}
                                    value={formData.parentPhone} onChange={e => setFormData({ ...formData, parentPhone: e.target.value })}
                                    placeholder="10-digit mobile number" />
                                {formErrors.parentPhone && <p className="form-error">{formErrors.parentPhone}</p>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Parent Email <small>(Optional)</small></label>
                                <input type="email" className="form-control" value={formData.parentEmail}
                                    onChange={e => setFormData({ ...formData, parentEmail: e.target.value })}
                                    placeholder="parent@email.com" />
                            </div>
                        </div>

                        <div className="form-section-title">Fee Details</div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Total Tuition Fee <span className="required">*</span></label>
                                <input type="number" className={`form-control ${formErrors.totalFee ? 'error' : ''}`}
                                    value={formData.totalFee} onChange={e => setFormData({ ...formData, totalFee: e.target.value })}
                                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                    placeholder="Annual tuition fee" min="0" />
                                {formErrors.totalFee && <p className="form-error">{formErrors.totalFee}</p>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Total Book's Fee <span className="required">*</span></label>
                                <input type="number" className={`form-control ${formErrors.totalBookFee ? 'error' : ''}`}
                                    value={formData.totalBookFee} onChange={e => setFormData({ ...formData, totalBookFee: e.target.value })}
                                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                    placeholder="Annual book's fee" min="0" />
                                {formErrors.totalBookFee && <p className="form-error">{formErrors.totalBookFee}</p>}
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={formLoading}>
                            {formLoading ? 'Saving...' : editStudent ? 'Update Student' : 'Add Student'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
