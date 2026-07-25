import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import SalesReturnApi from '../../services/salesReturnApi';

const initialState = {
  items: [],
  selected: null,
  loading: false,
  error: null,
  count: 0,
  page: 1,
  limit: 25,
  totalPages: 1,
  filters: {
    search: '',
    status: '',
    customerId: '',
    warehouseId: '',
    startDate: '',
    endDate: '',
    order: 'createdAt',
    dir: 'DESC',
  },
};

// Fetch returns with filtering
export const fetchReturns = createAsyncThunk(
  'salesReturn/fetchReturns',
  async (params, { rejectWithValue }) => {
    try {
      const response = await SalesReturnApi.list(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Fetch single return
export const fetchReturn = createAsyncThunk(
  'salesReturn/fetchReturn',
  async (id, { rejectWithValue }) => {
    try {
      const response = await SalesReturnApi.getById(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Create return
export const createReturn = createAsyncThunk(
  'salesReturn/createReturn',
  async (data, { rejectWithValue }) => {
    try {
      const response = await SalesReturnApi.create(data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Update return
export const updateReturn = createAsyncThunk(
  'salesReturn/updateReturn',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await SalesReturnApi.update(id, data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Delete return
export const deleteReturn = createAsyncThunk(
  'salesReturn/deleteReturn',
  async (id, { rejectWithValue }) => {
    try {
      await SalesReturnApi.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Approve return
export const approveReturn = createAsyncThunk(
  'salesReturn/approveReturn',
  async (id, { rejectWithValue }) => {
    try {
      const response = await SalesReturnApi.approve(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Reject return
export const rejectReturn = createAsyncThunk(
  'salesReturn/rejectReturn',
  async (id, { rejectWithValue }) => {
    try {
      const response = await SalesReturnApi.reject(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const salesReturnSlice = createSlice({
  name: 'salesReturn',
  initialState,
  reducers: {
    clearSelected(state) {
      state.selected = null;
    },
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Returns
    builder
      .addCase(fetchReturns.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReturns.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.count = action.payload.count;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchReturns.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Single
    builder
      .addCase(fetchReturn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReturn.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
      })
      .addCase(fetchReturn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Create
    builder
      .addCase(createReturn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createReturn.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
        state.count += 1;
      })
      .addCase(createReturn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update
    builder
      .addCase(updateReturn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateReturn.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((i) => i.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
        state.selected = action.payload;
      })
      .addCase(updateReturn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Delete
    builder
      .addCase(deleteReturn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteReturn.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((i) => i.id !== action.payload);
        state.count -= 1;
      })
      .addCase(deleteReturn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Approve
    builder
      .addCase(approveReturn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(approveReturn.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((i) => i.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
        state.selected = action.payload;
      })
      .addCase(approveReturn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Reject
    builder
      .addCase(rejectReturn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(rejectReturn.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((i) => i.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
        state.selected = action.payload;
      })
      .addCase(rejectReturn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearSelected, setFilters, clearError } = salesReturnSlice.actions;
export default salesReturnSlice.reducer;