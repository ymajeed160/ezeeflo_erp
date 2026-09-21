import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import generalLedgerApi from '../../services/generalLedgerApi';

// Fetch general ledger data based on filters
export const fetchGeneralLedger = createAsyncThunk(
  'generalLedger/fetchGeneralLedger',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await generalLedgerApi.getLedger(filters);
      return response;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || 'Failed to fetch general ledger'
      );
    }
  }
);

// Fetch accounts for the ledger filter dropdown
export const fetchLedgerAccounts = createAsyncThunk(
  'generalLedger/fetchLedgerAccounts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await generalLedgerApi.getLedgerAccounts();
      return response;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || 'Failed to fetch ledger accounts'
      );
    }
  }
);

// Export ledger data (full dataset without pagination)
export const exportLedger = createAsyncThunk(
  'generalLedger/exportLedger',
  async (params, { rejectWithValue }) => {
    try {
      const response = await generalLedgerApi.exportLedger(params);
      return response;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || 'Failed to export ledger'
      );
    }
  }
);

const initialState = {
  // Ledger data
  ledger: {
    openingBalance: 0,
    totalDebit: 0,
    totalCredit: 0,
    closingBalance: 0,
    transactions: [],
  },

  // Filter accounts for dropdown
  accounts: [],

  // Loading states
  loading: false,
  accountsLoading: false,
  exportLoading: false,

  // Export data buffer
  exportData: null,

  // Error
  error: null,

  // Pagination
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  },

  // Filters
  filters: {
    accountId: '',
    dateFrom: '',
    dateTo: '',
    accountType: '',
    journalNumber: '',
    referenceNumber: '',
  },
};

const generalLedgerSlice = createSlice({
  name: 'generalLedger',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
      state.ledger = initialState.ledger;
      state.pagination = initialState.pagination;
      state.error = null;
    },
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    },
    setLimit: (state, action) => {
      state.pagination.limit = action.payload;
    },
    clearLedgerData: (state) => {
      state.ledger = initialState.ledger;
      state.pagination = initialState.pagination;
      state.error = null;
    },
    clearExportData: (state) => {
      state.exportData = null;
      state.exportLoading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- fetchGeneralLedger ---
      .addCase(fetchGeneralLedger.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGeneralLedger.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        // Handle both wrapped and unwrapped responses
        const data = payload?.data || payload;
        if (data) {
          state.ledger = {
            openingBalance: data.openingBalance ?? 0,
            totalDebit: data.totalDebit ?? 0,
            totalCredit: data.totalCredit ?? 0,
            closingBalance: data.closingBalance ?? 0,
            transactions: data.transactions ?? [],
          };
          state.pagination = {
            ...state.pagination,
            total: data.total ?? data.transactions?.length ?? 0,
            totalPages: data.totalPages ?? 1,
          };
        }
      })
      .addCase(fetchGeneralLedger.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- fetchLedgerAccounts ---
      .addCase(fetchLedgerAccounts.pending, (state) => {
        state.accountsLoading = true;
      })
      .addCase(fetchLedgerAccounts.fulfilled, (state, action) => {
        state.accountsLoading = false;
        const payload = action.payload;
        state.accounts = payload?.data || payload || [];
      })
      .addCase(fetchLedgerAccounts.rejected, (state, action) => {
        state.accountsLoading = false;
        state.error = action.payload;
      })

      // --- exportLedger ---
      .addCase(exportLedger.pending, (state) => {
        state.exportLoading = true;
      })
      .addCase(exportLedger.fulfilled, (state, action) => {
        state.exportLoading = false;
        state.exportData = action.payload;
      })
      .addCase(exportLedger.rejected, (state, action) => {
        state.exportLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setFilters,
  resetFilters,
  setPage,
  setLimit,
  clearLedgerData,
  clearExportData,
  clearError,
} = generalLedgerSlice.actions;

export default generalLedgerSlice.reducer;