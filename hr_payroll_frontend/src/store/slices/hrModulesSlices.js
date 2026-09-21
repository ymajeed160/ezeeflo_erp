import HRModulesApi from '../../services/hrModulesApi';
import { createOrgSlice } from './orgSliceFactory';

export const { slice: pgSlice, fetchAll: fetchPG, create: createPG, update: updatePG, remove: deletePG } = createOrgSlice('perfGoals', HRModulesApi.performanceGoals);
export const { slice: pkSlice, fetchAll: fetchPK, create: createPK, update: updatePK, remove: deletePK } = createOrgSlice('perfKpis', HRModulesApi.performanceKpis);
export const { slice: paSlice, fetchAll: fetchPA, create: createPA, update: updatePA, remove: deletePA } = createOrgSlice('perfAppraisals', HRModulesApi.performanceAppraisals);
export const { slice: tcSlice, fetchAll: fetchTC, create: createTC, update: updateTC, remove: deleteTC } = createOrgSlice('trainCourses', HRModulesApi.trainingCourses);
export const { slice: tsSlice, fetchAll: fetchTS, create: createTS, update: updateTS, remove: deleteTS } = createOrgSlice('trainSessions', HRModulesApi.trainingSessions);
export const { slice: taSlice, fetchAll: fetchTA, create: createTA, update: updateTA, remove: deleteTA } = createOrgSlice('trainAttendees', HRModulesApi.trainingAttendees);
export const { slice: jpSlice, fetchAll: fetchJP, create: createJP, update: updateJP, remove: deleteJP } = createOrgSlice('jobPositions', HRModulesApi.jobPositions);
export const { slice: jaSlice, fetchAll: fetchJA, create: createJA, update: updateJA, remove: deleteJA } = createOrgSlice('jobApplicants', HRModulesApi.jobApplicants);
export const { slice: ivSlice, fetchAll: fetchIV, create: createIV, update: updateIV, remove: deleteIV } = createOrgSlice('interviews', HRModulesApi.interviews);
export const { slice: olSlice, fetchAll: fetchOL, create: createOL, update: updateOL, remove: deleteOL } = createOrgSlice('offerLetters', HRModulesApi.offerLetters);
export const { slice: oncSlice, fetchAll: fetchONC, create: createONC, update: updateONC, remove: deleteONC } = createOrgSlice('onbChecklists', HRModulesApi.onboardingChecklists);
export const { slice: onpSlice, fetchAll: fetchONP, update: updateONP, remove: deleteONP } = createOrgSlice('onbProgress', HRModulesApi.onboardingProgress);
export const { slice: ofcSlice, fetchAll: fetchOFC, create: createOFC, update: updateOFC, remove: deleteOFC } = createOrgSlice('offbChecklists', HRModulesApi.offboardingChecklists);
export const { slice: ofpSlice, fetchAll: fetchOFP, update: updateOFP, remove: deleteOFP } = createOrgSlice('offbProgress', HRModulesApi.offboardingProgress);
export const { slice: eiSlice, fetchAll: fetchEI, create: createEI, update: updateEI, remove: deleteEI } = createOrgSlice('exitInterviews', HRModulesApi.exitInterviews);

export const hrModulesReducers = {
  perfGoals: pgSlice.reducer, perfKpis: pkSlice.reducer, perfAppraisals: paSlice.reducer,
  trainCourses: tcSlice.reducer, trainSessions: tsSlice.reducer, trainAttendees: taSlice.reducer,
  jobPositions: jpSlice.reducer, jobApplicants: jaSlice.reducer, interviews: ivSlice.reducer, offerLetters: olSlice.reducer,
  onbChecklists: oncSlice.reducer, onbProgress: onpSlice.reducer,
  offbChecklists: ofcSlice.reducer, offbProgress: ofpSlice.reducer, exitInterviews: eiSlice.reducer,
};
