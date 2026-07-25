'use strict';

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import purchaseInvoiceApi from '../../services/purchaseInvoiceApi';

const initialState = {
  items: [],
  selectedItem: null,
  totalCount: 0,
  page: 1,
  limit: 10,
  loading: false,
  error: null,
  filters: {},
};

export const fetchPurchaseInvoices = createAsyncThunk(
  'purchaseInvoices/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await purchaseInvoiceApi.list(params);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch purchase invoices');
    }
  }
);

export const fetchPurchaseInvoice = createAsyncThunk(
  'purchaseInvoices/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await purchaseInvoiceApi.getById(id);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch purchase invoice');
    }
  }
);

export const createPurchaseInvoice = createAsyncThunk(
  'purchaseInvoices/create',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await purchaseInvoiceApi.create(payload);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create purchase invoice');
    }
  }
);

export const updatePurchaseInvoice = createAsyncThunk(
  'purchaseInvoices/update',
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const { data } = await purchaseInvoiceApi.update(id, payload);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update purchase invoice');
    }
  }
);

export const deletePurchaseInvoice = createAsyncThunk(
  'purchaseInvoices/delete',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await purchaseInvoiceApi.delete(id);
      return { id, ...data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete purchase invoice');
    }
  }
);

export const approvePurchaseInvoice = createAsyncThunk(
  'purchaseInvoices/approve',
  async (payload, { rejectWithValue }) => {
    try {
      const { id, ...data } = payload;
      const { data: resData } = await purchaseInvoiceApi.approve(id, data);
      return resData;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to approve purchase invoice');
    }
  }
);

export const confirmPurchaseInvoice = createAsyncThunk(
  'purchaseInvoices/confirm',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await purchaseInvoiceApi.confirm(id);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to confirm purchase invoice');
    }
  }
);

export const cancelPurchaseInvoice = createAsyncThunk(
  'purchaseInvoices/cancel',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await purchaseInvoiceApi.cancel(id);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to cancel purchase invoice');
    }
  }
);

export const generateInvoiceFromPO = createAsyncThunk(
  'purchaseInvoices/generateFromPO',
  async (poId, { rejectWithValue }) => {
    try {
      const { data } = await purchaseInvoiceApi.generateFromPO(poId);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to generate invoice from PO');
    }
  }
);

export const generateInvoiceFromGoodsReceipt = createAsyncThunk(
  'purchaseInvoices/generateFromGRN',
  async (grnId, { rejectWithValue }) => {
    try {
      const { data } = await purchaseInvoiceApi.generateFromGoodsReceipt(grnId);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to generate invoice from GRN');
    }
  }
);

const purchaseInvoiceSlice = createSlice({
  name: 'purchaseInvoices',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setPage: (state, action) => {
      state.page = action.payload;
    },
    setLimit: (state, action) => {
      state.limit = action.payload;
    },
    clearSelected: (state) => {
      state.selectedItem = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPurchaseInvoices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchaseInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data || [];
        state.totalCount = action.payload.count || action.payload.totalCount || 0;
        state.page = action.payload.page || 1;
        state.limit = action.payload.limit || 10;
      })
      .addCase(fetchPurchaseInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchPurchaseInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchaseInvoice.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedItem = action.payload.data;
      })
      .addCase(fetchPurchaseInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createPurchaseInvoice.fulfilled, (state, action) => {
        state.items.unshift(action.payload.data);
        state.totalCount += 1;
      })
      .addCase(updatePurchaseInvoice.fulfilled, (state, action) => {
        const idx = state.items.findIndex((i) => i.id === action.payload.data.id);
        if (idx !== -1) state.items[idx] = action.payload.data;
        if (state.selectedItem?.id === action.payload.data.id) {
          state.selectedItem = action.payload.data;
        }
      })
      .addCase(deletePurchaseInvoice.fulfilled, (state, action) => {
        state.items = state.items.filter((i) => i.id !== action.payload.id);
        state.totalCount -= 1;
      })
      .addCase(approvePurchaseInvoice.fulfilled, (state, action) => {
        const idx = state.items.findIndex((i) => i.id === action.payload.data.id);
        if (idx !== -1) state.items[idx] = action.payload.data;
        if (state.selectedItem?.id === action.payload.data.id) {
          state.selectedItem = action.payload.data;
        }
      })
      .addCase(confirmPurchaseInvoice.fulfilled, (state, action) => {
        const idx = state.items.findIndex((i) => i.id === action.payload.data.id);
        if (idx !== -1) state.items[idx] = action.payload.data;
        if (state.selectedItem?.id === action.payload.data.id) {
          state.selectedItem = action.payload.data;
        }
      })
      .addCase(cancelPurchaseInvoice.fulfilled, (state, action) => {
        const idx = state.items.findIndex((i) => i.id === action.payload.data.id);
        if (idx !== -1) state.items[idx] = action.payload.data;
        if (state.selectedItem?.id === action.payload.data.id) {
          state.selectedItem = action.payload.data;
        }
      });
  },
});

export const { setFilters, clearFilters, setPage, setLimit, clearSelected } = purchaseInvoiceSlice.actions;
export default purchaseInvoiceSlice.reducer;