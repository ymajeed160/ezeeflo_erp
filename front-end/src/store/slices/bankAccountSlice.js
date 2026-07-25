import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import bankAccountApi from '../../services/bankAccountApi';

export const fetchBankAccounts = createAsyncThunk(
  'bankAccounts/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await bankAccountApi.getAll(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchBankAccount = createAsyncThunk(
  'bankAccounts/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await bankAccountApi.getById(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchActiveBankAccounts = createAsyncThunk(
  'bankAccounts/fetchActive',
  async (_, { rejectWithValue }) => {
    try {
      const response = await bankAccountApi.getActive();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createBankAccount = createAsyncThunk(
  'bankAccounts/create',
  async (data, { rejectWithValue }) => {
    try {
      const response = await bankAccountApi.create(data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateBankAccount = createAsyncThunk(
  'bankAccounts/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await bankAccountApi.update(id, data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteBankAccount = createAsyncThunk(
  'bankAccounts/delete',
  async (id, { rejectWithValue }) => {
    try {
      await bankAccountApi.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const toggleBankAccountStatus = createAsyncThunk(
  'bankAccounts/toggleStatus',
  async (id, { rejectWithValue }) => {
    try {
      const response = await bankAccountApi.toggleStatus(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const setDefaultBankAccount = createAsyncThunk(
  'bankAccounts/setDefault',
  async (id, { rejectWithValue }) => {
    try {
      const response = await bankAccountApi.setDefault(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const bankAccountSlice = createSlice({
  name: 'bankAccounts',
  initialState: {
    bankAccounts: [],
    selectedBankAccount: null,
    activeBankAccounts: [],
    loading: false,
    error: null,
    total: 0,
    page: 1,
    pageSize: 10,
  },
  reducers: {
    clearSelected: (state) => {
      state.selectedBankAccount = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchAll
      .addCase(fetchBankAccounts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBankAccounts.fulfilled, (state, action) => {
        state.loading = false;
        state.bankAccounts = action.payload.data || action.payload;
        state.total = action.payload.meta?.pagination?.total || action.payload.total || 0;
        state.page = action.payload.meta?.pagination?.page || 1;
        state.pageSize = action.payload.meta?.pagination?.limit || 10;
      })
      .addCase(fetchBankAccounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // fetchById
      .addCase(fetchBankAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBankAccount.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedBankAccount = action.payload.data || action.payload;
      })
      .addCase(fetchBankAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // fetchActive
      .addCase(fetchActiveBankAccounts.fulfilled, (state, action) => {
        state.activeBankAccounts = action.payload.data || action.payload;
      })
      // create
      .addCase(createBankAccount.fulfilled, (state, action) => {
        const newItem = action.payload.data || action.payload;
        state.bankAccounts.unshift(newItem);
      })
      // update
      .addCase(updateBankAccount.fulfilled, (state, action) => {
        const updated = action.payload.data || action.payload;
        const idx = state.bankAccounts.findIndex((i) => i.id === updated.id);
        if (idx !== -1) state.bankAccounts[idx] = updated;
      })
      // delete
      .addCase(deleteBankAccount.fulfilled, (state, action) => {
        state.bankAccounts = state.bankAccounts.filter((i) => i.id !== action.payload);
      })
      // toggleStatus
      .addCase(toggleBankAccountStatus.fulfilled, (state, action) => {
        const toggled = action.payload.data || action.payload;
        const idx = state.bankAccounts.findIndex((i) => i.id === toggled.id);
        if (idx !== -1) state.bankAccounts[idx] = toggled;
      })
      // setDefault
      .addCase(setDefaultBankAccount.fulfilled, (state, action) => {
        const updated = action.payload.data || action.payload;
        // Clear default flag on all others and set this one
        state.bankAccounts = state.bankAccounts.map((ba) => ({
          ...ba,
          isDefault: ba.id === updated.id ? true : false,
        }));
      });
  },
});

export const { clearSelected, clearError } = bankAccountSlice.actions;
export default bankAccountSlice.reducer;
