export interface StaffMember {
  id: string;
  name: string;
  staffId: string;
  role: string;
  department: string;
}

export type AttendanceStatus = "present" | "absent";

export interface StaffAttendanceRecord {
  staffId: string;
  status: AttendanceStatus;
  timestamp: Date;
}

export const sampleStaff: StaffMember[] = [
  { id: "s1", name: "Dr. Ramesh Kumar", staffId: "STF-001", role: "Principal", department: "Administration" },
  { id: "s2", name: "Mrs. Lakshmi Devi", staffId: "STF-002", role: "Teacher", department: "Mathematics" },
  { id: "s3", name: "Mr. Suresh Babu", staffId: "STF-003", role: "Teacher", department: "Science" },
  { id: "s4", name: "Ms. Kavitha Rao", staffId: "STF-004", role: "Teacher", department: "English" },
  { id: "s5", name: "Mr. Naresh Reddy", staffId: "STF-005", role: "Teacher", department: "Social Studies" },
  { id: "s6", name: "Mrs. Padma Srinivas", staffId: "STF-006", role: "Librarian", department: "Library" },
  { id: "s7", name: "Mr. Venkat Rao", staffId: "STF-007", role: "Admin Staff", department: "Office" },
  { id: "s8", name: "Mrs. Anitha Sharma", staffId: "STF-008", role: "Teacher", department: "Hindi" },
];
