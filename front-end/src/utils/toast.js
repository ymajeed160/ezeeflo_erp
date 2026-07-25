/**
 * Global Toast / Notification & Confirm Dialog Utility
 *
 * Uses notistack for snackbar notifications and window.confirm for dialogs.
 * Works both inside and outside React components.
 */
import { enqueueSnackbar, closeSnackbar } from 'notistack';

/**
 * Show a success snackbar notification.
 * @param {string} message - The message to display.
 */
export const apiSuccess = (message) => {
  enqueueSnackbar(message, {
    variant: 'success',
    autoHideDuration: 3000,
    anchorOrigin: { vertical: 'top', horizontal: 'right' },
  });
};

/**
 * Show an error snackbar notification.
 * @param {string} message - The message to display.
 */
export const apiError = (message) => {
  enqueueSnackbar(message, {
    variant: 'error',
    autoHideDuration: 5000,
    anchorOrigin: { vertical: 'top', horizontal: 'right' },
  });
};

/**
 * Show a warning snackbar notification.
 * @param {string} message - The message to display.
 */
export const apiWarning = (message) => {
  enqueueSnackbar(message, {
    variant: 'warning',
    autoHideDuration: 4000,
    anchorOrigin: { vertical: 'top', horizontal: 'right' },
  });
};

/**
 * Show an info snackbar notification.
 * @param {string} message - The message to display.
 */
export const apiInfo = (message) => {
  enqueueSnackbar(message, {
    variant: 'info',
    autoHideDuration: 3000,
    anchorOrigin: { vertical: 'top', horizontal: 'right' },
  });
};

/**
 * Confirmation dialog. Supports two signatures:
 *
 * 1) Promise-based (async/await):
 *    const confirmed = await confirmDialog('Are you sure?');
 *
 * 2) Callback-based:
 *    confirmDialog('Are you sure?', async () => { await doSomething(); });
 *
 * @param {string} message  - The confirmation message to display.
 * @param {Function} [callback] - Optional callback invoked if confirmed.
 * @returns {Promise<boolean>|void} Promise resolving to boolean when no callback given.
 */
export const confirmDialog = (message, callback) => {
  if (typeof callback === 'function') {
    // Callback-based usage
    const confirmed = window.confirm(message);
    if (confirmed) {
      callback();
    }
    return;
  }

  // Promise-based usage (async/await)
  return new Promise((resolve) => {
    const confirmed = window.confirm(message);
    resolve(confirmed);
  });
};

export default { apiSuccess, apiError, apiWarning, apiInfo, confirmDialog };
