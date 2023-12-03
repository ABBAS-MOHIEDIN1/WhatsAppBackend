// routes/Users.js
import express from 'express';
import { FetchMessages, sendMessage,DeleteMessages } from '../controllers/MessageController.js';
import { verifyToken } from './../middlewares/AuthMiddleware.js'; // Corrected import path
const router = express.Router();

// verifyToken
router.get('/FetchMesssage/:id', verifyToken, FetchMessages);
router.post("/sendMessage", verifyToken, sendMessage)
router.get("/DeleteMessages/:id",verifyToken,DeleteMessages)

export default router;