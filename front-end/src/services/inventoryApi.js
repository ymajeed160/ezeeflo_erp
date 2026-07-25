import axiosInstance from './axiosInstance';

const inventoryApi = {
  // Inventory Balances
  getBalances(params = {}) {
    return axiosInstance.get('/inventory/balances', { params }).then((res) => res.data);
  },

  getBalance(id) {
    return axiosInstance.get(`/inventory/balances/${id}`).then((res) => res.data);
  },

  getBalanceByItemWarehouse(itemId, warehouseId) {
    return axiosInstance.get(`/inventory/balances/item/${itemId}/warehouse/${warehouseId}`).then((res) => res.data);
  },

  // Inventory Transactions
  getTransactions(params = {}) {
    return axiosInstance.get('/inventory/transactions', { params }).then((res) => res.data);
  },

  getTransaction(id) {
    return axiosInstance.get(`/inventory/transactions/${id}`).then((res) => res.data);
  },
};

export default inventoryApi;