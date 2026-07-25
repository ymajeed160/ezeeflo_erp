import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import inventoryApi from '../../services/inventoryApi';

// Inventory Balances
export const fetchInventoryBalances = createAsyncThunk('inventory/fetchBalances', async (params, { rejectWithValue }) => {
  try {
    const response = await inventoryApi.getBalances(params);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchInventoryBalance = createAsyncThunk('inventory/fetchBalance', async (id, { rejectWithValue }) => {
  try {
    const response = await inventoryApi.getBalance(id);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

// Inventory Transactions
export const fetchInventoryTransactions = createAsyncThunk('inventory/fetchTransactions', async (params, { rejectWithValue }) => {
  try {
    const response = await inventoryApi.getTransactions(params);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchInventoryTransaction = createAsyncThunk('inventory/fetchTransaction', async (id, { rejectWithValue }) => {
  try {
    const response = await inventoryApi.getTransaction(id);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

const inventorySlice = createSlice({
  name: 'inventory',
  initialState: {
    balances: [],
    transactions: [],
    selectedBalance: null,
    selectedTransaction: null,
    loading: false,
    error: null,
    balancesTotal: 0,
    transactionsTotal: 0,
  },
  reducers: {
    clearSelected: (state) => {
      state.selectedBalance = null;
      state.selectedTransaction = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInventoryBalances.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchInventoryBalances.fulfilled, (state, action) => {
        state.loading = false;
        state.balances = action.payload.data || action.payload;
        state.balancesTotal = action.payload.meta?.pagination?.total || action.payload.total || (action.payload.data?.length || 0);
      })
      .addCase(fetchInventoryBalances.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchInventoryBalance.fulfilled, (state, action) => { state.selectedBalance = action.payload.data || action.payload; })
      .addCase(fetchInventoryTransactions.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchInventoryTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload.data || action.payload;
        state.transactionsTotal = action.payload.meta?.pagination?.total || action.payload.total || (action.payload.data?.length || 0);
      })
      .addCase(fetchInventoryTransactions.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchInventoryTransaction.fulfilled, (state, action) => { state.selectedTransaction = action.payload.data || action.payload; });
  },
});

export const { clearSelected, clearError } = inventorySlice.actions;
export default inventorySlice.reducer;