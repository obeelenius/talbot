// Get ElevenLabs voice IDs from environment variables
exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      }
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const femaleVoiceId = process.env.ELEVENLABS_FEMALE_VOICE_ID || 'M7ya1YbaeFaPXljg9BpK'; // Hannah - default fallback
  const maleVoiceId = process.env.ELEVENLABS_MALE_VOICE_ID || 'ZthjuvLPty3kTMaNKVKb'; // Peter - default fallback
  
  return {
    statusCode: 200,
    headers: { 
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      femaleVoiceId: femaleVoiceId,
      maleVoiceId: maleVoiceId,
      available: !!(process.env.ELEVENLABS_FEMALE_VOICE_ID && process.env.ELEVENLABS_MALE_VOICE_ID)
    })
  };
};
