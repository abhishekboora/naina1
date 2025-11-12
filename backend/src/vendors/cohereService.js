import axios from 'axios';

export const generateResponse = async (messages) => {
  try {
    console.log('💬 Calling Cohere API...');
    
    const lastMessage = messages[messages.length - 1].content;
    
    const response = await axios.post(
      'https://api.cohere.ai/v1/chat',
      {
        model: 'command-r-08-2024',
        message: lastMessage,
        temperature: 0.7,
        max_tokens: 2048
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.COHERE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    console.log('✅ Cohere Response Received');
    return {
      content: response.data.text,
      model: 'cohere',
      tokens: 0
    };
  } catch (error) {
    console.error('❌ Cohere Error:', error.response?.data || error.message);
    throw new Error('Cohere API failed');
  }
};
