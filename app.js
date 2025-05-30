// Main Talbot Application with Conversation Memory - Fixed Duplication
class TalbotApp {
    constructor() {
        this.isProcessingMessage = false; // Prevent duplicate message processing
        this.initializeComponents();
        this.setupEventHandlers();
        this.registerServiceWorker();
        
        // Load any saved data
        this.uiManager.loadChatHistory();
        
        console.log('Talbot initialized successfully with conversation memory and duplication fixes');
    }

    initializeComponents() {
        // Initialize managers in order of dependency
        this.profileManager = new ProfileManager();
        this.speechManager = new SpeechManager();
        this.uiManager = new UIManager();
        
        // Pass uiManager to aiResponseManager so it can access conversation history
        this.aiResponseManager = new AIResponseManager(this.profileManager, this.uiManager);
    }

    setupEventHandlers() {
        // Connect UI events to app logic with duplication prevention
        this.uiManager.setOnSendMessage(() => {
            if (!this.isProcessingMessage) {
                this.handleSendMessage();
            }
        });
        
        // Connect speech events
        this.speechManager.setOnSpeechResult((transcript) => {
            if (!this.isProcessingMessage) {
                this.handleSendMessage(); // Auto-send when speech is recognized
            }
        });
        
        // Handle window events
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
        
        // Handle visibility changes (for mobile)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.speechManager.getIsSpeaking()) {
                this.speechManager.stopSpeaking();
            }
        });
    }

    async handleSendMessage() {
        // Prevent duplicate processing
        if (this.isProcessingMessage) {
            console.log('Message already being processed, skipping duplicate');
            return;
        }

        const message = this.uiManager.getMessageInput();
        if (!message || !message.trim()) {
            console.log('Empty message, not sending');
            return;
        }

        try {
            // Set processing state
            this.isProcessingMessage = true;
            this.uiManager.setProcessingState(true);

            console.log('Processing message:', message);

            // Add user message immediately
            this.uiManager.addMessage('user', message);
            this.uiManager.clearMessageInput();

            // Show typing indicator
            this.uiManager.showTyping();
            this.speechManager.updateStatus('Talbot is thinking...', '🤔');

            // Get AI response (now includes conversation history)
            const response = await this.aiResponseManager.getAIResponse(message);

            // Hide typing and show response
            this.uiManager.hideTyping();
            this.uiManager.addMessage('assistant', response);
            
            // Speak the response
            this.speechManager.speakMessage(response);
            
            // Update status
            this.speechManager.updateStatus('Ready to listen', '💙');

        } catch (error) {
            console.error('Error handling message:', error);
            this.uiManager.hideTyping();
            this.uiManager.showError('Sorry mate, I had trouble processing that. Please try again.');
            this.speechManager.updateStatus('Ready to listen', '💙');
        } finally {
            // Reset processing state
            this.isProcessingMessage = false;
            this.uiManager.setProcessingState(false);
            this.uiManager.focusMessageInput();
        }
    }

    // Service Worker Registration for PWA
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const swCode = `
                    const CACHE_NAME = 'talbot-v2';
                    const urlsToCache = [
                        '/',
                        '/index.html',
                        '/styles.css',
                        '/talbot-config.js',
                        '/profile-manager.js',
                        '/speech-manager.js',
                        '/ai-response-manager.js',
                        '/ui-manager.js',
                        '/app.js'
                    ];
                    
                    self.addEventListener('install', (event) => {
                        event.waitUntil(
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    return cache.addAll(urlsToCache).catch(err => {
                                        console.log('Cache addAll failed:', err);
                                    });
                                })
                        );
                    });
                    
                    self.addEventListener('fetch', (event) => {
                        event.respondWith(
                            caches.match(event.request)
                                .then((response) => {
                                    return response || fetch(event.request);
                                })
                                .catch(() => {
                                    if (event.request.destination === 'document') {
                                        return caches.match('/index.html');
                                    }
                                })
                        );
                    });
                `;
                
                const blob = new Blob([swCode], { type: 'application/javascript' });
                const swUrl = URL.createObjectURL(blob);
                
                const registration = await navigator.serviceWorker.register(swUrl);
                console.log('Service Worker registered successfully:', registration.scope);
                
            } catch (error) {
                console.log('Service Worker registration failed:', error);
            }
        }
    }

    // Cleanup method
    cleanup() {
        // Stop any ongoing speech
        if (this.speechManager.getIsSpeaking()) {
            this.speechManager.stopSpeaking();
        }
        
        // Stop listening
        if (this.speechManager.getIsListening()) {
            this.speechManager.stopListening();
        }
    }

    // Public methods for external access
    exportChatHistory() {
        this.uiManager.exportChat();
    }

    clearChatHistory() {
        this.uiManager.clearChatHistory();
    }

    getProfile() {
        return this.profileManager.getProfile();
    }

    getChatMessages() {
        return this.uiManager.getMessages();
    }

    // Development/debugging helpers
    simulateMessage(message) {
        if (!this.isProcessingMessage) {
            this.uiManager.messageInput.value = message;
            this.handleSendMessage();
        }
    }

    getAppState() {
        return {
            profile: this.profileManager.getProfile(),
            documents: this.profileManager.getDocuments(),
            messageCount: this.uiManager.getMessageCount(),
            isListening: this.speechManager.getIsListening(),
            isSpeaking: this.speechManager.getIsSpeaking(),
            conversationLength: this.uiManager.getMessages().length,
            isProcessingMessage: this.isProcessingMessage
        };
    }

    // Error recovery
    handleError(error, context = 'Unknown') {
        console.error(`Talbot Error [${context}]:`, error);
        
        // Reset processing state on error
        this.isProcessingMessage = false;
        this.uiManager.setProcessingState(false);
        
        // Try to recover gracefully
        this.uiManager.hideTyping();
        this.speechManager.updateStatus('Ready to listen', '💙');
        this.uiManager.enableSendButton();
        
        // Show user-friendly error message
        const errorMessages = [
            "I'm having a bit of trouble right now, but I'm still here for you.",
            "Something went wrong on my end, mate. Can you try that again?",
            "I hit a snag there, but I'm ready to listen when you are.",
            "Technical hiccup! I'm back now - what were you saying?"
        ];
        
        const randomError = errorMessages[Math.floor(Math.random() * errorMessages.length)];
        this.uiManager.showError(randomError);
    }
}

