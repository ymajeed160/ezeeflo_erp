import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import PurchaseReturnApi from '../../services/purchaseReturnApi';

const initialState = {
  items: [],
  totalItems: 0,
  currentPage: 1,
  pageSize: 20,
  totalPages: 0,
  selectedItem: null,
  loading: false,
  error: null,
};

// Fetch purchase returns with filters & pagination
export const fetchPurchaseReturns = createAsyncThunk(
  'purchaseReturns/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await PurchaseReturnApi.list(params);
      return response.data || response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch purchase returns'
      );
    }
  }
);

// Fetch single purchase return by ID
export const fetchPurchaseReturn = createAsyncThunk(
  'purchaseReturns/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      const response = await PurchaseReturnApi.getById(id);
      return response.data || response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch purchase return'
      );
    }
  }
);

// Create purchase return
export const createPurchaseReturn = createAsyncThunk(
  'purchaseReturns/create',
  async (data, { rejectWithValue }) => {
    try {
      const response = await PurchaseReturnApi.create(data);
      return response.data || response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to create purchase return'
      );
    }
  }
);

// Update purchase return
export const updatePurchaseReturn = createAsyncThunk(
  'purchaseReturns/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await PurchaseReturnApi.update(id, data);
      return response.data || response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to update purchase return'
      );
    }
  }
);

// Delete purchase return
export const deletePurchaseReturn = createAsyncThunk(
  'purchaseReturns/delete',
  async (id, { rejectWithValue }) => {
    try {
      await PurchaseReturnApi.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to delete purchase return'
      );
    }
  }
);

// Approve purchase return
export const approvePurchaseReturn = createAsyncThunk(
  'purchaseReturns/approve',
  async (id, { rejectWithValue }) => {
    try {
      const response = await PurchaseReturnApi.approve(id);
      return response.data || response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to approve purchase return'
      );
    }
  }
);

// Reject purchase return
export const rejectPurchaseReturn = createAsyncThunk(
  'purchaseReturns/reject',
  async (id, { rejectWithValue }) => {
    try {
      const response = await PurchaseReturnApi.reject(id);
      return response.data || response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to reject purchase return'
      );
    }
  }
);

const purchaseReturnSlice = createSlice({
  name: 'purchaseReturns',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    clearSelected(state) {
      state.selectedItem = null;
    },
    setPage(state, action) {
      state.currentPage = action.payload;
    },
    setPageSize(state, action) {
      state.pageSize = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchPurchaseReturns.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchaseReturns.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || action.payload.rows || [];
        state.totalItems = action.payload.totalItems || action.payload.count || 0;
        state.currentPage = action.payload.currentPage || action.payload.page || 1;
        state.totalPages = action.payload.totalPages || action.payload.pages || 0;
      })
      .addCase(fetchPurchaseReturns.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch One
      .addCase(fetchPurchaseReturn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchaseReturn.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedItem = action.payload;
      })
      .addCase(fetchPurchaseReturn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create
      .addCase(createPurchaseReturn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPurchaseReturn.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
        state.totalItems += 1;
      })
      .addCase(createPurchaseReturn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update
      .addCase(updatePurchaseReturn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePurchaseReturn.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.selectedItem?.id === action.payload.id) {
          state.selectedItem = action.payload;
        }
      })
      .addCase(updatePurchaseReturn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete
      .addCase(deletePurchaseReturn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePurchaseReturn.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((item) => item.id !== action.payload);
        state.totalItems -= 1;
      })
      .addCase(deletePurchaseReturn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Approve
      .addCase(approvePurchaseReturn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(approvePurchaseReturn.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.selectedItem?.id === action.payload.id) {
          state.selectedItem = action.payload;
        }
      })
      .addCase(approvePurchaseReturn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Reject
      .addCase(rejectPurchaseReturn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(rejectPurchaseReturn.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.selectedItem?.id === action.payload.id) {
          state.selectedItem = action.payload;
        }
      })
      .addCase(rejectPurchaseReturn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearSelected, setPage, setPageSize } = purchaseReturnSlice.actions;
export default purchaseReturnSlice.reducer;