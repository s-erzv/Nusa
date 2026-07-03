import { Router } from 'express';
import { initiateLogin, loginStatus, getBotInfo } from '../controllers/authController.js';

const router = Router();

router.post('/initiate-login', initiateLogin);
router.get('/login-status/:code', loginStatus);
router.get('/bot-info', getBotInfo);

export default router;
