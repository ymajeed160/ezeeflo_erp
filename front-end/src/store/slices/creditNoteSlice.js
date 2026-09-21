import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import CreditNoteApi from '../../services/creditNoteApi';

const initialState = {
  items: [],
  selected: null,
  loading: false,
  error: null,
  count: 0,
  page: 1,
  limit: 25,
  totalPages: 1,
  filters: {
    search: '',
    status: '',
    customerId: '',
    warehouseId: '',
    returnId: '',
    startDate: '',
    endDate: '',
    order: 'createdAt',
    dir: 'DESC',
  },
};

// Fetch credit notes with filtering
export const fetchCreditNotes = createAsyncThunk(
  'creditNote/fetchCreditNotes',
  async (params, { rejectWithValue }) => {
    try {
      const response = await CreditNoteApi.list(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Fetch single credit note
export const fetchCreditNote = createAsyncThunk(
  'creditNote/fetchCreditNote',
  async (id, { rejectWithValue }) => {
    try {
      const response = await CreditNoteApi.getById(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Create credit note
export const createCreditNote = createAsyncThunk(
  'creditNote/createCreditNote',
  async (data, { rejectWithValue }) => {
    try {
      const response = await CreditNoteApi.create(data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Update credit note
export const updateCreditNote = createAsyncThunk(
  'creditNote/updateCreditNote',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await CreditNoteApi.update(id, data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Delete credit note
export const deleteCreditNote = createAsyncThunk(
  'creditNote/deleteCreditNote',
  async (id, { rejectWithValue }) => {
    try {
      await CreditNoteApi.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Post credit note
export const postCreditNote = createAsyncThunk(
  'creditNote/postCreditNote',
  async (id, { rejectWithValue }) => {
    try {
      const response = await CreditNoteApi.post(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Cancel credit note
export const cancelCreditNote = createAsyncThunk(
  'creditNote/cancelCreditNote',
  async (id, { rejectWithValue }) => {
    try {
      const response = await CreditNoteApi.cancel(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const creditNoteSlice = createSlice({
  name: 'creditNote',
  initialState,
  reducers: {
    clearSelected(state) {
      state.selected = null;
    },
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Credit Notes
    builder
      .addCase(fetchCreditNotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCreditNotes.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.count = action.payload.count;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchCreditNotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Single
    builder
      .addCase(fetchCreditNote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCreditNote.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
      })
      .addCase(fetchCreditNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Create
    builder
      .addCase(createCreditNote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCreditNote.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
        state.count += 1;
      })
      .addCase(createCreditNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update
    builder
      .addCase(updateCreditNote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCreditNote.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((i) => i.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
        state.selected = action.payload;
      })
      .addCase(updateCreditNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Delete
    builder
      .addCase(deleteCreditNote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCreditNote.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((i) => i.id !== action.payload);
        state.count -= 1;
      })
      .addCase(deleteCreditNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Post
    builder
      .addCase(postCreditNote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(postCreditNote.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((i) => i.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
        state.selected = action.payload;
      })
      .addCase(postCreditNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Cancel
    builder
      .addCase(cancelCreditNote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelCreditNote.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((i) => i.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
        state.selected = action.payload;
      })
      .addCase(cancelCreditNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearSelected, setFilters, clearError } = creditNoteSlice.actions;
export default creditNoteSlice.reducer;