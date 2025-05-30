// UI Manager - Handle Interface Updates and Message Display
class UIManager {
    constructor() {
        this.messages = [];
        this.isTyping = false;
        
        this.initializeElements();
        this.bindEvents();
        this.loadChatHistory();
        
        console.log('UIManager initialized');
    }

    initializeElements() {
        this.messagesContainer = document.getElementById('messages-container');
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-button');
        this.typingIndicator = document.getElementById('typing-indicator');
    }

    bindEvents() {
        // Send button
        if (this.sendButton) {
            this.sendButton.addEventListener('click', () => this.handleSendMessage());
        }

        // Enter key to send
        if (this.messageInput) {
            this.messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleSendMessage();
                }
            });

            // Auto-resize textarea
            this.messageInput.addEventListener('input', () => this.autoResizeTextarea());
        }
    }

    handleSendMessage() {
        const message = this.messageInput?.value?.trim();
        if (!message) return;

        // Add user message to UI
        this.addMessage(message, 'user');
        
        // Clear input
        if (this.messageInput) {
            this.messageInput.value = '';
            this.autoResizeTextarea();
        }

        // Trigger AI response (this will be called by the main app)
        if (window.aiHandler) {
            // Check for crisis keywords first
            if (window.aiHandler.detectCrisisKeywords(message)) {
                window.aiHandler.handleUserInput(message, 'crisis');
            } else {
                window.aiHandler.handleUserInput(message, 'message');
            }
        }
    }

    addMessage(content, sender, timestamp = null) {
        const messageObj = {
            content: content,
            sender: sender, // 'user' or 'assistant'
            timestamp: timestamp || new Date().toISOString(),
            id: this.generateMessageId()
        };

        this.messages.push(messageObj);
        this.renderMessage(messageObj);
        this.scrollToBottom();
        this.saveChatHistory();

        return messageObj;
    }

    renderMessage(messageObj) {
        if (!this.messagesContainer) return;

        const messageElement = document.createElement('div');
        messageElement.className = `message ${messageObj.sender}`;
        messageElement.id = `message-${messageObj.id}`;

        const timeString = new Date(messageObj.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });

        messageElement.innerHTML = `
            <div class="message-content">
                <div class="message-text">${this.formatMessageContent(messageObj.content)}</div>
                <div class="message-time">${timeString}</div>
            </div>
        `;

        // Remove welcome message if it exists
        const welcomeMessage = this.messagesContainer.querySelector('.welcome-message');
        if (welcomeMessage && this.messages.length === 1) {
            welcomeMessage.remove();
        }

        this.messagesContainer.appendChild(messageElement);
    }

    formatMessageContent(content) {
        // Convert line breaks to <br> tags
        let formatted = content.replace(/\n/g, '<br>');
        
        // Convert URLs to clickable links
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        formatted = formatted.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
        
        return formatted;
    }

    showTypingIndicator() {
        this.isTyping = true;
        
        if (this.typingIndicator) {
            this.typingIndicator.style.display = 'block';
            this.scrollToBottom();
        } else {
            // Create typing indicator if it doesn't exist
            this.createTypingIndicator();
        }
    }

    hideTypingIndicator() {
        this.isTyping = false;
        
        if (this.typingIndicator) {
            this.typingIndicator.style.display = 'none';
        }
    }

    createTypingIndicator() {
        if (!this.messagesContainer) return;

        const typingElement = document.createElement('div');
        typingElement.id = 'typing-indicator';
        typingElement.className = 'message assistant typing';
        typingElement.innerHTML = `
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;

        this.messagesContainer.appendChild(typingElement);
        this.typingIndicator = typingElement;
        this.scrollToBottom();
    }

    autoResizeTextarea() {
        if (!this.messageInput) return;

        // Reset height to auto to get the correct scrollHeight
        this.messageInput.style.height = 'auto';
        
        // Set height based on scrollHeight, with min and max limits
        const minHeight = 40;
        const maxHeight = 120;
        const newHeight = Math.min(Math.max(this.messageInput.scrollHeight, minHeight), maxHeight);
        
        this.messageInput.style.height = newHeight + 'px';
    }

    scrollToBottom() {
        if (!this.messagesContainer) return;

        setTimeout(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }, 100);
    }

    generateMessageId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Chat history management
    saveChatHistory() {
        try {
            localStorage.setItem('talbot-chat-history', JSON.stringify(this.messages));
        } catch (error) {
            console.error('Error saving chat history:', error);
        }
    }

    loadChatHistory() {
        try {
            const saved = localStorage.getItem('talbot-chat-history');
            if (saved) {
                this.messages = JSON.parse(saved);
                this.renderChatHistory();
                console.log('Chat history loaded:', this.messages.length, 'messages');
            } else {
                this.showWelcomeMessage();
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
            this.showWelcomeMessage();
        }
    }

    renderChatHistory() {
        if (!this.messagesContainer) return;

        // Clear existing messages
        this.messagesContainer.innerHTML = '';

        if (this.messages.length === 0) {
            this.showWelcomeMessage();
            return;
        }

        // Render all messages
        this.messages.forEach(message => {
            this.renderMessage(message);
        });

        this.scrollToBottom();
    }

    showWelcomeMessage() {
        if (!this.messagesContainer) return;

        this.messagesContainer.innerHTML = `
            <div class="welcome-message">
                <h2>Hi, I'm Talbot</h2>
                <p>I'm here to provide a safe space to talk through things between your therapy sessions. I find it helpful to ask questions to get to the root of why you might be feeling a certain way - just like your therapist does.</p>
            </div>
        `;
    }

    clearMessages() {
        this.messages = [];
        if (this.messagesContainer) {
            this.messagesContainer.innerHTML = '';
        }
        this.showWelcomeMessage();
        localStorage.removeItem('talbot-chat-history');
    }

    // Public API methods
    getMessages() {
        return this.messages;
    }

    getMessageCount() {
        return this.messages.length;
    }

    hasMessages() {
        return this.messages.length > 0;
    }

    getLastMessage() {
        return this.messages[this.messages.length - 1] || null;
    }

    getUserMessages() {
        return this.messages.filter(m => m.sender === 'user');
    }

    getAssistantMessages() {
        return this.messages.filter(m => m.sender === 'assistant');
    }

    // Message editing/deletion (for future features)
    editMessage(messageId, newContent) {
        const messageIndex = this.messages.findIndex(m => m.id === messageId);
        if (messageIndex !== -1) {
            this.messages[messageIndex].content = newContent;
            this.messages[messageIndex].edited = true;
            this.messages[messageIndex].editedAt = new Date().toISOString();
            this.saveChatHistory();
            this.renderChatHistory();
        }
    }

    deleteMessage(messageId) {
        this.messages = this.messages.filter(m => m.id !== messageId);
        this.saveChatHistory();
        this.renderChatHistory();
    }

    // Export chat functionality
    exportChat() {
        const chatData = {
            exportDate: new Date().toISOString(),
            messageCount: this.messages.length,
            messages: this.messages
        };

        const dataStr = JSON.stringify(chatData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `talbot-chat-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Search functionality
    searchMessages(query) {
        if (!query) return [];

        const lowercaseQuery = query.toLowerCase();
        return this.messages.filter(message =>
            message.content.toLowerCase().includes(lowercaseQuery)
        );
    }

    // Message statistics
    getMessageStats() {
        const userMessages = this.getUserMessages();
        const assistantMessages = this.getAssistantMessages();
        
        return {
            total: this.messages.length,
            user: userMessages.length,
            assistant: assistantMessages.length,
            averageUserMessageLength: userMessages.reduce((acc, msg) => acc + msg.content.length, 0) / userMessages.length || 0,
            averageAssistantMessageLength: assistantMessages.reduce((acc, msg) => acc + msg.content.length, 0) / assistantMessages.length || 0,
            firstMessage: this.messages[0]?.timestamp || null,
            lastMessage: this.messages[this.messages.length - 1]?.timestamp || null
        };
    }
}
