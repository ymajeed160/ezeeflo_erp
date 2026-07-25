import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import bankTransactionApi from '../../services/bankTransactionApi';

export const fetchBankTransactions = createAsyncThunk(
  'bankTransactions/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await bankTransactionApi.getAll(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchBankTransaction = createAsyncThunk(
  'bankTransactions/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await bankTransactionApi.getById(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createBankTransaction = createAsyncThunk(
  'bankTransactions/create',
  async (data, { rejectWithValue }) => {
    try {
      const response = await bankTransactionApi.create(data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateBankTransaction = createAsyncThunk(
  'bankTransactions/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await bankTransactionApi.update(id, data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const postBankTransaction = createAsyncThunk(
  'bankTransactions/post',
  async (id, { rejectWithValue }) => {
    try {
      const response = await bankTransactionApi.post(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const reverseBankTransaction = createAsyncThunk(
  'bankTransactions/reverse',
  async (id, { rejectWithValue }) => {
    try {
      const response = await bankTransactionApi.reverse(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteBankTransaction = createAsyncThunk(
  'bankTransactions/delete',
  async (id, { rejectWithValue }) => {
    try {
      await bankTransactionApi.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const importBankTransactionsCSV = createAsyncThunk(
  'bankTransactions/importCSV',
  async (data, { rejectWithValue }) => {
    try {
      const response = await bankTransactionApi.importCSV(data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const bankTransactionSlice = createSlice({
  name: 'bankTransactions',
  initialState: {
    transactions: [],
    selectedTransaction: null,
    loading: false,
    error: null,
    total: 0,
    page: 1,
    pageSize: 10,
  },
  reducers: {
    clearSelected: (state) => {
      state.selectedTransaction = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchAll
      .addCase(fetchBankTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBankTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload.data || action.payload;
        state.total = action.payload.meta?.pagination?.total || action.payload.total || 0;
        state.page = action.payload.meta?.pagination?.page || 1;
        state.pageSize = action.payload.meta?.pagination?.limit || 10;
      })
      .addCase(fetchBankTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // fetchById
      .addCase(fetchBankTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBankTransaction.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedTransaction = action.payload.data || action.payload;
      })
      .addCase(fetchBankTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // create
      .addCase(createBankTransaction.fulfilled, (state, action) => {
        state.transactions.unshift(action.payload.data || action.payload);
      })
      // update
      .addCase(updateBankTransaction.fulfilled, (state, action) => {
        const updated = action.payload.data || action.payload;
        const idx = state.transactions.findIndex((t) => t.id === updated.id);
        if (idx !== -1) state.transactions[idx] = updated;
      })
      // post
      .addCase(postBankTransaction.fulfilled, (state, action) => {
        const updated = action.payload.data || action.payload;
        const idx = state.transactions.findIndex((t) => t.id === updated.id);
        if (idx !== -1) state.transactions[idx] = updated;
      })
      // reverse
      .addCase(reverseBankTransaction.fulfilled, (state, action) => {
        const updated = action.payload.data || action.payload;
        const idx = state.transactions.findIndex((t) => t.id === updated.id);
        if (idx !== -1) state.transactions[idx] = updated;
      })
      // delete
      .addCase(deleteBankTransaction.fulfilled, (state, action) => {
        state.transactions = state.transactions.filter((t) => t.id !== action.payload);
      })
      // import CSV
      .addCase(importBankTransactionsCSV.fulfilled, (state, action) => {
        const imported = action.payload.data || action.payload;
        if (Array.isArray(imported)) {
          state.transactions.unshift(...imported);
        }
      });
  },
});

export const { clearSelected, clearError } = bankTransactionSlice.actions;
export default bankTransactionSlice.reducer;
