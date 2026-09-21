import DepartmentApi from '../../services/departmentApi';
import DesignationApi from '../../services/designationApi';
import BranchApi from '../../services/branchApi';
import CostCenterApi from '../../services/costCenterApi';
import { createOrgSlice } from './orgSliceFactory';

export const {
  slice: departmentSlice,
  fetchAll: fetchDepartments,
  fetchOne: fetchDepartment,
  create: createDepartment,
  update: updateDepartment,
  remove: deleteDepartment,
} = createOrgSlice('departments', DepartmentApi);

export const {
  slice: designationSlice,
  fetchAll: fetchDesignations,
  fetchOne: fetchDesignation,
  create: createDesignation,
  update: updateDesignation,
  remove: deleteDesignation,
} = createOrgSlice('designations', DesignationApi);

export const {
  slice: branchSlice,
  fetchAll: fetchBranches,
  fetchOne: fetchBranch,
  create: createBranch,
  update: updateBranch,
  remove: deleteBranch,
} = createOrgSlice('branches', BranchApi);

export const {
  slice: costCenterSlice,
  fetchAll: fetchCostCenters,
  fetchOne: fetchCostCenter,
  create: createCostCenter,
  update: updateCostCenter,
  remove: deleteCostCenter,
} = createOrgSlice('costCenters', CostCenterApi);

export const { clearSelected: clearDeptSelected } = departmentSlice.actions;
export const { clearSelected: clearDesigSelected } = designationSlice.actions;
export const { clearSelected: clearBranchSelected } = branchSlice.actions;
export const { clearSelected: clearCCSelected } = costCenterSlice.actions;

export const orgReducers = {
  departments: departmentSlice.reducer,
  designations: designationSlice.reducer,
  branches: branchSlice.reducer,
  costCenters: costCenterSlice.reducer,
};
