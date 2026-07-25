export const APP_NAME = 'Receiptly';
export const APP_TAGLINE = 'Store every receipt. Find it in seconds.';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD: '/dashboard',
  RECEIPTS: '/receipts',
  RECEIPT_NEW: '/receipts/new',
  RECEIPT_DETAIL: (id = ':id') => `/receipts/${id}`,
  RECEIPT_EDIT: (id = ':id') => `/receipts/${id}/edit`,
};

export const RECEIPT_CATEGORIES = [
  'Groceries',
  'Food',
  'Travel',
  'Medical',
  'Shopping',
  'Bills',
  'Education',
  'Other',
];

export const SUPPORTED_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];

export const WARRANTY_SOURCES = [
  { value: 'DURATION', label: 'Duration (Months)' },
  { value: 'EXPIRY_DATE', label: 'Explicit Expiry Date' },
  { value: 'NONE', label: 'None' },
];
