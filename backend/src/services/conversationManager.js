import Conversation from '../models/Conversation.js';
import Product from '../models/Product.js';
import Policy from '../models/Policy.js';
import { detectIntent, extractPreferences } from './intentDetector.js';
import { callAI } from './aiService.js';
import { knowledgeService } from './advancedKnowledgeService.js';

// Oment Brand Context
const OMENT_CONTEXT = `
You are Naina, the AI shopping assistant for Oment.store - a premium fashion e-commerce brand.

ABOUT OMENT:
- Oment offers trendy, high-quality fashion for modern individuals
- Price range: ₹500 - ₹5000
- Categories: Dresses, Tops, Bottoms, Co-ords, Accessories
- Target audience: Young, fashion-forward shoppers

OMENT BENEFITS:
- Free shipping on orders above ₹999
- 7-day easy returns policy (no questions asked)
- COD (Cash on Delivery) available on all orders - FREE
- Delivery time: 2-4 business days across India
- Size exchange available
- Secure payment gateway
- Track order anytime from website

BRAND VOICE:
- Friendly, helpful, and fashion-forward
- Never pushy, always supportive
- Use emojis naturally (1 per message max)
- Keep responses SHORT and conversational
- Focus on making customer feel confident and stylish

YOUR GOAL:
Help customers discover Oment products they'll love and feel confident buying.
`;

// Stage-specific prompts with Oment context
const STAGE_PROMPTS = {
  hook: `${OMENT_CONTEXT}

CURRENT STAGE: Hook (First Impression)
Your job: Welcome them to Oment and spark curiosity.

Rules:
- Welcome them to Oment warmly
- Keep it SHORT (1-2 sentences max)
- Use ONE emoji
- End with a simple, inviting question
- Never say "I am AI" or introduce yourself

Examples:
"Hey! 👋 Welcome to Oment! Looking for something stylish today?"
"Hi there! ✨ Want to see what's trending at Oment right now?"
"Welcome! 🎀 Need help finding the perfect outfit?"`,

  engage: `${OMENT_CONTEXT}

CURRENT STAGE: Engage (Understanding Needs)
Your job: Learn what they're looking for naturally and conversationally.

Rules:
- Ask ONE simple question at a time
- Be conversational, not interrogating
- Reference Oment categories when relevant (Dress, Top, Bottom, Co-ord)
- ONE emoji per message
- Mirror their energy level
- Never stack multiple questions

Examples:
User: "just browsing"
You: "Cool! Want to see Oment's new arrivals or bestsellers? ✨"

User: "need a dress"
You: "Love it! Casual everyday or something for a party? 👗"`,

  confirm: `${OMENT_CONTEXT}

CURRENT STAGE: Confirm (Show You Listened)
Your job: Confirm their needs before showing products.

Rules:
- Summarize what they want in their own words
- Keep it SHORT
- ONE emoji
- Build trust by showing you understood`,

  recommend: `${OMENT_CONTEXT}

CURRENT STAGE: Recommend (Show Products)
Your job: Present Oment products that match what they asked for.

Rules:
- Keep intro line SHORT
- Let the products speak for themselves (system will show product cards)
- Ask ONE refinement question
- Mention key Oment benefits: free COD, 7-day returns
- ONE emoji`,

  convert: `${OMENT_CONTEXT}

CURRENT STAGE: Convert (Help Them Buy)
Your job: Handle concerns and make buying easy.`,

  support: `${OMENT_CONTEXT}

CURRENT STAGE: Support (Post-Purchase Help)
Your job: Answer questions about Oment orders and policies.`
};

