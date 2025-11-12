import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  sessionId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  messages: [{
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    timestamp: { type: Date, default: Date.now }
  }],
  currentStage: {
    type: String,
    enum: ['hook', 'engage', 'confirm', 'recommend', 'convert', 'support'],
    default: 'hook'
  },
  intentLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  userProfile: {
    budget: String,
    occasion: String,
    style: String,
    category: String,
    preferences: mongoose.Schema.Types.Mixed
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update timestamp on save
conversationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Conversation', conversationSchema);
