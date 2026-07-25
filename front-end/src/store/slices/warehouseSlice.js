import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import warehouseApi from '../../services/warehouseApi';

export const fetchWarehouses = createAsyncThunk('warehouses/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const response = await warehouseApi.getAll(params);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchWarehouse = createAsyncThunk('warehouses/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const response = await warehouseApi.getById(id);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const createWarehouse = createAsyncThunk('warehouses/create', async (data, { rejectWithValue }) => {
  try {
    const response = await warehouseApi.create(data);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updateWarehouse = createAsyncThunk('warehouses/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await warehouseApi.update(id, data);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const deleteWarehouse = createAsyncThunk('warehouses/delete', async (id, { rejectWithValue }) => {
  try {
    await warehouseApi.delete(id);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const toggleWarehouseStatus = createAsyncThunk('warehouses/toggleStatus', async (id, { rejectWithValue }) => {
  try {
    const response = await warehouseApi.toggleStatus(id);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

const warehouseSlice = createSlice({
  name: 'warehouses',
  initialState: {
    warehouses: [],
    selectedWarehouse: null,
    loading: false,
    error: null,
    total: 0,
    page: 1,
    pageSize: 10,
  },
  reducers: {
    clearSelected: (state) => {
      state.selectedWarehouse = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWarehouses.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchWarehouses.fulfilled, (state, action) => {
        state.loading = false;
        state.warehouses = action.payload.data || action.payload;
        state.total = action.payload.meta?.pagination?.total || action.payload.total || (action.payload.data?.length || 0);
      })
      .addCase(fetchWarehouses.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchWarehouse.pending, (state) => { state.loading = true; })
      .addCase(fetchWarehouse.fulfilled, (state, action) => { state.loading = false; state.selectedWarehouse = action.payload.data || action.payload; })
      .addCase(fetchWarehouse.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createWarehouse.fulfilled, (state, action) => { state.warehouses.unshift(action.payload.data || action.payload); })
      .addCase(updateWarehouse.fulfilled, (state, action) => {
        const updated = action.payload.data || action.payload;
        const idx = state.warehouses.findIndex((i) => i.id === updated.id);
        if (idx !== -1) state.warehouses[idx] = updated;
      })
      .addCase(deleteWarehouse.fulfilled, (state, action) => {
        state.warehouses = state.warehouses.filter((i) => i.id !== action.payload);
      })
      .addCase(toggleWarehouseStatus.fulfilled, (state, action) => {
        const toggled = action.payload.data || action.payload;
        const idx = state.warehouses.findIndex((i) => i.id === toggled.id);
        if (idx !== -1) state.warehouses[idx] = toggled;
      });
  },
});

export const { clearSelected, clearError } = warehouseSlice.actions;
export default warehouseSlice.reducer;