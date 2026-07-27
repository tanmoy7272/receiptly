/**
 * ============================================================================
 * Ask Receiptly Date Filters Utility
 * ============================================================================
 * Purpose: Converts period enums (TODAY, THIS_WEEK, THIS_MONTH, LAST_MONTH,
 *          THIS_YEAR, LAST_YEAR, ALL_TIME) into normalized startDate and endDate.
 * ============================================================================
 */
import { PERIOD_ENUMS } from '../intent/supportedIntents.js';

/**
 * Returns startDate and endDate range for a given period enum
 * @param {string} period - PERIOD_ENUMS value
 * @returns {{ startDate: Date|null, endDate: Date|null }}
 */
export const getDateRangeForPeriod = (period) => {
  if (!period) return { startDate: null, endDate: null };

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();
  const pStr = String(period).trim().toUpperCase();

  switch (pStr) {
    case PERIOD_ENUMS.TODAY: {
      const startDate = new Date(year, month, date, 0, 0, 0, 0);
      const endDate = new Date(year, month, date, 23, 59, 59, 999);
      return { startDate, endDate };
    }
    case PERIOD_ENUMS.THIS_WEEK: {
      const dayOfWeek = now.getDay();
      const startDate = new Date(year, month, date - dayOfWeek, 0, 0, 0, 0);
      const endDate = new Date(year, month, date + (6 - dayOfWeek), 23, 59, 59, 999);
      return { startDate, endDate };
    }
    case PERIOD_ENUMS.THIS_MONTH: {
      const startDate = new Date(year, month, 1, 0, 0, 0, 0);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
      return { startDate, endDate };
    }
    case PERIOD_ENUMS.LAST_MONTH: {
      const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      return { startDate, endDate };
    }
    case PERIOD_ENUMS.THIS_YEAR: {
      const startDate = new Date(year, 0, 1, 0, 0, 0, 0);
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
      return { startDate, endDate };
    }
    case PERIOD_ENUMS.LAST_YEAR: {
      const startDate = new Date(year - 1, 0, 1, 0, 0, 0, 0);
      const endDate = new Date(year - 1, 11, 31, 23, 59, 59, 999);
      return { startDate, endDate };
    }
    case PERIOD_ENUMS.ALL_TIME:
      return { startDate: null, endDate: null };
  }

  // 1. Explicit 4-digit year check (e.g. "2026", "2025", "2024")
  if (/^\d{4}$/.test(pStr)) {
    const targetYear = parseInt(pStr, 10);
    return {
      startDate: new Date(targetYear, 0, 1, 0, 0, 0, 0),
      endDate: new Date(targetYear, 11, 31, 23, 59, 59, 999),
    };
  }

  // 2. Relative days check (e.g. "LAST_7_DAYS", "LAST_30_DAYS", "LAST_90_DAYS")
  const daysMatch = pStr.match(/LAST_(\d+)_DAYS/);
  if (daysMatch) {
    const numDays = parseInt(daysMatch[1], 10);
    const startDate = new Date(now.getTime() - numDays * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);
    return { startDate, endDate: now };
  }

  // 3. Month name check (e.g. "JANUARY", "FEB", "MARCH")
  const monthNames = [
    ['JANUARY', 'JAN'], ['FEBRUARY', 'FEB'], ['MARCH', 'MAR'], ['APRIL', 'APR'],
    ['MAY'], ['JUNE', 'JUN'], ['JULY', 'JUL'], ['AUGUST', 'AUG'],
    ['SEPTEMBER', 'SEP', 'SEPT'], ['OCTOBER', 'OCT'], ['NOVEMBER', 'NOV'], ['DECEMBER', 'DEC']
  ];
  for (let idx = 0; idx < monthNames.length; idx++) {
    if (monthNames[idx].includes(pStr)) {
      // Determine target year: if specified month is after current month, refer to last year
      const targetYear = idx > month ? year - 1 : year;
      return {
        startDate: new Date(targetYear, idx, 1, 0, 0, 0, 0),
        endDate: new Date(targetYear, idx + 1, 0, 23, 59, 59, 999),
      };
    }
  }

  return { startDate: null, endDate: null };
};
