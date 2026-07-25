import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import auditApi from '../../services/auditApi';

export const fetchAuditLogs = createAsyncThunk('auditLogs/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const response = await auditApi.getAll(params);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchAuditLog = createAsyncThunk('auditLogs/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const response = await auditApi.getById(id);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchEntityHistory = createAsyncThunk('auditLogs/fetchEntityHistory', async ({ entityType, entityId, params }, { rejectWithValue }) => {
  try {
    const response = await auditApi.getEntityHistory(entityType, entityId, params);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

const auditSlice = createSlice({
  name: 'auditLogs',
  initialState: {
    items: [],
    selectedLog: null,
    entityHistory: [],
    total: 0,
    page: 1,
    limit: 20,
    loading: false,
    error: null,
  },
  reducers: {
    clearSelected: (state) => { state.selectedLog = null; },
    clearError: (state) => { state.error = null; },
    setPage: (state, action) => { state.page = action.payload; },
    clearEntityHistory: (state) => { state.entityHistory = []; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAuditLogs.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAuditLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data || [];
        state.total = action.payload.meta?.pagination?.total || action.payload.total || 0;
        state.page = action.payload.meta?.pagination?.page || 1;
      })
      .addCase(fetchAuditLogs.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchAuditLog.pending, (state) => { state.loading = true; })
      .addCase(fetchAuditLog.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedLog = action.payload.data;
      })
      .addCase(fetchAuditLog.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchEntityHistory.pending, (state) => { state.loading = true; })
      .addCase(fetchEntityHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.entityHistory = action.payload.data || [];
      })
      .addCase(fetchEntityHistory.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export const { clearSelected, clearError, setPage, clearEntityHistory } = auditSlice.actions;
export default auditSlice.reducer;
