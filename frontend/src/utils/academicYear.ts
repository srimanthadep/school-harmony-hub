/**
 * Auto-detect the current academic year based on the current date.
 * Academic year starts in April. E.g., April 2025 → "2025-26", Feb 2026 → "2025-26"
 */
export function getCurrentAcademicYear(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed (0=Jan, 3=Apr)
    if (month >= 3) {
        // April onwards → current year - next year
        return `${year}-${String(year + 1).slice(2)}`;
    }
    // Jan-March → previous year - current year
    return `${year - 1}-${String(year).slice(2)}`;
}

/**
 * Generate a list of academic years around the current one.
 * Returns 3 past + current + 2 future years.
 */
export function getAcademicYearOptions(): string[] {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const baseYear = month >= 3 ? year : year - 1;
    const years: string[] = [];
    for (let i = -3; i <= 2; i++) {
        const y = baseYear + i;
        years.push(`${y}-${String(y + 1).slice(2)}`);
    }
    return years;
}

/**
 * Get current month label, e.g. "February 2026"
 */
export function getCurrentMonthLabel(): string {
    return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
