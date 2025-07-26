import express from 'express';
const router = express.Router();
import { register, login, logout, verify } from '../controllers/auth.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/verify', verifyToken, verify);

export default router;
