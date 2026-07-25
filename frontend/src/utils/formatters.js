/**
 * Formats ISO date strings (YYYY-MM-DD or ISO timestamp) into Indian standard DD-MM-YYYY format.
 * Example: "2026-07-25" -> "25-07-2026"
 */
export const formatIndianDate = (dateVal) => {
  if (!dateVal) return '';

  if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal.trim())) {
    const [year, month, day] = dateVal.trim().split('-');
    return `${day}-${month}-${year}`;
  }

  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (err) {
    return String(dateVal);
  }
};

/**
 * Normalizes any date string format (DD-MM-YYYY, DD/MM/YYYY, ISO) into clean YYYY-MM-DD for HTML5 date inputs
 */
export const formatDateString = (dateVal) => {
  if (!dateVal) return '';

  if (typeof dateVal === 'string') {
    const str = dateVal.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return str;
    }

    const dmyMatch = str.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
    if (dmyMatch) {
      const [, day, month, year] = dmyMatch;
      const pDay = day.padStart(2, '0');
      const pMonth = month.padStart(2, '0');
      return `${year}-${pMonth}-${pDay}`;
    }
  }

  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (err) {
    return '';
  }
};

/**
 * Formats currency into Indian Rupee format (₹)
 */
export const formatINR = (amount, currency = 'INR') => {
  const num = Number(amount) || 0;
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(num);
  }
  return `${currency} ${num.toFixed(2)}`;
};
