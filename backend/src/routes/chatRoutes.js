import express from 'express';
import { handleMessage, getConversation } from '../controllers/chatController.js';

const router = express.Router();

// Send message - defaults to 'gemini' if not specified
router.post('/message', async (req, res, next) => {
  // Set default model to gemini if not provided
  if (!req.body.model) {
    req.body.model = 'gemini';
  }
  // Pass to controller
  await handleMessage(req, res);
});

router.get('/conversation/:sessionId', getConversation);

export default router;