export async function processMessage(sessionId, userMessage, model = 'gemini') {
  try {
    // Get or create conversation
    let conversation = await Conversation.findOne({ sessionId });
    
    if (!conversation) {
      conversation = new Conversation({
        sessionId,
        messages: [],
        currentStage: 'hook',
        intentLevel: 'low',
        userProfile: {}
      });
    }

    // Add user message
    conversation.messages.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    });

    // Detect intent and extract preferences
    const { intent, preferences } = await detectIntent(userMessage, conversation);
    conversation.intentLevel = intent;
    
    if (preferences) {
      conversation.userProfile = {
        ...conversation.userProfile,
        ...preferences
      };
    }

    // Determine conversation stage
    const stage = determineStage(conversation, userMessage);
    conversation.currentStage = stage;

    // Search for REAL data across all sources
    const websiteUrl = process.env.ECOMMERCE_WEBSITE_URL || 'http://localhost:3000';
    const searchResults = await knowledgeService.search(userMessage, { websiteUrl });

    // Format real data for AI
    const realDataContext = knowledgeService.formatForAI(searchResults, userMessage);

    // Build AI prompt with REAL data
    const basePrompt = buildSystemPrompt(conversation, stage);
    const enhancedPrompt = basePrompt + realDataContext;
    
    // Get conversation history
    const recentMessages = conversation.messages.slice(-6).map(m => ({
      role: m.role,
      content: m.content
    }));

    // Call AI with REAL data context
    const aiResponse = await callAI(enhancedPrompt, recentMessages, userMessage, model);

    // Use actual products from search results
    const products = searchResults.products.slice(0, 3);

    // Add AI response
    conversation.messages.push({
      role: 'assistant',
      content: aiResponse,
      products: products.map(p => p.id),
      timestamp: new Date(),
      sourcesUsed: searchResults.sources.length
    });

    await conversation.save();

    return {
      response: aiResponse,
      stage: stage,
      intent: intent,
      products: products,
      sources: searchResults.sources.slice(0, 3)
    };

  } catch (error) {
    console.error('❌ Conversation Manager Error:', error);
    throw error;
  }
}

function determineStage(conversation, userMessage) {
  const messageCount = conversation.messages.length;
  const currentStage = conversation.currentStage;
  const intent = conversation.intentLevel;

  // First interaction
  if (messageCount <= 2) return 'hook';

  // High intent users skip ahead
  if (intent === 'high' && messageCount > 2) return 'recommend';

  // Policy/support questions
  if (isAskingAboutPolicy(userMessage)) return 'support';

  // Normal flow progression
  if (messageCount <= 4) return 'engage';
  if (messageCount <= 6) return 'confirm';
  if (messageCount <= 10) return 'recommend';
  
  return 'convert';
}

function buildSystemPrompt(conversation, stage) {
  const basePrompt = STAGE_PROMPTS[stage];
  
  let contextPrompt = basePrompt + '\n\n';
  
  // Add user context if available
  if (conversation.userProfile && Object.keys(conversation.userProfile).length > 0) {
    const profile = conversation.userProfile;
    contextPrompt += `CUSTOMER PREFERENCES:\n`;
    if (profile.budget) contextPrompt += `- Budget: ${profile.budget}\n`;
    if (profile.occasion) contextPrompt += `- Occasion: ${profile.occasion}\n`;
    if (profile.style) contextPrompt += `- Style: ${profile.style}\n`;
    if (profile.category) contextPrompt += `- Looking for: ${profile.category}\n`;
  }
  
  contextPrompt += `\nIntent level: ${conversation.intentLevel}\n`;
  contextPrompt += `Current stage: ${stage}\n`;
  contextPrompt += `\nIMPORTANT: Keep response SHORT, ONE emoji max, ONE question max!`;
  
  return contextPrompt;
}

function isAskingAboutPolicy(message) {
  const policyKeywords = [
    'cod', 'cash on delivery', 'delivery', 'shipping', 'return', 'exchange',
    'refund', 'policy', 'how long', 'when will', 'track', 'contact',
    'support', 'help', 'size chart', 'payment'
  ];
  
  const lowerMessage = message.toLowerCase();
  return policyKeywords.some(keyword => lowerMessage.includes(keyword));
}
