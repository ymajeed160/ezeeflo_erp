import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import deliveryNoteApi from '../../services/deliveryNoteApi';

// Async Thunks
export const fetchDeliveryNotes = createAsyncThunk(
  'deliveryNotes/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await deliveryNoteApi.list(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchDeliveryNoteById = createAsyncThunk(
  'deliveryNotes/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await deliveryNoteApi.getById(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchNextDeliveryNumber = createAsyncThunk(
  'deliveryNotes/fetchNextNumber',
  async (_, { rejectWithValue }) => {
    try {
      const response = await deliveryNoteApi.getNextNumber();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createDeliveryNote = createAsyncThunk(
  'deliveryNotes/create',
  async (data, { rejectWithValue }) => {
    try {
      const response = await deliveryNoteApi.create(data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const generateDeliveryFromSO = createAsyncThunk(
  'deliveryNotes/generateFromSO',
  async (data, { rejectWithValue }) => {
    try {
      const response = await deliveryNoteApi.generateFromSalesOrder(data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateDeliveryNote = createAsyncThunk(
  'deliveryNotes/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await deliveryNoteApi.update(id, data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteDeliveryNote = createAsyncThunk(
  'deliveryNotes/delete',
  async (id, { rejectWithValue }) => {
    try {
      const response = await deliveryNoteApi.delete(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateDeliveryNoteStatus = createAsyncThunk(
  'deliveryNotes/updateStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await deliveryNoteApi.updateStatus(id, status);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  items: [],
  pagination: {
    page: 1,
    total: 0,
    totalPages: 0,
  },
  selectedDeliveryNote: null,
  nextNumber: null,
  loading: false,
  error: null,
  createLoading: false,
  createError: null,
  updateLoading: false,
  updateError: null,
  deleteLoading: false,
  deleteError: null,
  statusLoading: false,
  statusError: null,
};

const deliveryNoteSlice = createSlice({
  name: 'deliveryNotes',
  initialState,
  reducers: {
    clearSelectedDeliveryNote: (state) => {
      state.selectedDeliveryNote = null;
    },
    clearError: (state) => {
      state.error = null;
      state.createError = null;
      state.updateError = null;
      state.deleteError = null;
      state.statusError = null;
    },
    clearNextNumber: (state) => {
      state.nextNumber = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchDeliveryNotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDeliveryNotes.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data || [];
        state.pagination = action.payload.pagination || initialState.pagination;
      })
      .addCase(fetchDeliveryNotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch delivery notes';
      })

      // Fetch By ID
      .addCase(fetchDeliveryNoteById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDeliveryNoteById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedDeliveryNote = action.payload.data || null;
      })
      .addCase(fetchDeliveryNoteById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch delivery note';
      })

      // Fetch Next Number
      .addCase(fetchNextDeliveryNumber.fulfilled, (state, action) => {
        state.nextNumber = action.payload?.data?.deliveryNumber || null;
      })
      .addCase(fetchNextDeliveryNumber.rejected, (state, action) => {
        state.nextNumber = null;
      })

      // Create
      .addCase(createDeliveryNote.pending, (state) => {
        state.createLoading = true;
        state.createError = null;
      })
      .addCase(createDeliveryNote.fulfilled, (state, action) => {
        state.createLoading = false;
        if (action.payload?.data) {
          state.items.unshift(action.payload.data);
        }
      })
      .addCase(createDeliveryNote.rejected, (state, action) => {
        state.createLoading = false;
        state.createError = action.payload?.message || 'Failed to create delivery note';
      })

      // Generate From SO
      .addCase(generateDeliveryFromSO.pending, (state) => {
        state.createLoading = true;
        state.createError = null;
      })
      .addCase(generateDeliveryFromSO.fulfilled, (state, action) => {
        state.createLoading = false;
        if (action.payload?.data) {
          state.items.unshift(action.payload.data);
        }
      })
      .addCase(generateDeliveryFromSO.rejected, (state, action) => {
        state.createLoading = false;
        state.createError = action.payload?.message || 'Failed to generate delivery note';
      })

      // Update
      .addCase(updateDeliveryNote.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
      })
      .addCase(updateDeliveryNote.fulfilled, (state, action) => {
        state.updateLoading = false;
        if (action.payload?.data) {
          const index = state.items.findIndex((item) => item.id === action.payload.data.id);
          if (index !== -1) {
            state.items[index] = action.payload.data;
          }
          state.selectedDeliveryNote = action.payload.data;
        }
      })
      .addCase(updateDeliveryNote.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload?.message || 'Failed to update delivery note';
      })

      // Delete
      .addCase(deleteDeliveryNote.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = null;
      })
      .addCase(deleteDeliveryNote.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.items = state.items.filter((item) => item.id !== action.meta.arg);
      })
      .addCase(deleteDeliveryNote.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload?.message || 'Failed to delete delivery note';
      })

      // Update Status
      .addCase(updateDeliveryNoteStatus.pending, (state) => {
        state.statusLoading = true;
        state.statusError = null;
      })
      .addCase(updateDeliveryNoteStatus.fulfilled, (state, action) => {
        state.statusLoading = false;
        if (action.payload?.data) {
          const index = state.items.findIndex((item) => item.id === action.payload.data.id);
          if (index !== -1) {
            state.items[index] = action.payload.data;
          }
          state.selectedDeliveryNote = action.payload.data;
        }
      })
      .addCase(updateDeliveryNoteStatus.rejected, (state, action) => {
        state.statusLoading = false;
        state.statusError = action.payload?.message || 'Failed to update delivery note status';
      });
  },
});

export const { clearSelectedDeliveryNote, clearError, clearNextNumber } = deliveryNoteSlice.actions;
export default deliveryNoteSlice.reducer;