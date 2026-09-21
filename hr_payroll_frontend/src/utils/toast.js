import { toast } from 'react-toastify';

/**
 * Toast notification utility for HR frontend.
 */

export const showSuccess = (message) => {
  toast.success(message);
};

export const showError = (message) => {
  toast.error(message || 'An error occurred');
};

export const showWarning = (message) => {
  toast.warning(message);
};

export const showInfo = (message) => {
  toast.info(message);
};

/**
 * Show API success message.
 */
export const apiSuccess = (result, fallback = 'Operation successful') => {
  const message = result?.message || fallback;
  toast.success(message);
};

/**
 * Show API error message.
 */
export const apiError = (error, fallback = 'Operation failed') => {
  const message = error?.response?.data?.message || error?.message || fallback;
  toast.error(message);
};
