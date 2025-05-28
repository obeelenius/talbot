// Talbot Configuration - System Prompt and Settings with Development Mode
const TalbotConfig = {
    // Development Settings - Change these for dev/production
    DEVELOPMENT_MODE: true, // Set to false for production
    DISABLE_ELEVENLABS_IN_DEV: true, // Skip ElevenLabs API calls in dev mode
    DEV_VOICE_MODE: 0, // Default voice mode in dev (0=mute, 1=female, 2=male)
    MAX_TEXT_LENGTH_FOR_ELEVENLABS: 300, // Only use ElevenLabs for shorter messages
    
    // Enhanced Talbot System Prompt for API calls
    SYSTEM_PROMPT: `You are Talbot, a supportive mental health companion designed to provide personalized, empathetic support through thoughtful conversation.

## Core Approach:
- Use therapeutic questioning techniques to help users explore the root causes of their feelings, similar to how a skilled therapist guides exploration
- Ask thoughtful follow-up questions that promote insight and self-discovery
- Validate emotions while gently probing deeper into underlying patterns, triggers, and connections
- Focus on understanding the "why" behind feelings and reactions

## Personalization:
- Always reference the user's profile information: diagnoses, medications, triggers, age, name, and communication preferences
- Consider how their conditions interact with each other in their current situation (e.g., how BPD, OCD, and ADHD might all influence a particular experience)
- Remember and build on previous conversations, referencing specific people, situations, and ongoing challenges by name
- Acknowledge their progress, setbacks, and patterns over time

## Communication Style:
- Mirror the user's communication style - match their tone, formality level, and energy
- Use their preferred language and terminology rather than clinical jargon
- Respond with warmth, empathy, and without judgment
- Be conversational and genuine, not robotic or generic
- Adapt to whether they prefer direct feedback, gentle exploration, or supportive listening

## Relationship Building:
- Respond as if you genuinely know and care about this specific person's journey
- Ask questions that are specific to their unique circumstances rather than generic mental health questions
- Acknowledge the complexity of their mental health experiences
- Provide a safe space for honest expression without fear of judgment

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

Respond as if you genuinely care about this person's wellbeing and growth.`,

    // App Settings
    SETTINGS: {
        // Speech settings
        SPEECH_LANG: 'en-AU', // Australian English
        SPEECH_RATE: 0.85,
        SPEECH_PITCH: 1.1,
        SPEECH_VOLUME: 0.9,
        
        // Voice preferences (in order of preference)
        VOICE_PREFERENCES: [
            { pattern: /australian/i, score: 100 },
            { pattern: /karen|catherine/i, score: 95 },
            { pattern: /british|uk/i, score: 90 },
            { pattern: /english.*female/i, score: 85 },
            { pattern: /female/i, score: 80 }
        ],
        
        // File upload limits
        MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
        ALLOWED_FILE_TYPES: ['.pdf', '.txt', '.doc', '.docx'],
        
        // UI settings
        MAX_MESSAGE_HEIGHT: 120,
        TYPING_ANIMATION_DELAY: 200,
        MESSAGE_FADE_DURATION: 300,
        
        // Storage keys
        STORAGE_KEYS: {
            PROFILE: 'talbot-profile',
            DOCUMENTS: 'talbot-documents',
            CHAT_HISTORY: 'talbot-chat-history',
            ELEVENLABS_CALLS: 'talbot-elevenlabs-calls'
        }
    },

    // Development helper functions
    DEV_HELPERS: {
        // Toggle development mode on/off
        toggleDevMode: function() {
            TalbotConfig.DEVELOPMENT_MODE = !TalbotConfig.DEVELOPMENT_MODE;
            console.log(`Development mode: ${TalbotConfig.DEVELOPMENT_MODE ? 'ON' : 'OFF'}`);
            if (window.talbotApp?.speechManager) {
                window.talbotApp.speechManager.updateDevMode();
            }
        },
        
        // Get current development status
        getDevStatus: function() {
            return {
                devMode: TalbotConfig.DEVELOPMENT_MODE,
                elevenLabsDisabled: TalbotConfig.DISABLE_ELEVENLABS_IN_DEV,
                defaultVoiceMode: TalbotConfig.DEV_VOICE_MODE,
                maxTextLength: TalbotConfig.MAX_TEXT_LENGTH_FOR_ELEVENLABS
            };
        },
        
        // Get ElevenLabs usage stats
        getUsageStats: function() {
            const calls = localStorage.getItem(TalbotConfig.SETTINGS.STORAGE_KEYS.ELEVENLABS_CALLS) || '0';
            return {
                totalCalls: parseInt(calls),
                devModeActive: TalbotConfig.DEVELOPMENT_MODE
            };
        },
        
        // Reset usage counter
        resetUsageStats: function() {
            localStorage.removeItem(TalbotConfig.SETTINGS.STORAGE_KEYS.ELEVENLABS_CALLS);
            console.log('ElevenLabs usage stats reset');
        }
    },

    // Fallback therapeutic responses for when AI is unavailable
    FALLBACK_RESPONSES: [
        "I'm here to listen. Can you tell me more about what's going on for you right now?",
        "That sounds like it's weighing on you. What do you think might be underneath those feelings?",
        "I'm having some technical difficulties, but I'm still here for you. How are you feeling in this moment?",
        "What's coming up for you when you think about that situation?",
        "I can hear that this is affecting you. What does this remind you of, if anything?",
        "That sounds really significant for you. What would it mean to you if things were different?",
        "I'm listening. What thoughts are going through your head about this?",
        "It seems like there's something important here for you. What do you think that might be?"
    ],

    // Therapeutic response patterns for local AI simulation
    RESPONSE_PATTERNS: {
        anxiety: [
            "I can hear that you're feeling anxious right now. What do you think might be triggering that anxiety for you?",
            "Anxiety can be really overwhelming. What's going through your mind when those feelings come up?",
            "That sounds like a lot of worry to carry. What are you telling yourself about this situation?"
        ],
        
        sadness: [
            "It sounds like you're feeling really low at the moment. That must be tough, mate. When you notice that sadness, what thoughts tend to come with it?",
            "I can hear the sadness in what you're sharing. What do you think might be underneath those feelings?",
            "That sounds really heavy. What would it mean to you to feel differently about this?"
        ],
        
        anger: [
            "I can hear the frustration in what you're saying. Anger often tells us something important about what we need or value. What do you think might be underneath that anger?",
            "That sounds really frustrating. What do you think your anger might be trying to tell you?",
            "It makes sense you'd feel angry about that. What would you need to feel differently?"
        ],
        
        loneliness: [
            "Feeling alone can be really painful. It sounds like this is bringing up some difficult feelings for you. What does being alone mean to you in this situation?",
            "Loneliness can be so hard to sit with. What are you telling yourself when those feelings come up?",
            "That sounds really isolating. What would connection look like for you right now?"
        ],
        
        overwhelm: [
            "That sounds really overwhelming, mate. When everything feels like too much, it can be hard to know where to start. What feels like the most pressing thing on your mind right now?",
            "I can hear how much you're dealing with. What would it feel like to have some space from all of this?",
            "That's a lot to carry. What do you think you need most right now?"
        ]
    },

    // Crisis resources (Australian focus)
    CRISIS_RESOURCES: {
        emergency: '000',
        lifeline: '13 11 14',
        beyondBlue: '1300 22 4636',
        mensLine: '1300 78 99 78',
        kidsHelpline: '1800 55 1800',
        qlife: '1800 184 527' // LGBTI+ support
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TalbotConfig;
}
