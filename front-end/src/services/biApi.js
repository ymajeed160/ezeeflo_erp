import api from './api';

class BIApi {
  /**
   * Get Sales BI Dashboard data
   */
  static async getSalesDashboard(params = {}) {
    const response = await api.get('/bi/sales-dashboard', { params });
    return response.data;
  }

  /**
   * Get Purchase BI Dashboard data
   */
  static async getPurchaseDashboard(params = {}) {
    const response = await api.get('/bi/purchase-dashboard', { params });
    return response.data;
  }

  /**
   * Get Inventory BI Dashboard data
   */
  static async getInventoryDashboard(params = {}) {
    const response = await api.get('/bi/inventory-dashboard', { params });
    return response.data;
  }

  /**
   * Get Financial BI Dashboard data
   */
  static async getFinancialDashboard(params = {}) {
    const response = await api.get('/bi/financial-dashboard', { params });
    return response.data;
  }
}

export default BIApi;
