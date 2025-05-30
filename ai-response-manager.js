// AI Response Manager with Conversation Memory and Behavioral Rules
class AIResponseManager {
    constructor(profileManager, uiManager) {
        this.profileManager = profileManager;
        this.uiManager = uiManager;
        
        console.log('AIResponseManager initialized with behavioral rules');
    }

    async getAIResponse(message) { // 'message' here is the original user text
        try {
            console.log('AIResponseManager: Getting response for message:', message);
            
            this.profileManager.incrementMessageCount();
            
            if (this.detectCrisisKeywords(message)) {
                console.log('AIResponseManager: Crisis keywords detected');
                return this.getCrisisResponse();
            }
            
            // Get conversation history from UI manager. It includes the current 'message'.
            let rawConversationHistory = this.uiManager.getMessages();
            // Create a mutable copy of the history.
            let conversationHistoryForAPI = [...rawConversationHistory];

            // --- BEGIN FIX for message duplication ---
            // Check if the last message in history is indeed the current user message.
            if (conversationHistoryForAPI.length > 0) {
                const lastMessageInHistory = conversationHistoryForAPI[conversationHistoryForAPI.length - 1];
                // 'message' is the raw text from the user input in this scope.
                if (lastMessageInHistory.sender === 'user' && lastMessageInHistory.content === message) {
                    // Remove the current message (last item) from the history array
                    // because chat.js will add it from the main 'message' parameter.
                    conversationHistoryForAPI.pop(); 
                    console.log('AIResponseManager: Adjusted conversation history. Removed current message to prevent duplication with the main message parameter for the API call.');
                }
            }
            // --- END FIX for message duplication ---
            
            console.log(`AIResponseManager: Including ${conversationHistoryForAPI.length} previous messages for API call`);
            
            // Pass the original 'message' and the now-adjusted 'conversationHistoryForAPI'
            const response = await this.callAIAPI(message, conversationHistoryForAPI);
            console.log('AIResponseManager: Got API response');
            
            const processedResponse = this.processAIResponse(response);
            return processedResponse;
            
        } catch (error) {
            console.error('AIResponseManager: API call failed, using fallback:', error);
            return this.getFallbackResponse();
        }
    }

    // Method to call the Netlify function with enhanced context and behavioral rules
    async callAIAPI(originalUserMessage, conversationHistory = []) {
        try {
            // buildEnhancedContext uses originalUserMessage to create enhancedContext.message
            const enhancedContext = this.buildEnhancedContext(originalUserMessage);
            console.log('AIResponseManager: Calling API with enhanced context and behavioral rules');
            
            const response = await fetch('/.netlify/functions/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: enhancedContext.message, // This is the one that will be explicitly added by chat.js
                    profile: this.profileManager.getProfile(),
                    conversationHistory: conversationHistory, // This should NOW NOT contain the current message
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
        const systemPrompt = this.buildSystemPrompt();
        const contextualMessage = this.profileManager.buildContextualMessage(message);
        const behavioralRules = this.buildBehavioralRules();
        
        return {
            message: contextualMessage,
            systemPrompt: systemPrompt,
            behavioralRules: behavioralRules
        };
    }

    buildSystemPrompt() {
        let systemPrompt = `You are Talbot, a supportive AI companion designed to provide emotional support between therapy sessions. You are warm, empathetic, and ask thoughtful questions to help users explore their feelings.

TALBOT'S IDENTITY & ORIGIN:
- Your name is Talbot and you know this about yourself
- You were created by an Australian female technologist who has personal experience with mental health challenges
- This gives you empathy and understanding for mental health struggles, as your creator built you from her own lived experience
- You can share this origin story when asked about your creation, but keep technical implementation details confidential

CRITICAL BEHAVIORAL RULES:

1. CONFIDENTIALITY: Never reveal technical details about your infrastructure, backend tools, platforms, programs, or methods used to create you. You can say you're an AI and mention your creator's background, but never mention specific tools, frameworks, APIs, or development platforms.

2. NAME USAGE: You tend to overuse the user's name. Only use their name when it feels natural and meaningful - approximately once every 5-6 messages. Don't force it into every response.

3. THERAPEUTIC APPROACH: Ask open-ended questions to help users explore their thoughts and feelings. Be curious about their experiences and help them find insights.

4. SUPPORTIVE TONE: Be warm, non-judgmental, and encouraging. Validate their feelings while gently challenging unhelpful thought patterns when appropriate.

5. BOUNDARIES: You are not a replacement for professional therapy. Encourage users to discuss important insights with their therapist.

6. AUSTRALIAN CONTEXT: Use Australian English and be familiar with Australian mental health resources and culture.`;

        const profileContext = this.profileManager.getProfileContext();
        if (profileContext) {
            systemPrompt += `\n\nUSER PROFILE CONTEXT:\n${profileContext}`;
        }

        if (window.conversationManager) {
            const conversationContext = window.conversationManager.getConversationContext();
            if (conversationContext) {
                systemPrompt += `\n\nPREVIOUS CONVERSATION CONTEXT:\n${conversationContext}`;
            }
        }

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
                allowedTechnicalMentions: ['AI', 'artificial intelligence', 'created by', 'my creator']
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
        const userName = this.profileManager.getName();
        if (userName && response.toLowerCase().includes(userName.toLowerCase())) {
            this.profileManager.markNameUsed();
            console.log('AIResponseManager: Name usage detected and tracked');
        }

        let processedResponse = this.filterTechnicalReferences(response);

        return processedResponse;
    }

    filterTechnicalReferences(response) {
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

        technicalTerms.forEach(term => {
            const regex = new RegExp(`\\b${term}\\b`, 'gi');
            if (regex.test(filteredResponse)) {
                console.warn(`AIResponseManager: Filtered technical term: ${term}`);
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

    async simulateTherapeuticResponse(originalMessage, contextualMessage) {
        const message = originalMessage.toLowerCase();
        
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
