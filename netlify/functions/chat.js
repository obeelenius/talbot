// Enhanced Netlify Function with Conversation Memory
exports.handler = async (event, context) => {
  console.log('Chat function invoked');
  
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Max-Age': '86400'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (error) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Invalid JSON' })
    };
  }

  const { message, profile, conversationHistory } = body;
  
  if (!message) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Message is required' })
    };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        response: "I'm having trouble connecting right now, but I'm here to listen. How are you feeling?"
      })
    };
  }

  try {
    // Enhanced system prompt
    const systemPrompt = `You are Talbot, a warm, empathetic mental health companion designed to provide thoughtful emotional support between therapy sessions. You are Australian but use "mate" sparingly and naturally.

## Core Identity:
- You're a supportive friend who happens to be skilled at therapeutic conversation
- You're genuinely curious about people's inner experiences and emotional patterns
- You ask questions that help people discover insights about themselves
- You validate feelings while gently exploring underlying causes and connections

## Therapeutic Approach:
- Use Socratic questioning to help users explore their thoughts and feelings
- Look for patterns, triggers, and underlying beliefs that drive emotions
- Help people understand the "why" behind their reactions
- Validate emotions first, then gently probe deeper
- Connect current experiences to broader life themes when relevant
- Encourage self-compassion and realistic perspective-taking

## Communication Style:
- Conversational and natural, not clinical or robotic
- Warm but not overly effusive
- Ask one thoughtful follow-up question per response
- Use reflective listening ("It sounds like..." "I'm hearing that...")
- Match the user's emotional tone and energy level
- Keep responses to 2-3 sentences max, focused and impactful

## Memory and Continuity:
- You DO remember our entire conversation history
- Reference previous topics, people mentioned, and ongoing themes
- Build on earlier discussions and track emotional patterns
- Acknowledge progress, setbacks, and developments over time
- Use specific names and details from our conversation

## When to be Directive:
- If someone mentions self-harm, suicidal ideation, or crisis situations
- If someone is clearly in distress and needs grounding techniques
- If someone asks for specific coping strategies or tools

## Remember:
- You're supporting someone's therapeutic journey, not replacing professional therapy
- Every person is unique - adapt your approach to their specific mental health context
- Sometimes the most helpful thing is simply being heard and understood
- Encourage professional help when appropriate, but don't be preachy about it

Respond as if you genuinely care about this person's wellbeing and growth.`;

    // Build profile context
    let profileContext = '';
    if (profile) {
      let context = [];
      
      if (profile.preferredName) {
        context.push(`User's name: ${profile.preferredName}`);
      }
      
      if (profile.pronouns) {
        context.push(`Pronouns: ${profile.pronouns}`);
      }
      
      if (profile.ageRange) {
        context.push(`Age: ${profile.ageRange}`);
      }
      
      if (profile.diagnoses) {
        context.push(`Mental health conditions: ${profile.diagnoses}`);
      }
      
      if (profile.medications) {
        context.push(`Current medications: ${profile.medications}`);
      }
      
      if (profile.treatmentHistory) {
        context.push(`Treatment background: ${profile.treatmentHistory}`);
      }
      
      if (profile.communicationStyle && profile.communicationStyle.length > 0) {
        context.push(`Communication preferences: ${profile.communicationStyle.join(', ')}`);
      }
      
      if (profile.customCommunication) {
        context.push(`Custom communication style: ${profile.customCommunication}`);
      }
      
      if (profile.triggers) {
        context.push(`Topics to approach carefully: ${profile.triggers}`);
      }
      
      if (profile.therapyGoals) {
        context.push(`Current therapy goals: ${profile.therapyGoals}`);
      }
      
      if (profile.copingStrategies) {
        context.push(`Effective coping strategies: ${profile.copingStrategies}`);
      }
      
      if (profile.currentStressors) {
        context.push(`Current stressors: ${profile.currentStressors}`);
      }
      
      if (profile.therapistInfo) {
        context.push(`Therapist information: ${profile.therapistInfo}`);
      }
      
      if (context.length > 0) {
        profileContext = `\n\nUser Profile:\n${context.join('\n')}`;
      }
    }

    // Build conversation messages for Claude
    let messages = [];
    
    // Add conversation history if provided
    if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      console.log(`Including ${conversationHistory.length} previous messages`);
      
      // Add previous messages (keep last 20 to avoid token limits)
      const recentHistory = conversationHistory.slice(-20);
      
      for (const historyMessage of recentHistory) {
        if (historyMessage.sender === 'user') {
          messages.push({
            role: 'user',
            content: historyMessage.content
          });
        } else if (historyMessage.sender === 'assistant') {
          messages.push({
            role: 'assistant',
            content: historyMessage.content
          });
        }
      }
    }
    
    // Add the current message
    messages.push({
      role: 'user',
      content: message
    });

    console.log('Calling Claude API with conversation history...');
    console.log(`Messages in conversation: ${messages.length}`);
    
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 600,
        system: systemPrompt + profileContext,
        messages: messages
      })
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Claude API error:', errorText);
      throw new Error(`Claude API error: ${claudeResponse.status}`);
    }

    const claudeData = await claudeResponse.json();
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        response: claudeData.content[0].text
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    
    const fallbackResponses = [
      "I'm here for you, even though I'm having some connection issues right now. How are you feeling?",
      "I'm experiencing some technical difficulties, but I'm still listening. What's on your mind?",
      "Something's not quite working on my end, mate, but I want you to know I'm here. Can you tell me what's going on?"
    ];
    
    const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ response: randomResponse })
    };
  }
};
