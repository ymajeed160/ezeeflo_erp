import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import journalEntryApi from '../../services/journalEntryApi';

export const fetchJournalEntries = createAsyncThunk(
  'journalEntries/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await journalEntryApi.getAll(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchJournalEntry = createAsyncThunk(
  'journalEntries/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      const response = await journalEntryApi.getById(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchJournalEntryByNumber = createAsyncThunk(
  'journalEntries/fetchByNumber',
  async (entryNumber, { rejectWithValue }) => {
    try {
      const response = await journalEntryApi.getByNumber(entryNumber);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createJournalEntry = createAsyncThunk(
  'journalEntries/create',
  async (data, { rejectWithValue }) => {
    try {
      const response = await journalEntryApi.create(data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateJournalEntry = createAsyncThunk(
  'journalEntries/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await journalEntryApi.update(id, data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteJournalEntry = createAsyncThunk(
  'journalEntries/delete',
  async (id, { rejectWithValue }) => {
    try {
      await journalEntryApi.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const postJournalEntry = createAsyncThunk(
  'journalEntries/post',
  async (id, { rejectWithValue }) => {
    try {
      const response = await journalEntryApi.post(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const reverseJournalEntry = createAsyncThunk(
  'journalEntries/reverse',
  async (id, { rejectWithValue }) => {
    try {
      const response = await journalEntryApi.reverse(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const journalEntrySlice = createSlice({
  name: 'journalEntries',
  initialState: {
    items: [],
    selectedEntry: null,
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
    loading: false,
    error: null,
  },
  reducers: {
    clearSelectedEntry: (state) => {
      state.selectedEntry = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setPage: (state, action) => {
      state.page = action.payload;
    },
    setLimit: (state, action) => {
      state.limit = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchJournalEntries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJournalEntries.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data?.rows || action.payload.data || [];
        state.total = action.payload.pagination?.total || action.payload.total || 0;
        state.page = action.payload.pagination?.page || state.page;
        state.totalPages = action.payload.pagination?.totalPages || 1;
      })
      .addCase(fetchJournalEntries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.payload || 'Failed to fetch journal entries';
      })
      // Fetch One
      .addCase(fetchJournalEntry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJournalEntry.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedEntry = action.payload.data;
      })
      .addCase(fetchJournalEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.payload || 'Failed to fetch journal entry';
      })
      // Create
      .addCase(createJournalEntry.fulfilled, (state, action) => {
        state.items.unshift(action.payload.data);
        state.total += 1;
      })
      .addCase(createJournalEntry.rejected, (state, action) => {
        state.error = action.payload?.message || action.payload || 'Failed to create journal entry';
      })
      // Update
      .addCase(updateJournalEntry.fulfilled, (state, action) => {
        const idx = state.items.findIndex((e) => e.id === action.payload.data.id);
        if (idx !== -1) state.items[idx] = action.payload.data;
        if (state.selectedEntry?.id === action.payload.data.id)
          state.selectedEntry = action.payload.data;
      })
      .addCase(updateJournalEntry.rejected, (state, action) => {
        state.error = action.payload?.message || action.payload || 'Failed to update journal entry';
      })
      // Delete
      .addCase(deleteJournalEntry.fulfilled, (state, action) => {
        state.items = state.items.filter((e) => e.id !== action.payload);
        state.total -= 1;
      })
      .addCase(deleteJournalEntry.rejected, (state, action) => {
        state.error = action.payload?.message || action.payload || 'Failed to delete journal entry';
      })
      // Post
      .addCase(postJournalEntry.fulfilled, (state, action) => {
        const idx = state.items.findIndex((e) => e.id === action.payload.data.id);
        if (idx !== -1) state.items[idx] = action.payload.data;
        if (state.selectedEntry?.id === action.payload.data.id)
          state.selectedEntry = action.payload.data;
      })
      .addCase(postJournalEntry.rejected, (state, action) => {
        state.error = action.payload?.message || action.payload || 'Failed to post journal entry';
      })
      // Reverse
      .addCase(reverseJournalEntry.fulfilled, (state, action) => {
        state.items.unshift(action.payload.data);
        state.total += 1;
      })
      .addCase(reverseJournalEntry.rejected, (state, action) => {
        state.error = action.payload?.message || action.payload || 'Failed to reverse journal entry';
      });
  },
});

export const { clearSelectedEntry, clearError, setPage, setLimit } = journalEntrySlice.actions;
export default journalEntrySlice.reducer;