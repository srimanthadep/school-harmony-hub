/**
 * Shared constants for School Harmony Hub.
 */

export const CLASS_ORDER = [
  "Nursery", "LKG", "UKG",
  "1st", "2nd", "3rd", "4th", "5th",
  "6th", "7th", "8th", "9th", "10th",
] as const;

export const SECTIONS = ["A", "B", "C", "D"] as const;

/** Academic years available for selection. Update annually or fetch from school_settings. */
export const ACADEMIC_YEARS = ["2023-24", "2024-25", "2025-26", "2026-27"] as const;
