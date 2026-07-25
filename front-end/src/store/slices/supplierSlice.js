import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import supplierApi from '../../services/supplierApi';

// Async Thunks
export const fetchSuppliers = createAsyncThunk('suppliers/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const response = await supplierApi.getAll(params);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchSupplier = createAsyncThunk('suppliers/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const response = await supplierApi.getById(id);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchSupplierSelect = createAsyncThunk('suppliers/fetchSelect', async (search = '', { rejectWithValue }) => {
  try {
    const response = await supplierApi.getSelect(search);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const createSupplier = createAsyncThunk('suppliers/create', async (data, { rejectWithValue }) => {
  try {
    const response = await supplierApi.create(data);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updateSupplier = createAsyncThunk('suppliers/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await supplierApi.update(id, data);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const deleteSupplier = createAsyncThunk('suppliers/delete', async (id, { rejectWithValue }) => {
  try {
    const response = await supplierApi.delete(id);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const toggleSupplierStatus = createAsyncThunk('suppliers/toggleStatus', async (id, { rejectWithValue }) => {
  try {
    const response = await supplierApi.toggleStatus(id);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

const initialState = {
  suppliers: [],
  selectedSupplier: null,
  supplierSelect: [],
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

const supplierSlice = createSlice({
  name: 'suppliers',
  initialState,
  reducers: {
    clearSupplierError: (state) => {
      state.error = null;
    },
    clearSelectedSupplier: (state) => {
      state.selectedSupplier = null;
    },
    setSuppliers: (state, action) => {
      state.suppliers = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch All
    builder
      .addCase(fetchSuppliers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSuppliers.fulfilled, (state, action) => {
        state.loading = false;
        state.suppliers = action.payload.data;
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchSuppliers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch One
    builder
      .addCase(fetchSupplier.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSupplier.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedSupplier = action.payload.data;
      })
      .addCase(fetchSupplier.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Select
    builder
      .addCase(fetchSupplierSelect.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSupplierSelect.fulfilled, (state, action) => {
        state.loading = false;
        state.supplierSelect = action.payload.data;
      })
      .addCase(fetchSupplierSelect.rejected, (state) => {
        state.loading = false;
      });

    // Create
    builder
      .addCase(createSupplier.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createSupplier.fulfilled, (state, action) => {
        state.saving = false;
        state.suppliers.unshift(action.payload.data);
        if (state.pagination.total !== undefined) {
          state.pagination.total += 1;
        }
      })
      .addCase(createSupplier.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });

    // Update
    builder
      .addCase(updateSupplier.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateSupplier.fulfilled, (state, action) => {
        state.saving = false;
        const idx = state.suppliers.findIndex((s) => s.id === action.payload.data.id);
        if (idx !== -1) {
          state.suppliers[idx] = action.payload.data;
        }
        state.selectedSupplier = action.payload.data;
      })
      .addCase(updateSupplier.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });

    // Delete
    builder
      .addCase(deleteSupplier.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteSupplier.fulfilled, (state, action) => {
        state.deleting = false;
        state.suppliers = state.suppliers.filter((s) => s.id !== action.payload.data.id);
        if (state.pagination.total !== undefined) {
          state.pagination.total -= 1;
        }
      })
      .addCase(deleteSupplier.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload;
      });

    // Toggle Status
    builder
      .addCase(toggleSupplierStatus.pending, (state) => {
        state.saving = true;
      })
      .addCase(toggleSupplierStatus.fulfilled, (state, action) => {
        state.saving = false;
        const idx = state.suppliers.findIndex((s) => s.id === action.payload.data.id);
        if (idx !== -1) {
          state.suppliers[idx] = action.payload.data;
        }
        state.selectedSupplier = action.payload.data;
      })
      .addCase(toggleSupplierStatus.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });
  },
});

export const { clearSupplierError, clearSelectedSupplier, setSuppliers } = supplierSlice.actions;
export default supplierSlice.reducer;