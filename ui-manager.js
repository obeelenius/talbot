// UI Manager with Profile Photo Support and Talbot Avatar - Fixed Display Issue
class UIManager {
    constructor() {
        this.messages = [];
        this.isProcessingMessage = false; // Prevent duplicate processing
        this.initializeElements();
        this.bindEvents();
        this.setupViewportHeight();
    }

    initializeElements() {
        this.messagesContainer = document.getElementById('messages');
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-button');
        this.typingIndicator = document.getElementById('typing-indicator');
    }

    bindEvents() {
        // Send button - prevent double clicks
        this.sendButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (!this.isProcessingMessage) {
                this.onSendMessage?.();
            }
        });
        
        // Enter key to send (shift+enter for new line) - prevent double submission
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey && !this.isProcessingMessage) {
                e.preventDefault();
                this.onSendMessage?.();
            }
        });
        
        // Auto-resize textarea
        this.messageInput.addEventListener('input', () => {
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
        });
    }

    setupViewportHeight() {
        const setViewportHeight = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        
        setViewportHeight();
        window.addEventListener('resize', setViewportHeight);
        window.addEventListener('orientationchange', () => {
            setTimeout(setViewportHeight, 100);
        });
    }

    // Enhanced addMessage with profile photo support and Talbot avatar - Fixed display
    addMessage(sender, content) {
        // Validate input
        if (!content || typeof content !== 'string' || !content.trim()) {
            console.log('Invalid message content, skipping');
            return;
        }

        const trimmedContent = content.trim();
        console.log(`Adding ${sender} message:`, trimmedContent);

        try {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${sender}`;
            
            const avatar = document.createElement('div');
            avatar.className = 'message-avatar';
            
            // Handle avatars for different senders
            if (sender === 'user' && window.talbotApp?.profileManager) {
                const userAvatar = window.talbotApp.profileManager.getUserAvatar();
                avatar.innerHTML = userAvatar;
            } else if (sender === 'assistant') {
                // Use Talbot favicon for assistant messages
                avatar.innerHTML = '<img src="/favicon-32x32.png" alt="Talbot" class="talbot-avatar">';
            } else {
                // Fallback avatars
                avatar.innerHTML = sender === 'user' ? '👤' : '🤖';
            }
            
            const messageContent = document.createElement('div');
            messageContent.className = 'message-content';
            messageContent.textContent = trimmedContent;
            
            // Add timestamp
            const messageTime = document.createElement('div');
            messageTime.className = 'message-time';
            messageTime.textContent = this.formatTime(new Date());
            
            messageDiv.appendChild(avatar);
            messageDiv.appendChild(messageContent);
            messageContent.appendChild(messageTime);
            
            // Remove welcome message if it exists
            const welcomeMessage = this.messagesContainer.querySelector('.welcome-message');
            if (welcomeMessage) {
                welcomeMessage.remove();
            }
            
            // Add to DOM
            this.messagesContainer.appendChild(messageDiv);
            console.log('Message added to DOM successfully');
            
            this.scrollToBottom();
            
            // Store message - simplified logic
            const messageData = { 
                sender, 
                content: trimmedContent, 
                timestamp: new Date() 
            };
            
            this.messages.push(messageData);
            this.saveChatHistory();
            
            console.log(`Total messages now: ${this.messages.length}`);
            
        } catch (error) {
            console.error('Error adding message:', error);
        }
    }

    formatTime(date) {
        return date.toLocaleTimeString('en-AU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    clearMessageInput() {
        if (this.messageInput) {
            this.messageInput.value = '';
            this.messageInput.style.height = 'auto';
        }
    }

    getMessageInput() {
        if (!this.messageInput) return '';
        const message = this.messageInput.value.trim();
        return message;
    }

    // Set processing state to prevent duplicates
    setProcessingState(isProcessing) {
        this.isProcessingMessage = isProcessing;
        if (this.sendButton) {
            this.sendButton.disabled = isProcessing;
        }
    }

    // Typing Indicator
    showTyping() {
        if (this.typingIndicator) {
            this.typingIndicator.style.display = 'flex';
            this.scrollToBottom();
        }
    }

    hideTyping() {
        if (this.typingIndicator) {
            this.typingIndicator.style.display = 'none';
        }
    }

    // Scrolling
    scrollToBottom() {
        if (this.messagesContainer) {
            setTimeout(() => {
                this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
            }, 50);
        }
    }

    // Status Messages
    showError(message) {
        this.showStatusMessage(message, 'error');
    }

    showSuccess(message) {
        this.showStatusMessage(message, 'success');
    }

    showStatusMessage(text, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `${type}-message`;
        messageDiv.textContent = text;
        
        const chatContainer = document.querySelector('.chat-container');
        if (chatContainer && this.messagesContainer) {
            chatContainer.insertBefore(messageDiv, this.messagesContainer);
            
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 5000);
        }
    }

    // Chat History Management
    saveChatHistory() {
        try {
            const historyToSave = this.messages.slice(-50);
            localStorage.setItem('talbot-chat-history', JSON.stringify(historyToSave));
        } catch (error) {
            console.error('Error saving chat history:', error);
        }
    }

    loadChatHistory() {
        try {
            const savedHistory = localStorage.getItem('talbot-chat-history');
            if (savedHistory) {
                this.messages = JSON.parse(savedHistory);
                this.displayChatHistory();
                console.log(`Loaded ${this.messages.length} messages from history`);
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    }

    displayChatHistory() {
        if (!this.messagesContainer) return;
        
        const welcomeMessage = this.messagesContainer.querySelector('.welcome-message');
        if (welcomeMessage && this.messages.length > 0) {
            welcomeMessage.remove();
        }

        this.messages.forEach(message => {
            this.displayHistoryMessage(message);
        });

        this.scrollToBottom();
    }

    displayHistoryMessage(message) {
        if (!this.messagesContainer) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.sender}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        
        // Handle avatars for historical messages
        if (message.sender === 'user' && window.talbotApp?.profileManager) {
            const userAvatar = window.talbotApp.profileManager.getUserAvatar();
            avatar.innerHTML = userAvatar;
        } else if (message.sender === 'assistant') {
            // Use Talbot favicon for assistant messages
            avatar.innerHTML = '<img src="/favicon-32x32.png" alt="Talbot" class="talbot-avatar">';
        } else {
            // Fallback avatars
            avatar.innerHTML = message.sender === 'user' ? '👤' : '🤖';
        }
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = message.content;
        
        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = this.formatTime(new Date(message.timestamp));
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        messageContent.appendChild(messageTime);
        
        this.messagesContainer.appendChild(messageDiv);
    }

    clearChatHistory() {
        if (confirm('Are you sure you want to clear your chat history? This cannot be undone.')) {
            this.messages = [];
            localStorage.removeItem('talbot-chat-history');
            
            if (this.messagesContainer) {
                this.messagesContainer.innerHTML = `
                    <div class="welcome-message">
                        <h2>Hi, I'm Talbot</h2>
                        <p>I'm here to provide a safe space to talk through things between your therapy sessions. I find it helpful to ask questions to get to the root of why you might be feeling a certain way - just like your therapist does.</p>
                    </div>
                `;
            }
            
            this.showSuccess('Chat history cleared successfully.');
        }
    }

    // Focus management
    focusMessageInput() {
        if (this.messageInput) {
            this.messageInput.focus();
        }
    }

    blurMessageInput() {
        if (this.messageInput) {
            this.messageInput.blur();
        }
    }

    // Button state management
    disableSendButton() {
        if (this.sendButton) {
            this.sendButton.disabled = true;
        }
    }

    enableSendButton() {
        if (this.sendButton) {
            this.sendButton.disabled = false;
        }
    }

    // Export chat functionality
    exportChat() {
        const chatData = {
            exportDate: new Date().toISOString(),
            messages: this.messages,
            messageCount: this.messages.length
        };
        
        const blob = new Blob([JSON.stringify(chatData, null, 2)], { 
            type: 'application/json' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `talbot-chat-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showSuccess('Chat history exported successfully!');
    }

    // Event callback setters
    setOnSendMessage(callback) {
        this.onSendMessage = callback;
    }

    // Getters
    getMessages() {
        return this.messages;
    }

    getMessageCount() {
        return this.messages.length;
    }

    hasMessages() {
        return this.messages.length > 0;
    }

    // Debug method
    debugMessages() {
        console.log('Current messages:', this.messages);
        console.log('Messages container:', this.messagesContainer);
        console.log('Visible message elements:', this.messagesContainer?.children.length || 0);
    }

    // Responsive design helpers
    isMobile() {
        return window.innerWidth <= 768;
    }

    adjustForMobile() {
        if (this.isMobile()) {
            if (this.messageInput) {
                this.messageInput.style.fontSize = '16px';
            }
        }
    }

    // Accessibility helpers
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.style.position = 'absolute';
        announcement.style.left = '-10000px';
        announcement.style.width = '1px';
        announcement.style.height = '1px';
        announcement.style.overflow = 'hidden';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }
}
