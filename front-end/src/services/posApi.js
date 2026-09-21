import axiosInstance from './axiosInstance';

const POS_BASE = '/pos';

// ============================
// Terminals
// ============================
export const getTerminals = (params) => axiosInstance.get(`${POS_BASE}/terminals`, { params });
export const getTerminal = (id) => axiosInstance.get(`${POS_BASE}/terminals/${id}`);
export const createTerminal = (data) => axiosInstance.post(`${POS_BASE}/terminals`, data);
export const updateTerminal = (id, data) => axiosInstance.put(`${POS_BASE}/terminals/${id}`, data);
export const deleteTerminal = (id) => axiosInstance.delete(`${POS_BASE}/terminals/${id}`);
export const getMyTerminals = () => axiosInstance.get(`${POS_BASE}/terminals/my-terminals`);

// ============================
// Sessions
// ============================
export const getSessions = (params) => axiosInstance.get(`${POS_BASE}/sessions`, { params });
export const getSession = (id) => axiosInstance.get(`${POS_BASE}/sessions/${id}`);
export const getActiveSession = (terminalId) => axiosInstance.get(`${POS_BASE}/sessions/active`, { params: { terminalId } });
export const openSession = (data) => axiosInstance.post(`${POS_BASE}/sessions/open`, data);
export const closeSession = (id, data) => axiosInstance.post(`${POS_BASE}/sessions/${id}/close`, data);
export const getSessionSummary = (id) => axiosInstance.get(`${POS_BASE}/sessions/${id}/summary`);

// ============================
// Sales
// ============================
export const getSales = (params) => axiosInstance.get(`${POS_BASE}/sales`, { params });
export const getSale = (id) => axiosInstance.get(`${POS_BASE}/sales/${id}`);
export const completeSale = (data) => axiosInstance.post(`${POS_BASE}/sales/complete`, data);
export const cancelSale = (id, reason) => axiosInstance.post(`${POS_BASE}/sales/${id}/cancel`, { reason });

// ============================
// Held Orders
// ============================
export const holdOrder = (data) => axiosInstance.post(`${POS_BASE}/sales/hold`, data);
export const listHeldOrders = (params) => axiosInstance.get(`${POS_BASE}/sales/hold/list`, { params });
export const retrieveHeldOrder = (id) => axiosInstance.post(`${POS_BASE}/sales/hold/${id}/retrieve`);

// ============================
// Returns
// ============================
export const getReturns = (params) => axiosInstance.get(`${POS_BASE}/returns`, { params });
export const getReturn = (id) => axiosInstance.get(`${POS_BASE}/returns/${id}`);
export const processReturn = (data) => axiosInstance.post(`${POS_BASE}/returns`, data);

// ============================
// Cash Management
// ============================
export const getCashMovements = (params) => axiosInstance.get(`${POS_BASE}/cash-movements`, { params });
export const recordCashMovement = (data) => axiosInstance.post(`${POS_BASE}/cash-movements`, data);
