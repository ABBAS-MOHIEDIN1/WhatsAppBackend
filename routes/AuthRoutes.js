// routes/index.js
import express from 'express';
import { login, Register, FetchUser } from '../controllers/AuthController.js';
import { verifyToken } from './../middlewares/AuthMiddleware.js'; // Corrected import path

const router = express.Router();

router.post('/sign-in', Register);

// login
router.post('/sign-up', login);


router.get('/FetchUser', verifyToken, FetchUser)

export default router;