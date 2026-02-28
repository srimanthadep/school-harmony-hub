import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const SCHOOL_NAME = 'Oxford School Chityala';
const SCHOOL_ADDRESS = 'Chityala, Nalgonda District, Telangana';
const SCHOOL_PHONE = '+91 98765 43210';

// PDF-safe currency format (jsPDF helvetica cannot render ₹ Unicode)
const pdfRs = (amount) => `Rs. ${Number(amount || 0).toLocaleString('en-IN')}`;

// Load logo as base64 for PDF embedding
async function getLogoBase64() {
    try {
        const response = await fetch('/logo.png');
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
}

// ── Format currency ──────────────────────────────────────────────────
export const formatCurrency = (amount) =>
    `₹${Number(amount || 0).toLocaleString('en-IN')}`;

// ── Format date ───────────────────────────────────────────────────────
export const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
};

// ── Fee Receipt PDF ──────────────────────────────────────────────────
export const generateFeeReceiptPDF = async (student, payment, settings = {}) => {
    const doc = new jsPDF({ format: 'a5', unit: 'mm' });
    // Fix #24: Use settings.schoolName like the export functions do, falling back to constant
    const schoolName = settings.schoolName || SCHOOL_NAME;
    const pageW = doc.internal.pageSize.getWidth();

    // Try load logo
    const logoBase64 = await getLogoBase64();

    // Header stripe
    doc.setFillColor(26, 35, 126);
    doc.rect(0, 0, pageW, 34, 'F');

    // Logo in header (left side)
    if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', 4, 2, 28, 28);
    }

    // School name (centered, pushed right of logo)
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(schoolName, pageW / 2 + 8, 13, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(settings.schoolAddress || SCHOOL_ADDRESS, pageW / 2 + 8, 20, { align: 'center' });
    doc.text(`Tel: ${settings.schoolPhone || SCHOOL_PHONE} | ${settings.schoolEmail || ''}`, pageW / 2 + 8, 26, { align: 'center' });

    // Gold line below header
    doc.setDrawColor(249, 168, 37);
    doc.setLineWidth(1.5);
    doc.line(0, 34, pageW, 34);


    // Title
    doc.setTextColor(26, 35, 126);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('FEE RECEIPT', pageW / 2, 44, { align: 'center' });

    // Gold underline
    doc.setDrawColor(249, 168, 37);
    doc.setLineWidth(1);
    doc.line(40, 46, pageW - 40, 46);

    // Receipt meta
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Receipt No: ${payment.receiptNo || 'N/A'}`, 10, 54);
    doc.text(`Date: ${formatDate(payment.paymentDate)}`, pageW - 10, 54, { align: 'right' });
    doc.text(`Academic Year: ${settings.academicYear || '2024-25'}`, 10, 59);

    // Student info box
    doc.setFillColor(240, 242, 248);
    doc.roundedRect(8, 64, pageW - 16, 34, 3, 3, 'F');

    doc.setTextColor(26, 35, 126);
    doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text('STUDENT DETAILS', 12, 71);

    doc.setTextColor(50, 50, 50); doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${student.name}`, 12, 78);
    doc.text(`Class: ${student.class}`, 12, 84);
    doc.text(`Roll No: ${student.rollNo}`, 12, 90);
    doc.text(`Student ID: ${student.studentId}`, pageW / 2, 78);
    doc.text(`Parent: ${student.parentName}`, pageW / 2, 84);
    doc.text(`Phone: ${student.parentPhone}`, pageW / 2, 90);

    const isBook = payment.feeType === 'book';
    const totalAmountStr = isBook ? 'Total Library Fee' : 'Total Tuition Fee';
    const totalFeeAmt = isBook ? (student.totalBookFee || 0) : student.totalFee;
    const totalPaidAmt = isBook ? (student.totalBookPaid || 0) : student.totalPaid;
    const pendingAmt = isBook ? (student.pendingBookAmount || 0) : student.pendingAmount;

    // Fee details table — properly formatted amounts
    doc.autoTable({
        startY: 104,
        head: [['Description', 'Amount (Rs.)']],
        body: [
            [totalAmountStr, pdfRs(totalFeeAmt)],
            ['Amount Paid (This Receipt)', pdfRs(payment.amount)],
            ['Total Paid Till Date', pdfRs(totalPaidAmt)],
            ['Balance Remaining', pdfRs(pendingAmt)],
        ],
        headStyles: {
            fillColor: [26, 35, 126],
            textColor: [255, 255, 255],
            fontSize: 9,
            fontStyle: 'bold',
            halign: 'center'
        },
        bodyStyles: { fontSize: 10, cellPadding: { top: 4, bottom: 4, left: 5, right: 5 } },
        alternateRowStyles: { fillColor: [240, 245, 255] },
        columnStyles: {
            0: { cellWidth: 'auto', fontStyle: 'normal' },
            1: { cellWidth: 55, halign: 'right', fontStyle: 'bold', textColor: [26, 35, 126] }
        },
        margin: { left: 8, right: 8 },
        styles: { lineColor: [210, 220, 240], lineWidth: 0.2, font: 'helvetica' },
        didParseCell: (data) => {
            // Highlight Balance row
            if (data.row.index === 3) {
                data.cell.styles.textColor = data.column.index === 1
                    ? (pendingAmt <= 0 ? [67, 160, 71] : [229, 57, 53])
                    : [50, 50, 50];
                data.cell.styles.fontStyle = 'bold';
            }
        }
    });

    const finalY = doc.lastAutoTable.finalY + 6;

    // Payment mode
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(100, 100, 100);
    doc.text(`Payment Mode: ${(payment.paymentMode || 'cash').replace('_', ' ').toUpperCase()}`, 8, finalY + 6);
    if (payment.remarks) doc.text(`Fee Receipt Change: ${payment.remarks}`, 8, finalY + 11);

    // Status badge
    const status = pendingAmt <= 0 ? 'FULLY PAID' : 'PARTIAL PAYMENT';
    const statusColor = pendingAmt <= 0 ? [67, 160, 71] : [251, 140, 0];
    doc.setFillColor(...statusColor);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    const statusText = status;
    const statusW = doc.getTextWidth(statusText) + 8;
    doc.roundedRect(pageW - 8 - statusW, finalY + 2, statusW, 10, 2, 2, 'F');
    doc.text(statusText, pageW - 4 - statusW / 2, finalY + 8.5, { align: 'center' });

    // Signature
    doc.setTextColor(80, 80, 80); doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    const sigY = finalY + 28;
    doc.line(8, sigY, 55, sigY);
    doc.text('Cashier / Accountant', 8, sigY + 5);
    doc.line(pageW - 55, sigY, pageW - 8, sigY);
    doc.text('Principal', pageW - 55, sigY + 5);

    // Footer
    doc.setFillColor(240, 242, 248);
    const pageH = doc.internal.pageSize.getHeight();
    doc.rect(0, pageH - 12, pageW, 12, 'F');
    doc.setTextColor(100, 100, 100); doc.setFontSize(7);
    doc.text('This is a computer-generated receipt. No signature required if printed.', pageW / 2, pageH - 6, { align: 'center' });

    doc.save(`Fee_Receipt_${student.name}_${payment.receiptNo}.pdf`);
};