// Global error handler
window.addEventListener('error', (event) => {
    if (window.talbotApp) {
        window.talbotApp.handleError(event.error, 'Global Error');
    }
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    if (window.talbotApp) {
        window.talbotApp.handleError(event.reason, 'Unhandled Promise');
    }
    event.preventDefault();
});

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.talbotApp = new TalbotApp();
        
        // Add helpful console methods for development
        if (typeof window !== 'undefined') {
            window.talbot = {
                exportChat: () => window.talbotApp.exportChatHistory(),
                clearChat: () => window.talbotApp.clearChatHistory(),
                getProfile: () => window.talbotApp.getProfile(),
                getState: () => window.talbotApp.getAppState(),
                simulate: (msg) => window.talbotApp.simulateMessage(msg),
                getHistory: () => window.talbotApp.getChatMessages(),
                version: '2.0.1-fixed-duplication'
            };
            
            console.log('🤖 Talbot v2.0.1 with Fixed Duplication is ready! Try these console commands:');
            console.log('  talbot.getState() - Get app state');
            console.log('  talbot.getHistory() - See conversation history');
            console.log('  talbot.simulate("test message") - Send a test message');
            console.log('  talbot.exportChat() - Export chat history');
            console.log('  talbot.clearChat() - Clear chat history');
        }
        
    } catch (error) {
        console.error('Failed to initialize Talbot:', error);
        
        // Show fallback error message
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <h2 style="color: #e74c3c;">Oops! Something went wrong</h2>
                <p>Talbot couldn't start properly. Please refresh the page and try again.</p>
                <p style="font-size: 12px; margin-top: 20px;">Error: ${error.message}</p>
                <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #4A90E2; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    Refresh Page
                </button>
            </div>
        `;
        
        const container = document.querySelector('.container');
        if (container) {
            container.innerHTML = '';
            container.appendChild(errorDiv);
        }
    }
});
