import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import purchaseRequestApi from '../../services/purchaseRequestApi';

export const fetchPurchaseRequests = createAsyncThunk(
  'purchaseRequest/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await purchaseRequestApi.getAll(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchPurchaseRequestById = createAsyncThunk(
  'purchaseRequest/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await purchaseRequestApi.getById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createPurchaseRequest = createAsyncThunk(
  'purchaseRequest/create',
  async (data, { rejectWithValue }) => {
    try {
      const response = await purchaseRequestApi.create(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updatePurchaseRequest = createAsyncThunk(
  'purchaseRequest/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await purchaseRequestApi.update(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deletePurchaseRequest = createAsyncThunk(
  'purchaseRequest/delete',
  async (id, { rejectWithValue }) => {
    try {
      await purchaseRequestApi.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const submitPurchaseRequest = createAsyncThunk(
  'purchaseRequest/submit',
  async (id, { rejectWithValue }) => {
    try {
      const response = await purchaseRequestApi.submit(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const approvePurchaseRequest = createAsyncThunk(
  'purchaseRequest/approve',
  async (id, { rejectWithValue }) => {
    try {
      const response = await purchaseRequestApi.approve(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const rejectPurchaseRequest = createAsyncThunk(
  'purchaseRequest/reject',
  async (id, { rejectWithValue }) => {
    try {
      const response = await purchaseRequestApi.reject(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const purchaseRequestSlice = createSlice({
  name: 'purchaseRequest',
  initialState: {
    list: [],
    total: 0,
    page: 1,
    limit: 20,
    selected: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearSelected: (state) => {
      state.selected = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPurchaseRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchaseRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data.data;
        state.total = action.payload.data.total;
        state.page = action.payload.data.page;
        state.limit = action.payload.data.limit;
      })
      .addCase(fetchPurchaseRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchPurchaseRequestById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchaseRequestById.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload.data;
      })
      .addCase(fetchPurchaseRequestById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createPurchaseRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPurchaseRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.list.push(action.payload.data);
        state.total += 1;
      })
      .addCase(createPurchaseRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updatePurchaseRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePurchaseRequest.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.list.findIndex(r => r.id === action.payload.data.id);
        if (index !== -1) state.list[index] = action.payload.data;
        state.selected = action.payload.data;
      })
      .addCase(updatePurchaseRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deletePurchaseRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePurchaseRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.list = state.list.filter(r => r.id !== action.payload);
        state.total -= 1;
      })
      .addCase(deletePurchaseRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(submitPurchaseRequest.fulfilled, (state, action) => {
        const index = state.list.findIndex(r => r.id === action.payload.data.id);
        if (index !== -1) state.list[index] = action.payload.data;
        state.selected = action.payload.data;
      })
      .addCase(approvePurchaseRequest.fulfilled, (state, action) => {
        const index = state.list.findIndex(r => r.id === action.payload.data.id);
        if (index !== -1) state.list[index] = action.payload.data;
        state.selected = action.payload.data;
      })
      .addCase(rejectPurchaseRequest.fulfilled, (state, action) => {
        const index = state.list.findIndex(r => r.id === action.payload.data.id);
        if (index !== -1) state.list[index] = action.payload.data;
        state.selected = action.payload.data;
      });
  },
});

export const { clearSelected, clearError } = purchaseRequestSlice.actions;
export default purchaseRequestSlice.reducer;