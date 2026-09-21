import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import companyApi from '../../services/companyApi';

export const fetchCompanies = createAsyncThunk(
  'company/fetchCompanies',
  async (_, { rejectWithValue }) => {
    try {
      const response = await companyApi.getCompanies();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch companies'
      );
    }
  }
);

export const selectCompany = createAsyncThunk(
  'company/selectCompany',
  async (companyId, { rejectWithValue }) => {
    try {
      const response = await companyApi.selectCompany(companyId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to select company'
      );
    }
  }
);

export const switchCompany = createAsyncThunk(
  'company/switchCompany',
  async (companyId, { rejectWithValue }) => {
    try {
      const response = await companyApi.switchCompany(companyId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to switch company'
      );
    }
  }
);

const companySlice = createSlice({
  name: 'company',
  initialState: {
    companies: [],
    activeCompany: null,
    activeCompanyId: null,
    loading: false,
    switching: false,
    error: null,
  },
  reducers: {
    clearCompanyError: (state) => {
      state.error = null;
    },
    setActiveCompany: (state, action) => {
      state.activeCompany = action.payload;
      state.activeCompanyId = action.payload?.id || null;
    },
    clearActiveCompany: (state) => {
      state.activeCompany = null;
      state.activeCompanyId = null;
    },
    setCompanies: (state, action) => {
      state.companies = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch companies
      .addCase(fetchCompanies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.loading = false;
        state.companies = action.payload;
      })
      .addCase(fetchCompanies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Select company
      .addCase(selectCompany.pending, (state) => {
        state.switching = true;
        state.error = null;
      })
      .addCase(selectCompany.fulfilled, (state, action) => {
        state.switching = false;
        state.activeCompany = action.payload;
        state.activeCompanyId = action.payload.id;
      })
      .addCase(selectCompany.rejected, (state, action) => {
        state.switching = false;
        state.error = action.payload;
      })
      // Switch company
      .addCase(switchCompany.pending, (state) => {
        state.switching = true;
        state.error = null;
      })
      .addCase(switchCompany.fulfilled, (state, action) => {
        state.switching = false;
        state.activeCompany = action.payload;
        state.activeCompanyId = action.payload.id;
      })
      .addCase(switchCompany.rejected, (state, action) => {
        state.switching = false;
        state.error = action.payload;
      });
  },
});

export const { clearCompanyError, setActiveCompany, clearActiveCompany, setCompanies } =
  companySlice.actions;
export default companySlice.reducer;
