/**
 * Fee management utility functions for School Harmony Hub.
 */

export type PaymentStatus = "paid" | "partial" | "unpaid";

/**
 * Compute tuition fee payment status from total due and amount paid.
 */
export function computePaymentStatus(totalFee: number, totalPaid: number): PaymentStatus {
  if (totalFee <= 0) return "unpaid";
  if (totalPaid >= totalFee) return "paid";
  if (totalPaid > 0) return "partial";
  return "unpaid";
}

/**
 * Compute pending amount (never negative).
 */
export function computePendingAmount(totalFee: number, totalPaid: number): number {
  return Math.max(0, totalFee - totalPaid);
}

/**
 * Compute collection rate as a percentage (0-100).
 */
export function computeCollectionRate(totalDue: number, totalCollected: number): number {
  if (totalDue <= 0) return 0;
  return Math.min(100, Math.round((totalCollected / totalDue) * 100));
}

/**
 * Generate a receipt/slip number using a prefix and sequence counter.
 */
export function generateReceiptNumber(prefix: string, lastNo: number): string {
  return `${prefix}${String(lastNo + 1).padStart(6, "0")}`;
}

const CLASS_ORDER = [
  "Nursery", "LKG", "UKG",
  "1st", "2nd", "3rd", "4th", "5th", "6th",
  "7th", "8th", "9th", "10th",
];

/**
 * Get the next class in promotion order. Returns null if already at the last class.
 */
export function getNextClass(currentClass: string): string | null {
  const idx = CLASS_ORDER.indexOf(currentClass);
  if (idx < 0 || idx >= CLASS_ORDER.length - 1) return null;
  return CLASS_ORDER[idx + 1];
}

/**
 * Check whether a class is the final (graduating) class.
 */
export function isGraduatingClass(cls: string): boolean {
  return cls === CLASS_ORDER[CLASS_ORDER.length - 1];
}
