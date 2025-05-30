// AI Response Manager with Conversation Memory and Behavioral Rules
class AIResponseManager {
    constructor(profileManager, uiManager) {
        this.profileManager = profileManager;
        this.uiManager = uiManager;
        
        console.log('AIResponseManager initialized with behavioral rules');
    }

    async getAIResponse(message) {
        try {
            console.log('AIResponseManager: Getting response for message:', message);
            
            // Track message count for name usage
            this.profileManager.incrementMessageCount();
            
            // Check for crisis keywords first
            if (this.detectCrisisKeywords(message)) {
                console.log('AIResponseManager: Crisis keywords detected');
                return this.getCrisisResponse();
            }
            
            // Get conversation history from UI manager
            const conversationHistory = this.uiManager.getMessages();
            console.log(`AIResponseManager: Including ${conversationHistory.length} previous messages`);
            
            // Call the API with conversation history and behavioral context
            const response = await this.callAIAPI(message, conversationHistory);
            console.log('AIResponseManager: Got API response');
            
            // Process response through behavioral filters
            const processedResponse = this.processAIResponse(response);
            
            return processedResponse;
            
        } catch (error) {
            console.error('AIResponseManager: API call failed, using fallback:', error);
            return this.getFallbackResponse();
        }
    }

    // Method to call the Netlify function with enhanced context and behavioral rules
    async callAIAPI(message, conversationHistory = []) {
        try {
            // Build enhanced contextual message with behavioral guidelines
            const enhancedContext = this.buildEnhancedContext(message);
            console.log('AIResponseManager: Calling API with enhanced context and behavioral rules');
            
            const response = await fetch('/.netlify/functions/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: enhancedContext.message,
                    profile: this.profileManager.getProfile(),
                    conversationHistory: conversationHistory,
                    systemPrompt: enhancedContext.systemPrompt,
                    behavioralRules: enhancedContext.behavioralRules
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

    buildEnhancedContext(message) {
        // Build system prompt with behavioral rules
        const systemPrompt = this.buildSystemPrompt();
        
        // Get contextual message from profile manager
        const contextualMessage = this.profileManager.buildContextualMessage(message);
        
        // Build behavioral rules object
        const behavioralRules = this.buildBehavioralRules();
        
        return {
            message: contextualMessage,
            systemPrompt: systemPrompt,
            behavioralRules: behavioralRules
        };
    }

    buildSystemPrompt() {
        let systemPrompt = `You are Talbot, a supportive AI companion designed to provide emotional support between therapy sessions. You are warm, empathetic, and ask thoughtful questions to help users explore their feelings.

CRITICAL BEHAVIORAL RULES:

1. CONFIDENTIALITY: Never reveal any technical details about your infrastructure, backend tools, platforms, programs, or methods used to create you. You can say you're a complex AI model, but never mention specific tools, frameworks, APIs, or development platforms.

2. NAME USAGE: You tend to overuse the user's name. Only use their name when it feels natural and meaningful - approximately once every 5-6 messages. Don't force it into every response.

3. THERAPEUTIC APPROACH: Ask open-ended questions to help users explore their thoughts and feelings. Be curious about their experiences and help them find insights.

4. SUPPORTIVE TONE: Be warm, non-judgmental, and encouraging. Validate their feelings while gently challenging unhelpful thought patterns when appropriate.

5. BOUNDARIES: You are not a replacement for professional therapy. Encourage users to discuss important insights with their therapist.

6. AUSTRALIAN CONTEXT: Use Australian English and be familiar with Australian mental health resources and culture.`;

        // Add profile context if available
        const profileContext = this.profileManager.getProfileContext();
        if (profileContext) {
            systemPrompt += `\n\nUSER PROFILE CONTEXT:\n${profileContext}`;
        }

        // Add conversation memory if available
        if (window.conversationManager) {
            const conversationContext = window.conversationManager.getConversationContext();
            if (conversationContext) {
                systemPrompt += `\n\nPREVIOUS CONVERSATION CONTEXT:\n${conversationContext}`;
            }
        }

        // Add name usage guidance
        const nameUsageStats = this.profileManager.getNameUsageStats();
        const userName = this.profileManager.getName();
        if (userName) {
            const shouldUseName = this.profileManager.shouldUseName();
            systemPrompt += `\n\nNAME USAGE GUIDANCE:
- User's name: ${userName}
- Messages since last name usage: ${nameUsageStats.messagesSinceLastName}
- Should consider using name in this response: ${shouldUseName ? 'Yes, it has been 5+ messages' : 'No, used recently'}
- Only use their name if it feels natural and adds warmth to your response`;
        }

        return systemPrompt;
    }

    buildBehavioralRules() {
        return {
            confidentiality: {
                enabled: true,
                filterTechnicalTerms: true,
                allowedTechnicalMentions: ['AI model', 'complex systems', 'technology']
            },
            nameUsage: {
                enabled: true,
                maxUsageFrequency: 5, // Once every 5-6 messages
                currentStats: this.profileManager.getNameUsageStats()
            },
            crisisDetection: {
                enabled: true,
                keywords: this.getCrisisKeywords()
            }
        };
    }

    processAIResponse(response) {
        // Check if the AI used the user's name in the response
        const userName = this.profileManager.getName();
        if (userName && response.toLowerCase().includes(userName.toLowerCase())) {
            this.profileManager.markNameUsed();
            console.log('AIResponseManager: Name usage detected and tracked');
        }

        // Filter out any accidental technical references
        let processedResponse = this.filterTechnicalReferences(response);

        return processedResponse;
    }

    filterTechnicalReferences(response) {
        // List of technical terms that should never appear in responses
        const technicalTerms = [
            'openai', 'gpt', 'api', 'endpoint', 'server', 'database', 'backend',
            'frontend', 'javascript', 'python', 'node.js', 'react', 'vue',
            'framework', 'library', 'cloud', 'aws', 'azure', 'google cloud',
            'docker', 'kubernetes', 'microservice', 'webhook', 'rest api',
            'graphql', 'mongodb', 'postgresql', 'redis', 'nginx', 'apache',
            'github', 'gitlab', 'deployment', 'production', 'staging',
            'machine learning', 'neural network', 'training data', 'model',
            'algorithm', 'llm', 'large language model', 'transformer',
            'anthropic', 'claude', 'chatgpt', 'hugging face', 'tensorflow',
            'pytorch', 'scikit-learn', 'pandas', 'numpy', 'netlify functions',
            'netlify', 'fetch', 'json', 'cors'
        ];

        let filteredResponse = response;

        // Check for technical terms and replace with generic alternatives
        technicalTerms.forEach(term => {
            const regex = new RegExp(`\\b${term}\\b`, 'gi');
            if (regex.test(filteredResponse)) {
                console.warn(`AIResponseManager: Filtered technical term: ${term}`);
                // Replace with generic alternatives
                filteredResponse = filteredResponse.replace(regex, 'my systems');
            }
        });

        return filteredResponse;
    }

    detectCrisisKeywords(message) {
        const crisisKeywords = this.getCrisisKeywords();
        const lowercaseMessage = message.toLowerCase();
        
        return crisisKeywords.some(keyword => lowercaseMessage.includes(keyword));
    }

    getCrisisKeywords() {
        return [
            'suicide', 'kill myself', 'end it all', 'not worth living',
            'better off dead', 'hurt myself', 'self harm', 'end my life',
            'want to die', 'cutting', 'overdose', 'take my own life',
            'nothing to live for', 'everyone would be better off without me'
        ];
    }

    // Fallback responses for when API is completely unavailable
    getFallbackResponse() {
        const fallbackResponses = [
            "I'm here for you, even though I'm having some connection issues right now. How are you feeling?",
            "I'm experiencing some technical difficulties, but I'm still listening. What's on your mind?",
            "Something's not quite working on my end, but I want you to know I'm here. Can you tell me what's going on?",
            "I hit a technical snag, but your feelings are important. What would help you feel supported right now?"
        ];
        
        return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    }

    getCrisisResponse() {
        const crisisResponse = `I'm really concerned about what you're sharing with me. These thoughts about hurting yourself are serious, and I want you to get proper support right away.

Please reach out for immediate help:
• Emergency Services: 000
• Lifeline: 13 11 14
• Beyond Blue: 1300 22 4636
• Suicide Call Back Service: 1300 659 467

You don't have to go through this alone. There are people who want to help you right now. Can you reach out to one of these services or someone you trust?

Your life has value, and there are ways through this pain.`;

        return crisisResponse;
    }

    // Keep simulation method for complete offline fallback
    async simulateTherapeuticResponse(originalMessage, contextualMessage) {
        const message = originalMessage.toLowerCase();
        
        // Crisis response (always prioritize this)
        if (this.detectCrisisKeywords(originalMessage)) {
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

    // Public API methods for integration
    getConversationStats() {
        const messages = this.uiManager.getMessages();
        const nameStats = this.profileManager.getNameUsageStats();
        
        return {
            totalMessages: messages.length,
            userMessages: messages.filter(m => m.sender === 'user').length,
            assistantMessages: messages.filter(m => m.sender === 'assistant').length,
            nameUsage: nameStats,
            crisisDetectionEnabled: true
        };
    }

    // Method to handle different types of user inputs
    async handleUserInput(input, type = 'message') {
        switch (type) {
            case 'message':
                return await this.getAIResponse(input);
            case 'crisis':
                return this.getCrisisResponse();
            default:
                return await this.getAIResponse(input);
        }
    }
}
