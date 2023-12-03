// routes/Users.js
import express from 'express';
import { FetchUsers, EditUser, SearchUser } from '../controllers/User.js';
import { verifyToken } from './../middlewares/AuthMiddleware.js'; // Corrected import path
const router = express.Router();

// verifyToken
router.get('/FetchUsers', verifyToken, FetchUsers);
router.post('/EditUser', verifyToken, EditUser);
router.get('/SearchUser/:query', verifyToken, SearchUser);



export default router;