// ── Salary Slip PDF ──────────────────────────────────────────────────
export const generateSalarySlipPDF = async (staff, payment, settings = {}) => {
    const doc = new jsPDF({ format: 'a5', unit: 'mm' });
    // Fix #24: Use settings.schoolName like the export functions do, falling back to constant
    const schoolName = settings.schoolName || SCHOOL_NAME;
    const pageW = doc.internal.pageSize.getWidth();

    const logoBase64 = await getLogoBase64();

    // Header
    doc.setFillColor(26, 35, 126);
    doc.rect(0, 0, pageW, 34, 'F');

    if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', 4, 2, 28, 28);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
    doc.text(schoolName, pageW / 2 + 8, 13, { align: 'center' });

    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text(settings.schoolAddress || SCHOOL_ADDRESS, pageW / 2 + 8, 20, { align: 'center' });

    doc.setDrawColor(249, 168, 37); doc.setLineWidth(1.5);
    doc.line(0, 34, pageW, 34);

    doc.setTextColor(80, 80, 80); doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text(`Slip No: ${payment.slipNo || 'N/A'}`, 10, 50);
    doc.text(`Month: ${payment.month}`, pageW - 10, 50, { align: 'right' });
    doc.text(`Date: ${formatDate(payment.paymentDate)}`, 10, 55);

    // Staff info
    doc.setFillColor(240, 242, 248);
    doc.roundedRect(8, 62, pageW - 16, 34, 3, 3, 'F');

    doc.setTextColor(26, 35, 126); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text('EMPLOYEE DETAILS', 12, 69);

    doc.setTextColor(50, 50, 50); doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${staff.name}`, 12, 76);
    doc.text(`Designation: ${(staff.role || '').replace('_', ' ').toUpperCase()}`, 12, 82);
    doc.text(`Employee ID: ${staff.staffId}`, 12, 88);

    if (staff.subject) doc.text(`Subject: ${staff.subject}`, pageW / 2, 76);
    doc.text(`Joining Date: ${formatDate(staff.joiningDate)}`, pageW / 2, 82);
    if (staff.bankAccount) doc.text(`Bank A/C: ${staff.bankAccount}`, pageW / 2, 88);

    // Salary table
    const baseAmt = payment.baseAmount || payment.amount;
    const tableBody = [
        ['Monthly Gross Salary', pdfRs(staff.monthlySalary)]
    ];

    if (payment.baseAmount && payment.cuttings > 0) {
        tableBody.push(['Base Amount', pdfRs(payment.baseAmount)]);
        tableBody.push(['Cuttings/Deductions', pdfRs(payment.cuttings)]);
        tableBody.push(['Net Amount Paid', pdfRs(payment.amount)]);
    } else {
        tableBody.push(['Amount Paid', pdfRs(payment.amount)]);
    }

    if (baseAmt < staff.monthlySalary) {
        tableBody.push(['Balance (if partial)', pdfRs(staff.monthlySalary - baseAmt)]);
    }

    doc.autoTable({
        startY: 102,
        head: [['Salary Component', 'Amount (Rs.)']],
        body: tableBody,
        headStyles: { fillColor: [26, 35, 126], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold', halign: 'center' },
        bodyStyles: { fontSize: 10, cellPadding: { top: 4, bottom: 4, left: 5, right: 5 } },
        alternateRowStyles: { fillColor: [240, 245, 255] },
        columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 55, halign: 'right', fontStyle: 'bold', textColor: [26, 35, 126] }
        },
        margin: { left: 8, right: 8 },
        styles: { lineColor: [210, 220, 240], lineWidth: 0.2 }
    });

    const finalY = doc.lastAutoTable.finalY + 8;

    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(100, 100, 100);
    doc.text(`Payment Mode: ${(payment.paymentMode || 'bank_transfer').replace('_', ' ').toUpperCase()}`, 8, finalY);
    if (payment.remarks) doc.text(`Remarks: ${payment.remarks}`, 8, finalY + 6);

    // Signatures
    const sigY = finalY + 22;
    doc.line(8, sigY, 55, sigY); doc.text('Employee Signature', 8, sigY + 5);
    doc.line(pageW - 55, sigY, pageW - 8, sigY); doc.text('Authorised Signatory', pageW - 55, sigY + 5);

    doc.save(`Salary_Slip_${staff.name}_${payment.month.replace(' ', '_')}.pdf`);
};

// ── Export Students Excel ────────────────────────────────────────────
export const exportStudentsExcel = (students) => {
    const data = students.map(s => {
        const row = {
            'Student ID': s.studentId,
            'Name': s.name,
            'Class': s.class,
            'Roll No': s.rollNo,
            'Gender': s.gender,
            'Parent Name': s.parentName,
            'Parent Phone': s.parentPhone,
            'Parent Email': s.parentEmail || '',
            'Total Fee': s.totalFee,
            'Total Paid': s.totalPaid,
            'Pending Amount': s.pendingAmount,
            'Payment Status': (s.paymentStatus || 'unpaid').toUpperCase(),
            'Admission Date': formatDate(s.admissionDate)
        };

        if (s.feePayments && s.feePayments.length > 0) {
            const sortedPayments = [...s.feePayments].sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

            row['Payment History (Concatenated)'] = sortedPayments
                .map(p => `₹${p.amount} (${p.receiptNo})`)
                .join('; ');

            sortedPayments.slice(0, 15).forEach((p, idx) => {
                row[`Payment ${idx + 1}`] = `₹${p.amount} on ${formatDate(p.paymentDate)} [Ref: ${p.receiptNo}]`;
            });
        }

        return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');

    const cols = [
        { wch: 12 }, { wch: 22 }, { wch: 8 }, { wch: 8 }, { wch: 8 },
        { wch: 22 }, { wch: 14 }, { wch: 22 }, { wch: 12 }, { wch: 12 },
        { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 40 }
    ];
    for (let i = 0; i < 15; i++) cols.push({ wch: 35 });
    ws['!cols'] = cols;

    XLSX.writeFile(wb, `Students_Export_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.xlsx`);
};

// ── Export Students PDF ──────────────────────────────────────────────
export const exportStudentsPDF = (students, settings = {}) => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const schoolName = settings.schoolName || SCHOOL_NAME;
    const pageW = doc.internal.pageSize.getWidth();

    doc.setFillColor(26, 35, 126);
    doc.rect(0, 0, pageW, 22, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
    doc.text(schoolName, pageW / 2, 10, { align: 'center' });
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text('Student Directory Report', pageW / 2, 17, { align: 'center' });

    doc.setTextColor(50, 50, 50); doc.setFontSize(8);
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, pageW - 10, 28, { align: 'right' });
    doc.text(`Total Students: ${students.length}`, 10, 28);

    doc.autoTable({
        startY: 32,
        head: [['ID', 'Name', 'Class', 'Roll', 'Parent', 'Phone', 'Paid', 'Pending', 'Recent Payments']],
        body: students.map(s => {
            const lastThree = (s.feePayments || [])
                .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
                .slice(0, 3)
                .map(p => `Rs.${p.amount} (${formatDate(p.paymentDate)})`)
                .join('\n');

            return [
                s.studentId, s.name, s.class, s.rollNo,
                s.parentName, s.parentPhone,
                `Rs.${Number(s.totalPaid).toLocaleString('en-IN')}`,
                `Rs.${Number(s.pendingAmount).toLocaleString('en-IN')}`,
                lastThree || '-'
            ];
        }),
        headStyles: { fillColor: [26, 35, 126], textColor: 255, fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7.5, cellPadding: 2 },
        alternateRowStyles: { fillColor: [248, 250, 255] },
        margin: { left: 8, right: 8 },
        styles: { overflow: 'linebreak' },
        columnStyles: {
            8: { cellWidth: 50, fontSize: 7 }
        }
    });

    doc.save(`Student_Report_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.pdf`);
};

// ── Export Staff Excel ───────────────────────────────────────────────
export const exportStaffExcel = (staff) => {
    const data = staff.map(s => {
        const row = {
            'Staff ID': s.staffId,
            'Name': s.name,
            'Role': (s.role || '').replace('_', ' ').toUpperCase(),
            'Phone': s.phone,
            'Monthly Salary': s.monthlySalary,
            'Total Paid': s.totalSalaryPaid || 0,
            'Academic Year': s.academicYear,
            'Joining Date': formatDate(s.joiningDate),
            'Status': s.isActive ? 'Active' : 'Inactive'
        };

        // Add detailed payment history
        if (s.salaryPayments && s.salaryPayments.length > 0) {
            const sortedPayments = [...s.salaryPayments].sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

            // Add a summary string
            row['Payment History (Concatenated)'] = sortedPayments
                .map(p => `${p.month}: ₹${p.amount}`)
                .join('; ');

            // Add last 12 payments as separate columns
            sortedPayments.slice(0, 12).forEach((p, idx) => {
                row[`Payment ${idx + 1}`] = `${p.month}: ₹${p.amount} (${formatDate(p.paymentDate)})`;
            });
        }

        return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Staff');

    // Adjust column widths
    const cols = [
        { wch: 12 }, { wch: 22 }, { wch: 18 }, { wch: 14 }, { wch: 14 },
        { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 40 }
    ];
    // Add widths for dynamic payment columns
    for (let i = 0; i < 12; i++) cols.push({ wch: 30 });
    ws['!cols'] = cols;

    XLSX.writeFile(wb, `Staff_Export_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.xlsx`);
};

// ── Export Staff PDF ─────────────────────────────────────────────────
export const exportStaffPDF = (staff, settings = {}) => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const schoolName = settings.schoolName || SCHOOL_NAME;
    const pageW = doc.internal.pageSize.getWidth();

    doc.setFillColor(26, 35, 126);
    doc.rect(0, 0, pageW, 22, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
    doc.text(schoolName, pageW / 2, 10, { align: 'center' });
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text('Staff Directory Report', pageW / 2, 17, { align: 'center' });

    doc.setTextColor(50, 50, 50); doc.setFontSize(8);
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, pageW - 10, 28, { align: 'right' });
    doc.text(`Total Staff: ${staff.length}`, 10, 28);

    doc.autoTable({
        startY: 32,
        head: [['ID', 'Name', 'Role', 'Phone', 'Monthly Sal', 'Total Paid', 'Session', 'Last 3 Payments']],
        body: staff.map(s => {
            const lastThreeSalaries = (s.salaryPayments || [])
                .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
                .slice(0, 3)
                .map(p => `${p.month}: Rs.${p.amount}`)
                .join('\n');

            return [
                s.staffId, s.name, (s.role || '').toUpperCase(), s.phone,
                `Rs.${Number(s.monthlySalary).toLocaleString('en-IN')}`,
                `Rs.${Number(s.totalSalaryPaid).toLocaleString('en-IN')}`,
                s.academicYear,
                lastThreeSalaries || '-'
            ];
        }),
        headStyles: { fillColor: [26, 35, 126], textColor: 255, fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7.5, cellPadding: 2 },
        alternateRowStyles: { fillColor: [248, 250, 255] },
        margin: { left: 8, right: 8 },
        styles: { overflow: 'linebreak' },
        columnStyles: {
            7: { cellWidth: 45, fontSize: 7 }
        }
    });

    doc.save(`Staff_Report_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.pdf`);
};

