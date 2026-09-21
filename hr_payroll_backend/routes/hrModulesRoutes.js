/**
 * @swagger
 * /api/hr/performance-goals:
 *   get:
 *     tags: [HR Modules]
 *     summary: List performance goals
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Success } }
 *   post:
 *     tags: [HR Modules]
 *     summary: Create performance goal
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Created } }
 * /api/hr/performance-kpis:
 *   get:
 *     tags: [HR Modules]
 *     summary: List performance KPIs
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Success } }
 *   post:
 *     tags: [HR Modules]
 *     summary: Create performance KPI
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Created } }
 * /api/hr/performance-appraisals:
 *   get:
 *     tags: [HR Modules]
 *     summary: List performance appraisals
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Success } }
 *   post:
 *     tags: [HR Modules]
 *     summary: Create performance appraisal
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Created } }
 * /api/hr/training-courses:
 *   get:
 *     tags: [HR Modules]
 *     summary: List training courses
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Success } }
 *   post:
 *     tags: [HR Modules]
 *     summary: Create training course
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Created } }
 * /api/hr/training-sessions:
 *   get:
 *     tags: [HR Modules]
 *     summary: List training sessions
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Success } }
 *   post:
 *     tags: [HR Modules]
 *     summary: Create training session
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Created } }
 * /api/hr/training-attendees:
 *   get:
 *     tags: [HR Modules]
 *     summary: List training attendees
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Success } }
 *   post:
 *     tags: [HR Modules]
 *     summary: Create training attendee
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Created } }
 * /api/hr/job-positions:
 *   get:
 *     tags: [HR Modules]
 *     summary: List job positions
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Success } }
 *   post:
 *     tags: [HR Modules]
 *     summary: Create job position
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Created } }
 * /api/hr/job-applicants:
 *   get:
 *     tags: [HR Modules]
 *     summary: List job applicants
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Success } }
 *   post:
 *     tags: [HR Modules]
 *     summary: Create job applicant
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Created } }
 * /api/hr/interviews:
 *   get:
 *     tags: [HR Modules]
 *     summary: List interviews
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Success } }
 *   post:
 *     tags: [HR Modules]
 *     summary: Create interview
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Created } }
 * /api/hr/offer-letters:
 *   get:
 *     tags: [HR Modules]
 *     summary: List offer letters
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Success } }
 *   post:
 *     tags: [HR Modules]
 *     summary: Create offer letter
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Created } }
 * /api/hr/onboarding-checklists:
 *   get:
 *     tags: [HR Modules]
 *     summary: List onboarding checklists
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Success } }
 *   post:
 *     tags: [HR Modules]
 *     summary: Create onboarding checklist
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Created } }
 * /api/hr/onboarding-progress:
 *   get:
 *     tags: [HR Modules]
 *     summary: List onboarding progress
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Success } }
 *   post:
 *     tags: [HR Modules]
 *     summary: Create onboarding progress
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Created } }
 * /api/hr/onboarding-progress/initialize:
 *   post:
 *     tags: [HR Modules]
 *     summary: Initialize onboarding
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Initialized } }
 * /api/hr/offboarding-checklists:
 *   get:
 *     tags: [HR Modules]
 *     summary: List offboarding checklists
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Success } }
 *   post:
 *     tags: [HR Modules]
 *     summary: Create offboarding checklist
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Created } }
 * /api/hr/offboarding-progress:
 *   get:
 *     tags: [HR Modules]
 *     summary: List offboarding progress
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Success } }
 *   post:
 *     tags: [HR Modules]
 *     summary: Create offboarding progress
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Created } }
 * /api/hr/offboarding-progress/initialize:
 *   post:
 *     tags: [HR Modules]
 *     summary: Initialize offboarding
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Initialized } }
 * /api/hr/exit-interviews:
 *   get:
 *     tags: [HR Modules]
 *     summary: List exit interviews
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Success } }
 *   post:
 *     tags: [HR Modules]
 *     summary: Create exit interview
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Created } }
 */
const express = require('express');
const { pgCtrl, pkCtrl, paCtrl, tcCtrl, tsCtrl, taCtrl, jpCtrl, jaCtrl, ivCtrl, olCtrl, oncCtrl, onpCtrl, ofcCtrl, ofpCtrl, eiCtrl } = require('../controllers/HRModulesControllers');

const r = (ctrl, extras = {}) => {
  const router = express.Router();
  router.get('/', ctrl.getAll); router.post('/', extras.create || ctrl.create);
  router.get('/:id', ctrl.getById); router.put('/:id', ctrl.update); router.delete('/:id', ctrl.delete);
  if (extras.extra) extras.extra(router);
  return router;
};

const onpRoutes = r(onpCtrl);
onpRoutes.post('/initialize', onpCtrl.initialize);
const ofpRoutes = r(ofpCtrl);
ofpRoutes.post('/initialize', ofpCtrl.initialize);

module.exports = {
  pgRoutes: r(pgCtrl), pkRoutes: r(pkCtrl), paRoutes: r(paCtrl),
  tcRoutes: r(tcCtrl), tsRoutes: r(tsCtrl), taRoutes: r(taCtrl),
  jpRoutes: r(jpCtrl), jaRoutes: r(jaCtrl), ivRoutes: r(ivCtrl), olRoutes: r(olCtrl),
  oncRoutes: r(oncCtrl), onpRoutes,
  ofcRoutes: r(ofcCtrl), ofpRoutes, eiRoutes: r(eiCtrl),
};
