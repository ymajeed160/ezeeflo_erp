import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import EmployeeApi from '../../services/employeeApi';

// ── Async Thunks ──

export const fetchEmployees = createAsyncThunk(
  'hrEmployees/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await EmployeeApi.list(params);
      return {
        data: response.data?.data || [],
        pagination: response.data?.meta?.pagination || {},
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load employees');
    }
  }
);

export const fetchEmployee = createAsyncThunk(
  'hrEmployees/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      const response = await EmployeeApi.getById(id);
      return response.data?.data || null;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load employee');
    }
  }
);

export const createEmployee = createAsyncThunk(
  'hrEmployees/create',
  async (data, { rejectWithValue }) => {
    try {
      const response = await EmployeeApi.create(data);
      return response.data?.data || null;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create employee');
    }
  }
);

export const updateEmployee = createAsyncThunk(
  'hrEmployees/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await EmployeeApi.update(id, data);
      return response.data?.data || null;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update employee');
    }
  }
);

export const deleteEmployee = createAsyncThunk(
  'hrEmployees/delete',
  async (id, { rejectWithValue }) => {
    try {
      await EmployeeApi.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete employee');
    }
  }
);

// ── Slice ──

const employeeSlice = createSlice({
  name: 'hrEmployees',
  initialState: {
    list: [],
    pagination: null,
    selectedEmployee: null,
    loading: false,
    detailLoading: false,
    saving: false,
    error: null,
  },
  reducers: {
    clearSelectedEmployee: (state) => {
      state.selectedEmployee = null;
    },
    clearEmployeeError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch All
    builder.addCase(fetchEmployees.pending, (state) => { state.loading = true; state.error = null; });
    builder.addCase(fetchEmployees.fulfilled, (state, action) => {
      state.loading = false;
      state.list = action.payload.data;
      state.pagination = action.payload.pagination;
    });
    builder.addCase(fetchEmployees.rejected, (state, action) => { state.loading = false; state.error = action.payload; });

    // Fetch One
    builder.addCase(fetchEmployee.pending, (state) => { state.detailLoading = true; });
    builder.addCase(fetchEmployee.fulfilled, (state, action) => { state.detailLoading = false; state.selectedEmployee = action.payload; });
    builder.addCase(fetchEmployee.rejected, (state, action) => { state.detailLoading = false; state.error = action.payload; });

    // Create
    builder.addCase(createEmployee.pending, (state) => { state.saving = true; });
    builder.addCase(createEmployee.fulfilled, (state) => { state.saving = false; });
    builder.addCase(createEmployee.rejected, (state, action) => { state.saving = false; state.error = action.payload; });

    // Update
    builder.addCase(updateEmployee.pending, (state) => { state.saving = true; });
    builder.addCase(updateEmployee.fulfilled, (state, action) => {
      state.saving = false;
      state.selectedEmployee = action.payload;
      const idx = state.list.findIndex(e => e.id === action.payload.id);
      if (idx !== -1) state.list[idx] = action.payload;
    });
    builder.addCase(updateEmployee.rejected, (state, action) => { state.saving = false; state.error = action.payload; });

    // Delete
    builder.addCase(deleteEmployee.pending, (state) => { state.saving = true; });
    builder.addCase(deleteEmployee.fulfilled, (state, action) => {
      state.saving = false;
      state.list = state.list.filter(e => e.id !== action.payload);
    });
    builder.addCase(deleteEmployee.rejected, (state, action) => { state.saving = false; state.error = action.payload; });
  },
});

export const { clearSelectedEmployee, clearEmployeeError } = employeeSlice.actions;
export default employeeSlice.reducer;
