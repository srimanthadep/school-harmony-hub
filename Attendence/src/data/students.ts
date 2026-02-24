import student1 from "@/assets/student1.jpg";
import student2 from "@/assets/student2.jpg";
import student3 from "@/assets/student3.jpg";
import student4 from "@/assets/student4.jpg";
import student5 from "@/assets/student5.jpg";
import student6 from "@/assets/student6.jpg";

export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  classSection: string;
  photo: string;
}

export type AttendanceStatus = "present" | "absent";

export interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
  timestamp: Date;
}

export const sampleStudents: Student[] = [
  { id: "1", name: "Arjun Mehta", rollNumber: "CS-2024-001", classSection: "CS-A", photo: student1 },
  { id: "2", name: "Priya Chen", rollNumber: "CS-2024-002", classSection: "CS-A", photo: student2 },
  { id: "3", name: "Rahul Sharma", rollNumber: "CS-2024-003", classSection: "CS-A", photo: student3 },
  { id: "4", name: "Ananya Reddy", rollNumber: "CS-2024-004", classSection: "CS-A", photo: student4 },
  { id: "5", name: "Vikram Patel", rollNumber: "CS-2024-005", classSection: "CS-A", photo: student5 },
  { id: "6", name: "Sneha Iyer", rollNumber: "CS-2024-006", classSection: "CS-A", photo: student6 },
];
