// Conversation Manager - Handle New Conversations with Smart Context (Improved)
class ConversationManager {
    constructor(uiManager, profileManager) {
        this.uiManager = uiManager;
        this.profileManager = profileManager;
        this.conversationMemory = null;
        
        this.initializeElements();
        this.bindEvents();
        this.loadConversationMemory();
        
        console.log('ConversationManager initialized');
    }

    initializeElements() {
        this.newConversationButton = document.getElementById('new-conversation-button');
        this.conversationModal = document.getElementById('conversation-modal');
        this.closeModalButton = document.getElementById('close-conversation-modal');
        this.keepContextButton = document.getElementById('keep-context-button');
        this.completeResetButton = document.getElementById('complete-reset-button');
        this.cancelConversationButton = document.getElementById('cancel-conversation-button');
        
        // IMPROVEMENT: Cache these elements to avoid repeated DOM lookups
        this.messageCountElement = document.getElementById('message-count');
        this.contextPreview = document.getElementById('context-preview');
    }

    bindEvents() {
        // New conversation button
        if (this.newConversationButton) {
            this.newConversationButton.addEventListener('click', () => this.openConversationModal());
        }

        // Modal close events
        if (this.closeModalButton) {
            this.closeModalButton.addEventListener('click', () => this.closeConversationModal());
        }

        if (this.cancelConversationButton) {
            this.cancelConversationButton.addEventListener('click', () => this.closeConversationModal());
        }

        // Modal background click to close
        if (this.conversationModal) {
            this.conversationModal.addEventListener('click', (e) => {
                if (e.target === this.conversationModal) {
                    this.closeConversationModal();
                }
            });
        }

        // Action buttons
        if (this.keepContextButton) {
            this.keepContextButton.addEventListener('click', () => this.handleKeepContext());
        }

        if (this.completeResetButton) {
            this.completeResetButton.addEventListener('click', () => this.handleCompleteReset());
        }
    }

    openConversationModal() {
        if (!this.conversationModal) return;

        // Update modal content based on current conversation state
        this.updateModalContent();
        
        // Show modal
        this.conversationModal.classList.add('active');
        // IMPROVEMENT: Use CSS class for body overflow for cleaner separation
        document.body.classList.add('modal-open'); 
        
        console.log('Conversation modal opened');
    }

    closeConversationModal() {
        if (!this.conversationModal) return;
        
        this.conversationModal.classList.remove('active');
        // IMPROVEMENT: Use CSS class for body overflow
        document.body.classList.remove('modal-open'); 
        
        console.log('Conversation modal closed');
    }

    updateModalContent() {
        // Ensure uiManager is available before calling its methods
        const messageCount = this.uiManager ? this.uiManager.getMessageCount() : 0;
        const hasMessages = this.uiManager ? this.uiManager.hasMessages() : false;
        
        // Update message count in modal
        // IMPROVEMENT: Use cached element
        if (this.messageCountElement) {
            this.messageCountElement.textContent = messageCount;
        }

        // Update context preview
        // IMPROVEMENT: Use cached element
        if (this.contextPreview) {
            const preview = this.generateContextPreview();
            this.contextPreview.textContent = preview;
        }

        // Disable buttons if no conversation exists
        if (this.keepContextButton) {
            this.keepContextButton.disabled = !hasMessages;
        }
        
        if (this.completeResetButton) {
            this.completeResetButton.disabled = !hasMessages;
        }
    }

    generateContextPreview() {
        // Ensure uiManager is available before calling its methods
        const messages = this.uiManager ? this.uiManager.getMessages() : [];
        
        if (!messages || messages.length === 0) {
            return "No conversation context to preserve yet.";
        }

        // Extract topics and themes from the conversation
        const topics = this.extractTopicsFromMessages(messages);
        const recentTopics = topics.slice(-3); // Last 3 topics discussed
        
        if (recentTopics.length === 0) {
            return "General conversation topics and emotional context.";
        }
        
        return `Recent topics: ${recentTopics.join(', ')}`;
    }

    extractTopicsFromMessages(messages) {
        const topics = [];
        const topicKeywords = [
            'anxiety', 'depression', 'stress', 'work', 'relationship', 'family',
            'therapy', 'medication', 'sleep', 'mood', 'panic', 'social',
            'confidence', 'self-esteem', 'trauma', 'grief', 'anger', 'fear',
            'worry', 'overthinking', 'boundaries', 'communication', 'conflict'
        ];

        messages.forEach(message => {
            if (message.sender === 'user') {
                const text = message.content.toLowerCase();
                topicKeywords.forEach(keyword => {
                    if (text.includes(keyword) && !topics.includes(keyword)) {
                        topics.push(keyword);
                    }
                });
            }
        });

        return topics;
    }

