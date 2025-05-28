// AI Response Manager with Conversation Memory
class AIResponseManager {
    constructor(profileManager, uiManager) {
        this.profileManager = profileManager;
        this.uiManager = uiManager;
    }

    async getAIResponse(message) {
        try {
            console.log('AIResponseManager: Getting response for message:', message);
            
            // Get conversation history from UI manager
            const conversationHistory = this.uiManager.getMessages();
            console.log(`AIResponseManager: Including ${conversationHistory.length} previous messages`);
            
            // Call the API with conversation history
            const response = await this.callAIAPI(message, conversationHistory);
            console.log('AIResponseManager: Got API response:', response);
            return response;
            
        } catch (error) {
            console.error('AIResponseManager: API call failed, using fallback:', error);
            return this.getFallbackResponse();
        }
    }

    // Method to call the Netlify function with conversation history
    async callAIAPI(message, conversationHistory = []) {
        try {
            const contextualMessage = this.profileManager.buildContextualMessage(message);
            console.log('AIResponseManager: Calling API with contextual message and history');
            
            const response = await fetch('/.netlify/functions/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: contextualMessage,
                    profile: this.profileManager.getProfile(),
                    conversationHistory: conversationHistory
                })
            });

            console.log('AIResponseManager: API response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('AIResponseManager: API error:', errorText);
                throw new Error(`API request failed: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('AIResponseManager: API response data received');
            
            // Check if it's a fallback response from the function
            if (data.fallback) {
                console.log('AIResponseManager: Function returned fallback response');
                throw new Error('Function returned fallback');
            }
            
            return data.response;
            
        } catch (error) {
            console.error('AIResponseManager: callAIAPI error:', error);
            throw error;
        }
    }

    // Fallback responses for when API is completely unavailable
    getFallbackResponse() {
        const fallbackResponses = [
            "I'm here for you, even though I'm having some connection issues right now. How are you feeling?",
            "I'm experiencing some technical difficulties, but I'm still listening. What's on your mind?",
            "Something's not quite working on my end, mate, but I want you to know I'm here. Can you tell me what's going on?",
            "I hit a technical snag, but your feelings are important. What would help you feel supported right now?"
        ];
        
        return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    }

    // Keep simulation method for complete offline fallback
    async simulateTherapeuticResponse(originalMessage, contextualMessage) {
        const message = originalMessage.toLowerCase();
        
        // Crisis response (always prioritize this)
        if (this.containsKeywords(message, ['hurt myself', 'kill myself', 'suicide', 'end it all', 'not worth living'])) {
            return this.getCrisisResponse();
        }

        // Look for emotional keywords and respond therapeutically
        if (this.containsKeywords(message, ['anxious', 'anxiety', 'worried', 'panic'])) {
            return this.getRandomResponse(TalbotConfig.RESPONSE_PATTERNS.anxiety);
        }
        
        if (this.containsKeywords(message, ['sad', 'depressed', 'down', 'hopeless', 'empty'])) {
            return this.getRandomResponse(TalbotConfig.RESPONSE_PATTERNS.sadness);
        }
        
        if (this.containsKeywords(message, ['angry', 'frustrated', 'mad', 'furious', 'rage'])) {
            return this.getRandomResponse(TalbotConfig.RESPONSE_PATTERNS.anger);
        }
        
        if (this.containsKeywords(message, ['alone', 'lonely', 'abandon', 'isolated', 'rejected'])) {
            return this.getRandomResponse(TalbotConfig.RESPONSE_PATTERNS.loneliness);
        }
        
        if (this.containsKeywords(message, ['overwhelmed', 'too much', 'stressed', 'pressure', 'burden'])) {
            return this.getRandomResponse(TalbotConfig.RESPONSE_PATTERNS.overwhelm);
        }

        // Default therapeutic response
        return this.getDefaultTherapeuticResponse();
    }

    containsKeywords(text, keywords) {
        return keywords.some(keyword => text.includes(keyword));
    }

    getRandomResponse(responses) {
        return responses[Math.floor(Math.random() * responses.length)];
    }

    getDefaultTherapeuticResponse() {
        const responses = [
            "That sounds really significant for you. What do you think is at the heart of those feelings?",
            "I can hear that this is affecting you quite a bit. What comes up for you when you think about why this might be hitting you so hard?",
            "It sounds like there's a lot going on beneath the surface there. What do you think might be driving those reactions?",
            "That must feel pretty intense. When you notice yourself feeling this way, what thoughts tend to go through your head?",
            "I'm hearing that this is really important to you. What would it mean if things were different in this situation?"
        ];
        
        return this.getRandomResponse(responses);
    }

    getCrisisResponse() {
        const crisisResponse = `I'm really concerned about what you're sharing, mate. These thoughts about hurting yourself are serious, and I want you to get proper support right away.

Please reach out for immediate help:
• Emergency Services: 000
• Lifeline: 13 11 14
• Beyond Blue: 1300 22 4636

You don't have to go through this alone. There are people who want to help you right now. Can you reach out to one of these services or someone you trust?`;

        return crisisResponse;
    }
}
