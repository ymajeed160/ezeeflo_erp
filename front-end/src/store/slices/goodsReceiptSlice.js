import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import goodsReceiptApi from '../../services/goodsReceiptApi';

const initialState = {
  list: [],
  current: null,
  loading: false,
  error: null,
  count: 0,
  page: 1,
  limit: 20,
  totalPages: 0,
};

export const fetchGoodsReceipts = createAsyncThunk(
  'goodsReceipts/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await goodsReceiptApi.list(params);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchGoodsReceipt = createAsyncThunk(
  'goodsReceipts/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await goodsReceiptApi.getById(id);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const createGoodsReceipt = createAsyncThunk(
  'goodsReceipts/create',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await goodsReceiptApi.create(payload);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const updateGoodsReceipt = createAsyncThunk(
  'goodsReceipts/update',
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const { data } = await goodsReceiptApi.update(id, payload);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const deleteGoodsReceipt = createAsyncThunk(
  'goodsReceipts/delete',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await goodsReceiptApi.delete(id);
      return { id, ...data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const approveGoodsReceipt = createAsyncThunk(
  'goodsReceipts/approve',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await goodsReceiptApi.approve(id);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const cancelGoodsReceipt = createAsyncThunk(
  'goodsReceipts/cancel',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await goodsReceiptApi.cancel(id);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const goodsReceiptSlice = createSlice({
  name: 'goodsReceipts',
  initialState,
  reducers: {
    clearCurrent: (state) => {
      state.current = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch List
    builder.addCase(fetchGoodsReceipts.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchGoodsReceipts.fulfilled, (state, action) => {
      state.loading = false;
      state.list = action.payload.data;
      state.count = action.payload.count;
      state.page = action.payload.page;
      state.limit = action.payload.limit;
      state.totalPages = action.payload.totalPages;
    });
    builder.addCase(fetchGoodsReceipts.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Fetch One
    builder.addCase(fetchGoodsReceipt.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchGoodsReceipt.fulfilled, (state, action) => {
      state.loading = false;
      state.current = action.payload.data;
    });
    builder.addCase(fetchGoodsReceipt.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Create
    builder.addCase(createGoodsReceipt.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createGoodsReceipt.fulfilled, (state, action) => {
      state.loading = false;
      state.list.unshift(action.payload.data);
      state.count += 1;
      state.current = action.payload.data;
    });
    builder.addCase(createGoodsReceipt.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Update
    builder.addCase(updateGoodsReceipt.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateGoodsReceipt.fulfilled, (state, action) => {
      state.loading = false;
      state.current = action.payload.data;
      const idx = state.list.findIndex((r) => r.id === action.payload.data.id);
      if (idx !== -1) state.list[idx] = action.payload.data;
    });
    builder.addCase(updateGoodsReceipt.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Delete
    builder.addCase(deleteGoodsReceipt.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteGoodsReceipt.fulfilled, (state, action) => {
      state.loading = false;
      state.list = state.list.filter((r) => r.id !== action.payload.id);
      state.count -= 1;
      state.current = null;
    });
    builder.addCase(deleteGoodsReceipt.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Approve
    builder.addCase(approveGoodsReceipt.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(approveGoodsReceipt.fulfilled, (state, action) => {
      state.loading = false;
      state.current = action.payload.data;
      const idx = state.list.findIndex((r) => r.id === action.payload.data.id);
      if (idx !== -1) state.list[idx] = action.payload.data;
    });
    builder.addCase(approveGoodsReceipt.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Cancel
    builder.addCase(cancelGoodsReceipt.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(cancelGoodsReceipt.fulfilled, (state, action) => {
      state.loading = false;
      state.current = action.payload.data;
      const idx = state.list.findIndex((r) => r.id === action.payload.data.id);
      if (idx !== -1) state.list[idx] = action.payload.data;
    });
    builder.addCase(cancelGoodsReceipt.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export const { clearCurrent, clearError } = goodsReceiptSlice.actions;
export default goodsReceiptSlice.reducer;