    handleKeepContext() {
        console.log('Starting new conversation with context preservation...');
        
        try {
            // Save current conversation context before clearing
            this.saveConversationContext();
            
            // IMPROVEMENT: Call uiManager's method to clear history
            this.clearMessageHistory(); 
            
            // Show success message
            this.showSuccessMessage('New conversation started! Talbot remembers your previous topics.', 'context-kept');
            
            // Close modal
            this.closeConversationModal();
            
            console.log('Successfully started new conversation with context preserved');
            
        } catch (error) {
            console.error('Error starting new conversation with context:', error);
            this.showErrorMessage('Sorry, there was an issue starting a new conversation. Please try again.');
        }
    }

    handleCompleteReset() {
        console.log('Starting complete conversation reset...');
        
        // Show confirmation for complete reset
        const confirmed = confirm(
            'Are you sure you want a complete reset?\n\n' +
            'This will:\n' +
            '• Clear all messages\n' +
            '• Make Talbot forget this entire conversation\n' +
            '• Start completely fresh\n\n' +
            'This cannot be undone.'
        );
        
        if (!confirmed) {
            console.log('Complete reset cancelled by user');
            return;
        }
        
        try {
            // Clear everything
            // IMPROVEMENT: Call uiManager's method to clear history
            this.clearMessageHistory(); 
            this.clearConversationMemory();
            
            // Show success message
            this.showSuccessMessage('Complete reset successful! Starting fresh with Talbot.', 'complete-reset');
            
            // Close modal
            this.closeConversationModal();
            
            console.log('Successfully completed full conversation reset');
            
        } catch (error) {
            console.error('Error performing complete reset:', error);
            this.showErrorMessage('Sorry, there was an issue resetting the conversation. Please try again.');
        }
    }

    saveConversationContext() {
        // Ensure uiManager is available before calling its methods
        const messages = this.uiManager ? this.uiManager.getMessages() : [];
        
        if (!messages || messages.length === 0) {
            console.log('No messages to save context from');
            return;
        }

        // Generate conversation summary
        const context = {
            lastUpdated: new Date().toISOString(),
            messageCount: messages.length,
            topics: this.extractTopicsFromMessages(messages),
            summary: this.generateConversationSummary(messages),
            emotionalTone: this.analyzeEmotionalTone(messages),
            keyThemes: this.extractKeyThemes(messages)
        };

        // Save to localStorage
        localStorage.setItem('talbot-conversation-memory', JSON.stringify(context));
        this.conversationMemory = context;
        
        console.log('Conversation context saved:', context);
    }

    generateConversationSummary(messages) {
        // Simple summary generation
        const userMessages = messages.filter(m => m.sender === 'user');
        const recentMessages = userMessages.slice(-5); // Last 5 user messages
        
        if (recentMessages.length === 0) {
            return "Brief conversation with Talbot";
        }
        
        const topics = this.extractTopicsFromMessages(recentMessages);
        const mainTopic = topics[0] || 'general wellbeing';
        
        return `Recent discussion about ${mainTopic} and related topics`;
    }

    analyzeEmotionalTone(messages) {
        const userMessages = messages.filter(m => m.sender === 'user');
        const emotionalWords = {
            anxious: ['anxious', 'worried', 'stress', 'panic', 'nervous'],
            sad: ['sad', 'depressed', 'down', 'hopeless', 'empty'],
            angry: ['angry', 'frustrated', 'mad', 'irritated', 'annoyed'],
            positive: ['good', 'better', 'happy', 'grateful', 'hopeful']
        };
        
        const toneCount = { anxious: 0, sad: 0, angry: 0, positive: 0 };
        
        userMessages.forEach(message => {
            const text = message.content.toLowerCase();
            Object.keys(emotionalWords).forEach(tone => {
                emotionalWords[tone].forEach(word => {
                    if (text.includes(word)) {
                        toneCount[tone]++;
                    }
                });
            });
        });
        
        // Return dominant tone
        const dominantTone = Object.keys(toneCount).reduce((a, b) => 
            toneCount[a] > toneCount[b] ? a : b
        );
        
        return toneCount[dominantTone] > 0 ? dominantTone : 'neutral';
    }

    extractKeyThemes(messages) {
        const userMessages = messages.filter(m => m.sender === 'user');
        const themes = [];
        
        // Simple theme extraction based on common patterns
        const themePatterns = {
            'coping-strategies': ['cope', 'manage', 'deal with', 'handle'],
            'therapy-goals': ['goal', 'working on', 'trying to', 'want to change'],
            'relationships': ['relationship', 'partner', 'friend', 'family'],
            'work-stress': ['work', 'job', 'boss', 'career', 'colleague']
        };
        
        Object.keys(themePatterns).forEach(theme => {
            const hasTheme = userMessages.some(message => {
                const text = message.content.toLowerCase();
                return themePatterns[theme].some(pattern => text.includes(pattern));
            });
            
            if (hasTheme) {
                themes.push(theme);
            }
        });
        
        return themes;
    }

