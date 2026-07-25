import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import CustomerPaymentApi from '../../services/customerPaymentApi';

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
    paymentMethod: '',
    bankAccountId: '',
    startDate: '',
    endDate: '',
    order: 'createdAt',
    dir: 'DESC',
  },
};

// Fetch customer payments with filtering
export const fetchCustomerPayments = createAsyncThunk(
  'customerPayment/fetchCustomerPayments',
  async (params, { rejectWithValue }) => {
    try {
      const response = await CustomerPaymentApi.list(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Fetch single customer payment
export const fetchCustomerPayment = createAsyncThunk(
  'customerPayment/fetchCustomerPayment',
  async (id, { rejectWithValue }) => {
    try {
      const response = await CustomerPaymentApi.getById(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Create customer payment
export const createCustomerPayment = createAsyncThunk(
  'customerPayment/createCustomerPayment',
  async (data, { rejectWithValue }) => {
    try {
      const response = await CustomerPaymentApi.create(data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Update customer payment
export const updateCustomerPayment = createAsyncThunk(
  'customerPayment/updateCustomerPayment',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await CustomerPaymentApi.update(id, data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Delete customer payment
export const deleteCustomerPayment = createAsyncThunk(
  'customerPayment/deleteCustomerPayment',
  async (id, { rejectWithValue }) => {
    try {
      await CustomerPaymentApi.delete(id);
      return { id };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Post customer payment
export const postCustomerPayment = createAsyncThunk(
  'customerPayment/postCustomerPayment',
  async ({ id, data } = {}, { rejectWithValue }) => {
    try {
      const response = await CustomerPaymentApi.post(id, data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Cancel customer payment
export const cancelCustomerPayment = createAsyncThunk(
  'customerPayment/cancelCustomerPayment',
  async (id, { rejectWithValue }) => {
    try {
      const response = await CustomerPaymentApi.cancel(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const customerPaymentSlice = createSlice({
  name: 'customerPayment',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.page = 1; // Reset page on filter change
    },
    setPage: (state, action) => {
      state.page = action.payload;
    },
    setLimit: (state, action) => {
      state.limit = action.payload;
      state.page = 1;
    },
    clearSelected: (state) => {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchCustomerPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomerPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data || [];
        state.count = action.payload.count || 0;
        state.page = action.payload.page || 1;
        state.limit = action.payload.limit || 25;
        state.totalPages = action.payload.totalPages || 1;
      })
      .addCase(fetchCustomerPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Single
      .addCase(fetchCustomerPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomerPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
      })
      .addCase(fetchCustomerPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create
      .addCase(createCustomerPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCustomerPayment.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createCustomerPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update
      .addCase(updateCustomerPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCustomerPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
      })
      .addCase(updateCustomerPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete
      .addCase(deleteCustomerPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCustomerPayment.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(deleteCustomerPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Post
      .addCase(postCustomerPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(postCustomerPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
      })
      .addCase(postCustomerPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Cancel
      .addCase(cancelCustomerPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelCustomerPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
      })
      .addCase(cancelCustomerPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setFilters, setPage, setLimit, clearSelected } = customerPaymentSlice.actions;
export default customerPaymentSlice.reducer;