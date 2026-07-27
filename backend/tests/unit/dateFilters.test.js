import { describe, it, expect } from 'vitest';
import { getDateRangeForPeriod } from '../../src/ai/query/dateFilters.js';
import { PERIOD_ENUMS } from '../../src/ai/intent/supportedIntents.js';

describe('Ask Receiptly Date Filters Utility', () => {
  it('should return null dates for ALL_TIME or invalid period', () => {
    const res1 = getDateRangeForPeriod(PERIOD_ENUMS.ALL_TIME);
    expect(res1.startDate).toBeNull();
    expect(res1.endDate).toBeNull();

    const res2 = getDateRangeForPeriod('INVALID_PERIOD');
    expect(res2.startDate).toBeNull();
    expect(res2.endDate).toBeNull();
  });

  it('should return valid date boundaries for THIS_MONTH', () => {
    const res = getDateRangeForPeriod(PERIOD_ENUMS.THIS_MONTH);
    expect(res.startDate).toBeInstanceOf(Date);
    expect(res.endDate).toBeInstanceOf(Date);
    expect(res.startDate.getDate()).toBe(1);
    expect(res.startDate.getHours()).toBe(0);
    expect(res.endDate.getHours()).toBe(23);
  });

  it('should return valid date boundaries for TODAY', () => {
    const res = getDateRangeForPeriod(PERIOD_ENUMS.TODAY);
    const now = new Date();
    expect(res.startDate.getDate()).toBe(now.getDate());
    expect(res.endDate.getDate()).toBe(now.getDate());
  });

  it('should return valid date boundaries for THIS_YEAR and LAST_YEAR', () => {
    const currentYear = new Date().getFullYear();
    const resThis = getDateRangeForPeriod(PERIOD_ENUMS.THIS_YEAR);
    expect(resThis.startDate.getFullYear()).toBe(currentYear);

    const resLast = getDateRangeForPeriod(PERIOD_ENUMS.LAST_YEAR);
    expect(resLast.startDate.getFullYear()).toBe(currentYear - 1);
  });
});
