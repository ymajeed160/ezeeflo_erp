import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import sellingResourceApi from '../../services/sellingResourceApi';

// ---- Selling Resources ----
export const fetchSellingResources = createAsyncThunk('sellingResources/fetchAll', async (params, { rejectWithValue }) => {
  try {
    return await sellingResourceApi.getAll(params);
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchSellingResource = createAsyncThunk('sellingResources/fetchOne', async (id, { rejectWithValue }) => {
  try {
    return await sellingResourceApi.getById(id);
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchSellingResourceSelect = createAsyncThunk('sellingResources/fetchSelect', async (search = '', { rejectWithValue }) => {
  try {
    return await sellingResourceApi.getSelect(search);
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const createSellingResource = createAsyncThunk('sellingResources/create', async (data, { rejectWithValue }) => {
  try {
    return await sellingResourceApi.create(data);
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updateSellingResource = createAsyncThunk('sellingResources/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    return await sellingResourceApi.update(id, data);
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const deleteSellingResource = createAsyncThunk('sellingResources/delete', async (id, { rejectWithValue }) => {
  try {
    return await sellingResourceApi.delete(id);
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const toggleSellingResourceStatus = createAsyncThunk('sellingResources/toggleStatus', async (id, { rejectWithValue }) => {
  try {
    return await sellingResourceApi.toggleStatus(id);
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

// ---- Resource Types ----
export const fetchResourceTypes = createAsyncThunk('sellingResources/fetchTypes', async (params, { rejectWithValue }) => {
  try {
    return await sellingResourceApi.getTypes(params);
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const createResourceType = createAsyncThunk('sellingResources/createType', async (data, { rejectWithValue }) => {
  try {
    return await sellingResourceApi.createType(data);
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updateResourceType = createAsyncThunk('sellingResources/updateType', async ({ id, data }, { rejectWithValue }) => {
  try {
    return await sellingResourceApi.updateType(id, data);
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const deleteResourceType = createAsyncThunk('sellingResources/deleteType', async (id, { rejectWithValue }) => {
  try {
    return await sellingResourceApi.deleteType(id);
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

const initialState = {
  resources: [],
  selectedResource: null,
  resourceSelect: [],
  resourceTypes: [],
  pagination: {
    page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false,
  },
  loading: false,
  error: null,
  saving: false,
  deleting: false,
};

const sellingResourceSlice = createSlice({
  name: 'sellingResources',
  initialState,
  reducers: {
    clearSellingResourceError: (state) => { state.error = null; },
    clearSelectedSellingResource: (state) => { state.selectedResource = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSellingResources.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchSellingResources.fulfilled, (state, action) => {
        state.loading = false;
        state.resources = action.payload.data || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchSellingResources.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(fetchSellingResource.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchSellingResource.fulfilled, (state, action) => { state.loading = false; state.selectedResource = action.payload.data; })
      .addCase(fetchSellingResource.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(fetchSellingResourceSelect.fulfilled, (state, action) => { state.resourceSelect = action.payload.data || []; })

      .addCase(createSellingResource.pending, (state) => { state.saving = true; state.error = null; })
      .addCase(createSellingResource.fulfilled, (state) => { state.saving = false; })
      .addCase(createSellingResource.rejected, (state, action) => { state.saving = false; state.error = action.payload; })

      .addCase(updateSellingResource.pending, (state) => { state.saving = true; state.error = null; })
      .addCase(updateSellingResource.fulfilled, (state) => { state.saving = false; })
      .addCase(updateSellingResource.rejected, (state, action) => { state.saving = false; state.error = action.payload; })

      .addCase(deleteSellingResource.pending, (state) => { state.deleting = true; state.error = null; })
      .addCase(deleteSellingResource.fulfilled, (state) => { state.deleting = false; })
      .addCase(deleteSellingResource.rejected, (state, action) => { state.deleting = false; state.error = action.payload; })

      .addCase(fetchResourceTypes.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchResourceTypes.fulfilled, (state, action) => { state.loading = false; state.resourceTypes = action.payload.data || []; })
      .addCase(fetchResourceTypes.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(createResourceType.pending, (state) => { state.saving = true; state.error = null; })
      .addCase(createResourceType.fulfilled, (state) => { state.saving = false; })
      .addCase(createResourceType.rejected, (state, action) => { state.saving = false; state.error = action.payload; })

      .addCase(updateResourceType.pending, (state) => { state.saving = true; state.error = null; })
      .addCase(updateResourceType.fulfilled, (state) => { state.saving = false; })
      .addCase(updateResourceType.rejected, (state, action) => { state.saving = false; state.error = action.payload; })

      .addCase(deleteResourceType.pending, (state) => { state.deleting = true; state.error = null; })
      .addCase(deleteResourceType.fulfilled, (state) => { state.deleting = false; })
      .addCase(deleteResourceType.rejected, (state, action) => { state.deleting = false; state.error = action.payload; });
  },
});

export const { clearSellingResourceError, clearSelectedSellingResource } = sellingResourceSlice.actions;
export default sellingResourceSlice.reducer;
