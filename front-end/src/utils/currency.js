/**
 * Currency formatting utility
 * Default base currency is AED as per company profile
 */

const DEFAULT_CURRENCY = 'AED';
const DEFAULT_LOCALE = 'en-AE';

export const getCurrencyCode = () => {
  try {
    const state = window.__REDUX_STORE__?.getState();
    return state?.company?.currencyCode || DEFAULT_CURRENCY;
  } catch {
    return DEFAULT_CURRENCY;
  }
};

export const formatCurrency = (val, currencyCode = DEFAULT_CURRENCY) => {
  const num = parseFloat(val || 0);
  try {
    return new Intl.NumberFormat(DEFAULT_LOCALE, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    // Fallback if locale is not supported
    return `${currencyCode} ${num.toFixed(2)}`;
  }
};

export const formatNumber = (val, decimals = 2) => {
  const num = parseFloat(val || 0);
  return num.toLocaleString(DEFAULT_LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export default formatCurrency;
