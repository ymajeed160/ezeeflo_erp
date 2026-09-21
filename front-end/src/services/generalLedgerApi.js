import axiosInstance from './axiosInstance';

const generalLedgerApi = {
  /**
   * Get general ledger data with filters
   * @param {Object} params - Query parameters
   * @param {string} [params.accountId] - Account UUID
   * @param {string} [params.dateFrom] - Start date (YYYY-MM-DD)
   * @param {string} [params.dateTo] - End date (YYYY-MM-DD)
   * @param {string} [params.accountType] - Account type filter
   * @param {string} [params.journalNumber] - Journal number filter
   * @param {string} [params.referenceNumber] - Reference number filter
   * @param {number} [params.page] - Page number
   * @param {number} [params.limit] - Items per page
   * @returns {Promise<Object>} Ledger response with transactions and summary
   */
  getLedger: async (params = {}) => {
    const { data } = await axiosInstance.get('/general-ledger', { params });
    return data;
  },

  /**
   * Get accounts for filter dropdown
   * @param {Object} params - Query parameters
   * @param {string} [params.type] - Account type filter
   * @returns {Promise<Object>} List of accounts
   */
  getLedgerAccounts: async (params = {}) => {
    const { data } = await axiosInstance.get('/general-ledger/accounts', { params });
    return data;
  },

  /**
   * Get account hierarchy (parent with all children recursively)
   * @param {string} accountId - Account UUID
   * @returns {Promise<Object>} Account with children
   */
  getAccountHierarchy: async (accountId) => {
    const { data } = await axiosInstance.get(`/general-ledger/account/${accountId}/hierarchy`);
    return data;
  },

  /**
   * Export ledger data (returns full dataset without pagination)
   * @param {Object} params - Same filters as getLedger
   * @returns {Promise<Object>} Full ledger data for export
   */
  exportLedger: async (params = {}) => {
    const { data } = await axiosInstance.get('/general-ledger/export', { params });
    return data;
  },
};

export default generalLedgerApi;