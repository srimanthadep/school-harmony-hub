import React from 'react';
import { MdPerson, MdClose } from 'react-icons/md';
import { Staff } from '../../types';

interface StaffFormProps {
    show: boolean;
    editStaff: Staff | null;
    formData: any;
    formErrors: any;
    formLoading: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    setFormData: (data: any) => void;
    roles: string[];
    roleDisplay: (r: string) => string;
}

export default function StaffForm({
    show,
    editStaff,
    formData,
    formErrors,
    formLoading,
    onClose,
    onSubmit,
    setFormData,
    roles,
    roleDisplay
}: StaffFormProps) {
    if (!show) return null;

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal modal-lg">
                <div className="modal-header">
                    <h3><MdPerson /> {editStaff ? 'Edit Staff' : 'Add New Staff'}</h3>
                    <button className="btn-close" onClick={onClose}><MdClose /></button>
                </div>
                <form onSubmit={onSubmit}>
                    <div className="modal-body">
                        <div className="form-section-title">Personal Information</div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Full Name <span className="required">*</span></label>
                                <input className={`form-control ${formErrors.name ? 'error' : ''}`}
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                {formErrors.name && <p className="form-error">{formErrors.name}</p>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone <span className="required">*</span></label>
                                <input className={`form-control ${formErrors.phone ? 'error' : ''}`}
                                    value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                {formErrors.phone && <p className="form-error">{formErrors.phone}</p>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Gender</label>
                                <select className="form-control" value={formData.gender}
                                    onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Address</label>
                                <input className="form-control" value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })} />
                            </div>
                        </div>

                        <div className="form-section-title">Professional Details</div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Role <span className="required">*</span></label>
                                <select className="form-control" value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                    {roles.map(r => <option key={r} value={r}>{roleDisplay(r)}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Subject (for teachers)</label>
                                <input className="form-control" value={formData.subject}
                                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                    placeholder="e.g., Mathematics" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Qualification</label>
                                <input className="form-control" value={formData.qualification}
                                    onChange={e => setFormData({ ...formData, qualification: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Experience (years)</label>
                                <input type="number" className="form-control" value={formData.experience}
                                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                    onChange={e => setFormData({ ...formData, experience: e.target.value })} min="0" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Joining Date <span className="required">*</span></label>
                                <input type="date" className={`form-control ${formErrors.joiningDate ? 'error' : ''}`}
                                    value={formData.joiningDate}
                                    onChange={e => setFormData({ ...formData, joiningDate: e.target.value })} />
                                {formErrors.joiningDate && <p className="form-error">{formErrors.joiningDate}</p>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Academic Year</label>
                                <input className="form-control" value={formData.academicYear}
                                    onChange={e => setFormData({ ...formData, academicYear: e.target.value })} />
                            </div>
                        </div>

                        <div className="form-section-title">Salary & Bank Details</div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Monthly Salary (₹) <span className="required">*</span></label>
                                <input type="number" className={`form-control ${formErrors.monthlySalary ? 'error' : ''}`}
                                    value={formData.monthlySalary}
                                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                    onChange={e => setFormData({ ...formData, monthlySalary: e.target.value })} min="0" />
                                {formErrors.monthlySalary && <p className="form-error">{formErrors.monthlySalary}</p>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Bank Account No</label>
                                <input className="form-control" value={formData.bankAccount}
                                    onChange={e => setFormData({ ...formData, bankAccount: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Bank Name</label>
                                <input className="form-control" value={formData.bankName}
                                    onChange={e => setFormData({ ...formData, bankName: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">IFSC Code</label>
                                <input className="form-control" value={formData.ifscCode}
                                    onChange={e => setFormData({ ...formData, ifscCode: e.target.value })} />
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={formLoading}>
                            {formLoading ? 'Saving...' : editStaff ? 'Update Staff' : 'Add Staff'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
