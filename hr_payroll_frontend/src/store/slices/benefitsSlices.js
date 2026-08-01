import BenefitsApi from '../../services/benefitsApi';
import { createOrgSlice } from './orgSliceFactory';
import { createAsyncThunk } from '@reduxjs/toolkit';

export const { slice: btSlice, fetchAll: fetchBT, create: createBT, update: updateBT, remove: deleteBT } = createOrgSlice('benefitTypes', BenefitsApi.benefitTypes);
export const { slice: ebSlice, fetchAll: fetchEB, create: createEB, update: updateEB, remove: deleteEB } = createOrgSlice('empBenefits', BenefitsApi.employeeBenefits);
export const { slice: ecSlice, fetchAll: fetchEC, update: updateEC, remove: deleteEC } = createOrgSlice('eosbCalcs', BenefitsApi.eosbCalc);
export const { slice: esSlice, fetchAll: fetchES, remove: deleteES } = createOrgSlice('eosbSettlements', BenefitsApi.eosbSettle);
export const { slice: wpsSlice, fetchAll: fetchWps, create: createWps, update: updateWps, remove: deleteWps } = createOrgSlice('wps', BenefitsApi.wps);
export const { slice: essSlice, fetchAll: fetchEss, create: createEss } = createOrgSlice('ess', BenefitsApi.ess);

export const calcEosb = createAsyncThunk('eosb/calc', async (data, { rejectWithValue }) => {
  try { const res = await BenefitsApi.eosbCalc.calculate(data); return res.data?.data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});
export const settleEosb = createAsyncThunk('eosb/settle', async (data, { rejectWithValue }) => {
  try { const res = await BenefitsApi.eosbSettle.settle(data); return res.data?.data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});
export const genWpsExport = createAsyncThunk('wps/genExport', async (data, { rejectWithValue }) => {
  try { const res = await BenefitsApi.wps.generateExport(data); return res.data?.data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const benefitsReducers = {
  benefitTypes: btSlice.reducer, empBenefits: ebSlice.reducer,
  eosbCalcs: ecSlice.reducer, eosbSettlements: esSlice.reducer,
  wps: wpsSlice.reducer, ess: essSlice.reducer,
};
