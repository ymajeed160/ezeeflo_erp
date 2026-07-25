import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import debitNoteApi from '../../services/debitNoteApi';

const initialState = {
  items: [],
  total: 0,
  page: 1,
  limit: 10,
  loading: false,
  error: null,
  currentItem: null,
  currentLoading: false,
  submitting: false,
};

export const fetchDebitNotes = createAsyncThunk('debitNote/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const response = await debitNoteApi.getAll(params);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch debit notes');
  }
});

export const fetchDebitNoteById = createAsyncThunk('debitNote/fetchById', async (id, { rejectWithValue }) => {
  try {
    const response = await debitNoteApi.getById(id);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch debit note');
  }
});

export const createDebitNote = createAsyncThunk('debitNote/create', async (data, { rejectWithValue }) => {
  try {
    const response = await debitNoteApi.create(data);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create debit note');
  }
});

export const updateDebitNote = createAsyncThunk('debitNote/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await debitNoteApi.update(id, data);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update debit note');
  }
});

export const deleteDebitNote = createAsyncThunk('debitNote/delete', async (id, { rejectWithValue }) => {
  try {
    await debitNoteApi.delete(id);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete debit note');
  }
});

export const approveDebitNote = createAsyncThunk('debitNote/approve', async (id, { rejectWithValue }) => {
  try {
    const response = await debitNoteApi.approve(id);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to approve debit note');
  }
});

const debitNoteSlice = createSlice({
  name: 'debitNote',
  initialState,
  reducers: {
    clearCurrent: (state) => { state.currentItem = null; state.currentLoading = false; },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDebitNotes.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchDebitNotes.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data.rows;
        state.total = action.payload.data.count;
        state.page = action.payload.data.page;
        state.limit = action.payload.data.limit;
      })
      .addCase(fetchDebitNotes.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(fetchDebitNoteById.pending, (state) => { state.currentLoading = true; state.error = null; })
      .addCase(fetchDebitNoteById.fulfilled, (state, action) => { state.currentLoading = false; state.currentItem = action.payload; })
      .addCase(fetchDebitNoteById.rejected, (state, action) => { state.currentLoading = false; state.error = action.payload; })

      .addCase(createDebitNote.pending, (state) => { state.submitting = true; state.error = null; })
      .addCase(createDebitNote.fulfilled, (state) => { state.submitting = false; })
      .addCase(createDebitNote.rejected, (state, action) => { state.submitting = false; state.error = action.payload; })

      .addCase(updateDebitNote.pending, (state) => { state.submitting = true; state.error = null; })
      .addCase(updateDebitNote.fulfilled, (state) => { state.submitting = false; })
      .addCase(updateDebitNote.rejected, (state, action) => { state.submitting = false; state.error = action.payload; })

      .addCase(deleteDebitNote.pending, (state) => { state.submitting = true; state.error = null; })
      .addCase(deleteDebitNote.fulfilled, (state, action) => {
        state.submitting = false;
        state.items = state.items.filter(item => item.id !== action.payload);
        state.total -= 1;
      })
      .addCase(deleteDebitNote.rejected, (state, action) => { state.submitting = false; state.error = action.payload; })

      .addCase(approveDebitNote.pending, (state) => { state.submitting = true; state.error = null; })
      .addCase(approveDebitNote.fulfilled, (state, action) => {
        state.submitting = false;
        const idx = state.items.findIndex(i => i.id === action.payload.id);
        if (idx >= 0) state.items[idx] = action.payload;
        if (state.currentItem && state.currentItem.id === action.payload.id) state.currentItem = action.payload;
      })
      .addCase(approveDebitNote.rejected, (state, action) => { state.submitting = false; state.error = action.payload; });
  }
});

export const { clearCurrent, clearError } = debitNoteSlice.actions;
export default debitNoteSlice.reducer;