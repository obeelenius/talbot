// ElevenLabs Text-to-Speech Netlify Function
exports.handler = async (event, context) => {
  console.log('ElevenLabs TTS function called');
  
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Check API key
  if (!process.env.ELEVENLABS_API_KEY) {
    console.error('ElevenLabs API key not found');
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'ElevenLabs API key not configured' })
    };
  }

  let requestBody;
  try {
    requestBody = JSON.parse(event.body);
  } catch (error) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Invalid JSON' })
    };
  }

  const { text, voice_id = 'pNInz6obpgDQGcFmaJgB', voice_settings } = requestBody;

  if (!text) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Text is required' })
    };
  }

  try {
    console.log('Calling ElevenLabs API...');
    console.log('Text length:', text.length);
    console.log('Voice ID:', voice_id);

    const elevenLabsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1', // Fastest, good quality
        voice_settings: voice_settings || {
          stability: 0.75,
          similarity_boost: 0.85,
          style: 0.5,
          use_speaker_boost: true
        }
      })
    });

    console.log('ElevenLabs response status:', elevenLabsResponse.status);

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text();
      console.error('ElevenLabs API error:', errorText);
      throw new Error(`ElevenLabs API error: ${elevenLabsResponse.status}`);
    }

    // Get audio data as buffer
    const audioBuffer = await elevenLabsResponse.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');

    console.log('ElevenLabs TTS successful, audio size:', audioBuffer.byteLength);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString()
      },
      body: audioBase64,
      isBase64Encoded: true
    };

  } catch (error) {
    console.error('ElevenLabs TTS error:', error);
    
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: 'Text-to-speech generation failed',
        details: error.message 
      })
    };
  }
};