    // FIX FOR DUPLICATE MESSAGE ISSUE: Delegate clearing to UIManager
    clearMessageHistory() {
        if (this.uiManager && typeof this.uiManager.clearMessages === 'function') {
            this.uiManager.clearMessages(); // Call UIManager's method to handle its own state and DOM
            console.log('Message history cleared via UIManager');
        } else {
            console.error('UIManager or its clearMessages method not available. Cannot clear message history.');
            // Fallback for extreme cases, though uiManager should always be available
            this.uiManager.messages = []; // Old problematic line, keep as last resort fallback if uiManager is null
            if (this.uiManager.messagesContainer) { // Old problematic line, keep as last resort fallback
                this.uiManager.messagesContainer.innerHTML = `
                    <div class="welcome-message">
                        <h2>Hi, I'm Talbot</h2>
                        <p>I'm here to provide a safe space to talk through things between your therapy sessions. I find it helpful to ask questions to get to the root of why you might be feeling a certain way - just like your therapist does.</p>
                    </div>
                `;
            }
            localStorage.removeItem('talbot-chat-history'); // Old problematic line, keep as last resort fallback
        }
    }

    clearConversationMemory() {
        // Clear conversation memory
        localStorage.removeItem('talbot-conversation-memory');
        this.conversationMemory = null;
        
        console.log('Conversation memory cleared');
    }

    loadConversationMemory() {
        try {
            const saved = localStorage.getItem('talbot-conversation-memory');
            if (saved) {
                this.conversationMemory = JSON.parse(saved);
                console.log('Conversation memory loaded:', this.conversationMemory);
            }
        } catch (error) {
            console.error('Error loading conversation memory:', error);
        }
    }

    // IMPROVEMENT: Refactored to reduce duplication and use CSS classes for styling
    _showMessage(text, type, duration) {
        const messageDiv = document.createElement('div');
        // Use CSS classes instead of inline styles for better separation of concerns
        messageDiv.className = `conversation-status ${type}`; 
        messageDiv.textContent = text;
        
        // NOTE: The actual CSS for .conversation-status, .success, and .error classes 
        // should be defined in your CSS file (e.g., style.css).
        // Example CSS:
        /*
        .conversation-status {
            position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
            z-index: 1002; padding: 12px 24px; border-radius: 8px; font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2); font-family: 'Lora', serif;
            max-width: 400px; text-align: center; opacity: 0; 
            transition: all 0.3s ease;
        }
        .conversation-status.success {
            background: #27ae60; color: white;
        }
        .conversation-status.error {
            background: #e74c3c; color: white;
        }
        .conversation-status.active { // For fade-in
            opacity: 1;
        }
        */

        document.body.appendChild(messageDiv);
        
        // Show with animation
        setTimeout(() => {
            messageDiv.classList.add('active'); // Add active class to trigger fade-in
        }, 100);
        
        // Hide after delay
        setTimeout(() => {
            messageDiv.classList.remove('active'); // Remove active class to trigger fade-out
            setTimeout(() => messageDiv.remove(), 300);
        }, duration);
    }

    showSuccessMessage(text, type = 'success') {
        this._showMessage(text, type, 4000);
    }

    showErrorMessage(text) {
        this._showMessage(text, 'error', 5000);
    }

    // Public API methods
    getConversationMemory() {
        return this.conversationMemory;
    }

    hasConversationMemory() {
        return this.conversationMemory !== null;
    }

    getConversationContext() {
        if (!this.conversationMemory) {
            return '';
        }

        let context = '';
        
        if (this.conversationMemory.summary) {
            context += `Previous conversation context: ${this.conversationMemory.summary}. `;
        }
        
        if (this.conversationMemory.topics && this.conversationMemory.topics.length > 0) {
            context += `Topics previously discussed: ${this.conversationMemory.topics.join(', ')}. `;
        }
        
        if (this.conversationMemory.emotionalTone && this.conversationMemory.emotionalTone !== 'neutral') {
            context += `Previous emotional tone was ${this.conversationMemory.emotionalTone}. `;
        }
        
        if (this.conversationMemory.keyThemes && this.conversationMemory.keyThemes.length > 0) {
            context += `Key themes from before: ${this.conversationMemory.keyThemes.join(', ')}. `;
        }
        
        return context.trim();
    }
}
