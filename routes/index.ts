import express from 'express';
import * as authController from '../controllers/auth.controller';
import * as jobController from '../controllers/job.controller';
const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/confirm/:token', authController.confirmEmail);

router.post('/jobs', jobController.createJob);
router.get('/jobs', jobController.getJobList);

router.get('/jobs/:id', jobController.getJobDetail);

router.get('/jobs/:id/folders', jobController.getFoldersByJobId);
router.post('/jobs/:jobId/folders', jobController.createFolderByJobId);

router.get('/jobs/:jobId/folders/:folderId/files', jobController.getFilesByJobIdAndFolderId);
router.post('/jobs/:jobId/folders/:folderId/files', jobController.uploadFiles);

export default router;