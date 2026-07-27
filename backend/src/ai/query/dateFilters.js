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
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();

  switch (period) {
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
      // Setting day to 0 in JavaScript Date constructor returns the last day of the target month
      const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
      return { startDate, endDate };
    }
    case PERIOD_ENUMS.LAST_MONTH: {
      const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
      // Setting day to 0 in JavaScript Date constructor returns the last day of the previous month
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
    default:
      return { startDate: null, endDate: null };
  }
};
