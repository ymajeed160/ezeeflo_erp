import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import customerApi from '../../services/customerApi';

// Async Thunks
export const fetchCustomers = createAsyncThunk('customers/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const response = await customerApi.getAll(params);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchCustomer = createAsyncThunk('customers/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const response = await customerApi.getById(id);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchCustomerSelect = createAsyncThunk('customers/fetchSelect', async (search = '', { rejectWithValue }) => {
  try {
    const response = await customerApi.getSelect(search);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const createCustomer = createAsyncThunk('customers/create', async (data, { rejectWithValue }) => {
  try {
    const response = await customerApi.create(data);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updateCustomer = createAsyncThunk('customers/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await customerApi.update(id, data);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const deleteCustomer = createAsyncThunk('customers/delete', async (id, { rejectWithValue }) => {
  try {
    const response = await customerApi.delete(id);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const toggleCustomerStatus = createAsyncThunk('customers/toggleStatus', async (id, { rejectWithValue }) => {
  try {
    const response = await customerApi.toggleStatus(id);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

const initialState = {
  customers: [],
  selectedCustomer: null,
  customerSelect: [],
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  loading: false,
  error: null,
  saving: false,
  deleting: false,
};

const customerSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    clearCustomerError: (state) => {
      state.error = null;
    },
    clearSelectedCustomer: (state) => {
      state.selectedCustomer = null;
    },
    setCustomers: (state, action) => {
      state.customers = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch All
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = action.payload.data;
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch One
    builder
      .addCase(fetchCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomer.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCustomer = action.payload.data;
      })
      .addCase(fetchCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Select (compact list for dropdowns)
    builder
      .addCase(fetchCustomerSelect.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCustomerSelect.fulfilled, (state, action) => {
        state.loading = false;
        state.customerSelect = action.payload.data;
      })
      .addCase(fetchCustomerSelect.rejected, (state) => {
        state.loading = false;
      });

    // Create
    builder
      .addCase(createCustomer.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.saving = false;
        state.customers.unshift(action.payload.data);
        if (state.pagination.total !== undefined) {
          state.pagination.total += 1;
        }
      })
      .addCase(createCustomer.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });

    // Update
    builder
      .addCase(updateCustomer.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        state.saving = false;
        const idx = state.customers.findIndex((c) => c.id === action.payload.data.id);
        if (idx !== -1) {
          state.customers[idx] = action.payload.data;
        }
        state.selectedCustomer = action.payload.data;
      })
      .addCase(updateCustomer.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });

    // Delete
    builder
      .addCase(deleteCustomer.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.deleting = false;
        state.customers = state.customers.filter((c) => c.id !== action.payload.data.id);
        if (state.pagination.total !== undefined) {
          state.pagination.total -= 1;
        }
      })
      .addCase(deleteCustomer.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload;
      });

    // Toggle Status
    builder
      .addCase(toggleCustomerStatus.pending, (state) => {
        state.saving = true;
      })
      .addCase(toggleCustomerStatus.fulfilled, (state, action) => {
        state.saving = false;
        const idx = state.customers.findIndex((c) => c.id === action.payload.data.id);
        if (idx !== -1) {
          state.customers[idx] = action.payload.data;
        }
        state.selectedCustomer = action.payload.data;
      })
      .addCase(toggleCustomerStatus.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });
  },
});

export const { clearCustomerError, clearSelectedCustomer, setCustomers } = customerSlice.actions;
export default customerSlice.reducer;