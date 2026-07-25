import api from './api';

class DashboardApi {
  /**
   * Get summary cards data (Total Revenue, Active Customers, Inventory Value, Pending Orders)
   */
  static async getSummary() {
    const response = await api.get('/dashboard/summary');
    return response.data;
  }

  /**
   * Get revenue overview chart data
   * @param {string} period - 'monthly' or 'yearly'
   */
  static async getRevenueOverview(period = 'monthly') {
    const response = await api.get('/dashboard/revenue', { params: { period } });
    return response.data;
  }

  /**
   * Get recent transactions across all modules
   * @param {number} limit - Number of transactions to return
   */
  static async getRecentTransactions(limit = 10) {
    const response = await api.get('/dashboard/recent-transactions', { params: { limit } });
    return response.data;
  }

  /**
   * Get customer balances
   * @param {number} limit - Number of customers to return
   */
  static async getCustomerBalances(limit = 10) {
    const response = await api.get('/dashboard/customer-balances', { params: { limit } });
    return response.data;
  }

  /**
   * Get inventory alerts
   */
  static async getInventoryAlerts() {
    const response = await api.get('/dashboard/inventory-alerts');
    return response.data;
  }

  /**
   * Get quick stats
   */
  static async getQuickStats() {
    const response = await api.get('/dashboard/quick-stats');
    return response.data;
  }
}

export default DashboardApi;
