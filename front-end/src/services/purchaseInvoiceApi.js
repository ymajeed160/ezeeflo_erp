'use strict';

import api from './api';

const purchaseInvoiceApi = {
  list: (params = {}) =>
    api.get('/purchase-invoices', { params }),

  getById: (id) =>
    api.get(`/purchase-invoices/${id}`),

  create: (data) =>
    api.post('/purchase-invoices', data),

  update: (id, data) =>
    api.put(`/purchase-invoices/${id}`, data),

  delete: (id) =>
    api.delete(`/purchase-invoices/${id}`),

  approve: (id, data = {}) =>
    api.post(`/purchase-invoices/${id}/approve`, data),

  confirm: (id) =>
    api.post(`/purchase-invoices/${id}/confirm`),

  cancel: (id) =>
    api.post(`/purchase-invoices/${id}/cancel`),

  generateFromPO: (poId) =>
    api.post('/purchase-invoices/generate-from-po', { poId }),

  generateFromGoodsReceipt: (grnId) =>
    api.post('/purchase-invoices/generate-from-grn', { grnId }),

  sendEmail: (id, { to, subject, body, pdfBase64 }) =>
    api.post(`/purchase-invoices/${id}/send-email`, { to, subject, body, pdfBase64 }),
};

export default purchaseInvoiceApi;