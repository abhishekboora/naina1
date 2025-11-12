import axios from 'axios';

export const generateResponse = async (messages) => {
  try {
    console.log('🚀 Calling Groq API...');
    
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-70b-versatile',
        messages: messages,
        temperature: 0.7,
        max_tokens: 2048,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    console.log('✅ Groq Response Received');
    return {
      content: response.data.choices[0].message.content,
      model: 'groq',
      tokens: response.data.usage?.total_tokens || 0
    };
  } catch (error) {
    console.error('❌ Groq Error:', error.response?.data || error.message);
    throw new Error('Groq API failed');
  }
};
