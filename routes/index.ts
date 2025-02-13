import express from 'express';
import * as authController from '../controllers/auth.controller';
import * as jobController from '../controllers/job.controller';
import * as userController from '../controllers/user.controller';

const router = express.Router();

// Routes for authentication
router.post('/register', authController.register);                                                  // route for register
router.post('/login', authController.login);                                                        // route for login
router.get('/confirm/:token', authController.confirmEmail);                                         // route for confirming email

// Routes for client action
router.post('/client/jobs', jobController.createJob);                                                      // route for creating Job
router.get('/client/jobs', jobController.getJobList);                                                      // route for getting  Job

router.get('/client/jobs/:id', jobController.getJobDetail);                                                // route for getting detaied Job
    
router.get('/client/jobs/:id/folders', jobController.getFoldersByJobId);                                   // route for getting Folders by Job Id
router.post('/client/jobs/:jobId/folders', jobController.createFolderByJobId);                             // route for creating Folders by Job Id 

router.get('/client/jobs/:jobId/folders/:folderId/files', jobController.getFilesByJobIdAndFolderId);       // route for getting Files by Job Id and Folder Id
router.post('/client/jobs/:jobId/folders/:folderId/files', jobController.uploadFiles);                     // route for uploading Files

// Routes for admin action
router.get('/pilot/profile', userController.getCertificateFiles);
router.post('/pilot/profile/certs', userController.uploadCertFiles);
// Routes for pilot action

export default router;