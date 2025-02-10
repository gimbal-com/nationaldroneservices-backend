import express from 'express';
import * as authController from '../controllers/auth.controller';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/confirm/:token', authController.confirmEmail);

export default router;