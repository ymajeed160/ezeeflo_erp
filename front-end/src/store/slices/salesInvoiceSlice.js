import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import SalesInvoiceApi from '../../services/salesInvoiceApi';

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
    startDate: '',
    endDate: '',
    order: 'createdAt',
    dir: 'DESC',
  },
};

// Fetch invoices with filtering
export const fetchInvoices = createAsyncThunk(
  'salesInvoice/fetchInvoices',
  async (params, { rejectWithValue }) => {
    try {
      const response = await SalesInvoiceApi.list(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Fetch single invoice
export const fetchInvoice = createAsyncThunk(
  'salesInvoice/fetchInvoice',
  async (id, { rejectWithValue }) => {
    try {
      const response = await SalesInvoiceApi.getById(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Create invoice
export const createInvoice = createAsyncThunk(
  'salesInvoice/createInvoice',
  async (data, { rejectWithValue }) => {
    try {
      const response = await SalesInvoiceApi.create(data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Update invoice
export const updateInvoice = createAsyncThunk(
  'salesInvoice/updateInvoice',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await SalesInvoiceApi.update(id, data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Delete invoice
export const deleteInvoice = createAsyncThunk(
  'salesInvoice/deleteInvoice',
  async (id, { rejectWithValue }) => {
    try {
      await SalesInvoiceApi.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Post invoice
export const postInvoice = createAsyncThunk(
  'salesInvoice/postInvoice',
  async (id, { rejectWithValue }) => {
    try {
      const response = await SalesInvoiceApi.post(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Cancel invoice
export const cancelInvoice = createAsyncThunk(
  'salesInvoice/cancelInvoice',
  async (id, { rejectWithValue }) => {
    try {
      const response = await SalesInvoiceApi.cancel(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Generate from Sales Order
export const generateFromSalesOrder = createAsyncThunk(
  'salesInvoice/generateFromSalesOrder',
  async (salesOrderId, { rejectWithValue }) => {
    try {
      const response = await SalesInvoiceApi.generateFromSalesOrder(salesOrderId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Generate from Delivery Note
export const generateFromDeliveryNote = createAsyncThunk(
  'salesInvoice/generateFromDeliveryNote',
  async (deliveryNoteId, { rejectWithValue }) => {
    try {
      const response = await SalesInvoiceApi.generateFromDeliveryNote(deliveryNoteId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const salesInvoiceSlice = createSlice({
  name: 'salesInvoice',
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
    // Fetch Invoices
    builder
      .addCase(fetchInvoices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.count = action.payload.count;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Single
    builder
      .addCase(fetchInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvoice.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
      })
      .addCase(fetchInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Create
    builder
      .addCase(createInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createInvoice.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
        state.count += 1;
      })
      .addCase(createInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update
    builder
      .addCase(updateInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateInvoice.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((i) => i.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
        state.selected = action.payload;
      })
      .addCase(updateInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Delete
    builder
      .addCase(deleteInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteInvoice.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((i) => i.id !== action.payload);
        state.count -= 1;
      })
      .addCase(deleteInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Post
    builder
      .addCase(postInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(postInvoice.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((i) => i.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
        state.selected = action.payload;
      })
      .addCase(postInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Cancel
    builder
      .addCase(cancelInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelInvoice.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((i) => i.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
        state.selected = action.payload;
      })
      .addCase(cancelInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Generate from SO
    builder
      .addCase(generateFromSalesOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateFromSalesOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
        state.count += 1;
      })
      .addCase(generateFromSalesOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Generate from DN
    builder
      .addCase(generateFromDeliveryNote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateFromDeliveryNote.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
        state.count += 1;
      })
      .addCase(generateFromDeliveryNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearSelected, setFilters, clearError } = salesInvoiceSlice.actions;
export default salesInvoiceSlice.reducer;