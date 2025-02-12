import express from 'express';
import * as authController from '../controllers/auth.controller';
import * as jobController from '../controllers/job.controller';
const router = express.Router();

router.post('/register', authController.register);                                                  // route for register
router.post('/login', authController.login);                                                        // route for login
router.get('/confirm/:token', authController.confirmEmail);                                         // route for confirming email

router.post('/jobs', jobController.createJob);                                                      // route for creating Job
router.get('/jobs', jobController.getJobList);                                                      // route for getting  Job

router.get('/jobs/:id', jobController.getJobDetail);                                                // route for getting detaied Job
    
router.get('/jobs/:id/folders', jobController.getFoldersByJobId);                                   // route for getting Folders by Job Id
router.post('/jobs/:jobId/folders', jobController.createFolderByJobId);                             // route for creating Folders by Job Id 

router.get('/jobs/:jobId/folders/:folderId/files', jobController.getFilesByJobIdAndFolderId);       // route for getting Files by Job Id and Folder Id
router.post('/jobs/:jobId/folders/:folderId/files', jobController.uploadFiles);                     // route for uploading Files

export default router;