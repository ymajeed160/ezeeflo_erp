import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import reportApi from '../../services/reportApi';

export const fetchGeneralLedgerReport = createAsyncThunk(
  'reports/fetchGeneralLedger',
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await reportApi.getGeneralLedger(params);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch General Ledger report');
    }
  }
);

const initialState = {
  // General Ledger
  glReport: null,
  glSummary: null,
  glData: [],
  glPagination: { page: 1, pageSize: 50, totalRecords: 0, totalPages: 0 },
  glLoading: false,
  glError: null,
};

const reportSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    clearGLError: (state) => { state.glError = null; },
    clearGLReport: (state) => {
      state.glReport = null;
      state.glSummary = null;
      state.glData = [];
      state.glPagination = { page: 1, pageSize: 50, totalRecords: 0, totalPages: 0 };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGeneralLedgerReport.pending, (state) => {
        state.glLoading = true;
        state.glError = null;
      })
      .addCase(fetchGeneralLedgerReport.fulfilled, (state, action) => {
        state.glLoading = false;
        state.glReport = action.payload;
        state.glSummary = action.payload.summary || null;
        state.glData = action.payload.data || [];
        state.glPagination = action.payload.pagination || { page: 1, pageSize: 50, totalRecords: 0, totalPages: 0 };
      })
      .addCase(fetchGeneralLedgerReport.rejected, (state, action) => {
        state.glLoading = false;
        state.glError = action.payload || 'Failed to fetch report';
      });
  },
});

export const { clearGLError, clearGLReport } = reportSlice.actions;
export default reportSlice.reducer;
