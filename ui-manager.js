// UI Manager - Handle Interface Updates and Message Display with Fixed Event Handling
class UIManager {
    constructor() {
        this.messages = [];
        this.isTyping = false;
        this.speechManager = null;
        
        // Duplicate prevention flags
        this.isProcessingSend = false;
        this.lastSendTime = 0;
        this.preventDuplicateTimeout = null;
        
        // Event handler bindings - store references to avoid duplication
        this._boundSendClick = null;
        this._boundKeyDown = null;
        this._boundInput = null;
        
        this.initializeElements();
        this.loadChatHistory();
        this.initializeSpeechManager();
        
        // Remove ALL existing event listeners
        this.removeAllEventListeners();
        
        // Bind events AFTER everything else is initialized
        this.bindEvents();
        
        console.log('UIManager initialized with strict send-only processing');
    }

    initializeElements() {
        this.messagesContainer = document.getElementById('messages');
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-button');
        this.typingIndicator = document.getElementById('typing-indicator');
    }

    initializeSpeechManager() {
        // Initialize speech manager for voice functionality
        try {
            this.speechManager = new SpeechManager();
            
            // Set up speech manager callbacks - USING EXPLICIT FUNCTION REFERENCE
            this.speechManager.setOnSpeechResult(this.handleVoiceInputStrict.bind(this));
            
            console.log('SpeechManager initialized in UIManager with strict callbacks');
        } catch (error) {
            console.warn('SpeechManager not available:', error);
        }
    }

    // Radical approach: remove ALL event listeners from elements
    removeAllEventListeners() {
        console.log('🧨 Removing ALL event listeners from UI elements');
        
        // Replace the send button completely to remove all listeners
        if (this.sendButton && this.sendButton.parentNode) {
            const newButton = this.sendButton.cloneNode(true);
            this.sendButton.parentNode.replaceChild(newButton, this.sendButton);
            this.sendButton = newButton;
        }
        
        // For the input field, we need to be more careful to preserve content
        if (this.messageInput) {
            // Save current value and focus state
            const currentValue = this.messageInput.value;
            const wasFocused = document.activeElement === this.messageInput;
            
            // Create a new input with the same properties
            const newInput = document.createElement('textarea');
            
            // Copy all attributes
            Array.from(this.messageInput.attributes).forEach(attr => {
                newInput.setAttribute(attr.name, attr.value);
            });
            
            // Set the same value
            newInput.value = currentValue;
            
            // Replace the old input
            if (this.messageInput.parentNode) {
                this.messageInput.parentNode.replaceChild(newInput, this.messageInput);
                this.messageInput = newInput;
                
                // Restore focus if it was focused
                if (wasFocused) {
                    this.messageInput.focus();
                }
            }
        }
        
        console.log('🧹 All UI elements replaced to remove event listeners');
    }

    bindEvents() {
        console.log('📝 Binding STRICT UI events...');
        
        // Send button - EXPLICITLY FOR SEND ONLY
        if (this.sendButton) {
            this._boundSendClick = this.handleSendButtonStrict.bind(this);
            this.sendButton.addEventListener('click', this._boundSendClick);
            console.log('🔒 Send button click listener bound - STRICT MODE');
        }

        // Enter key to send - EXPLICITLY FOR SEND ONLY
        if (this.messageInput) {
            this._boundKeyDown = this.handleKeyDownStrict.bind(this);
            this.messageInput.addEventListener('keydown', this._boundKeyDown);
            console.log('🔒 Message input keydown listener bound - STRICT MODE');
            
            // Input event only for auto-resize and notifying speech manager
            this._boundInput = this.handleInputChangeStrict.bind(this);
            this.messageInput.addEventListener('input', this._boundInput);
            console.log('📏 Message input resize listener bound');
        }
        
        console.log('✅ UI events bound with strict send-only processing');
    }
    
    // STRICT EVENT HANDLERS - ensuring they ONLY process sends
    
    handleSendButtonStrict(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation(); // Prevent any other handlers
        
        console.log('👆 Send button clicked - STRICT HANDLER');
        this.processSendMessageStrict('button_click');
    }
    
    handleKeyDownStrict(e) {
        // ONLY process Enter key (without shift)
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation(); // Prevent any other handlers
            
            console.log('⌨️ Enter key pressed - STRICT HANDLER');
            this.processSendMessageStrict('enter_key');
        }
        // Ignore all other key events
    }
    
    handleInputChangeStrict() {
        // ONLY handle UI updates, never process messages
        this.autoResizeTextarea();
        
        // Notify speech manager about typing (if speaking)
        if (this.speechManager && typeof this.speechManager.handleUserTyping === 'function') {
            this.speechManager.handleUserTyping();
        }
    }
    
    handleVoiceInputStrict(text) {
        if (!text) return;
        
        console.log('🎤 Voice input received - STRICT HANDLER');
        this.processSendMessageStrict('voice_input', text);
    }

    // Strict send processing that ignores typing and only processes explicit sends
    processSendMessageStrict(source, voiceText = null) {
        const now = Date.now();
        
        // Explicit debug statement for send attempt
        console.log(`🔐 STRICT SEND from source: ${source}, processing: ${this.isProcessingSend}, time since last: ${now - this.lastSendTime}ms`);
        
        // Prevent duplicate sends
        if (this.isProcessingSend) {
            console.log(`🛑 BLOCKED: Already processing a send operation (${source})`);
            return;
        }
        
        if (now - this.lastSendTime < 800) {
            console.log(`🛑 BLOCKED: Send operation too soon after previous (${source})`);
            return;
        }
        
        // Get message content - either from voice or input field
        const message = voiceText || (this.messageInput?.value?.trim() || '');
        if (!message) {
            console.log('⚠️ No message to send (empty input)');
            return;
        }
        
        // Set flags immediately to prevent race conditions
        this.isProcessingSend = true;
        this.lastSendTime = now;
        
        // Clear any existing timeout
        if (this.preventDuplicateTimeout) {
            clearTimeout(this.preventDuplicateTimeout);
        }
        
        // Execute the send operation
        this.executeStrictSend(message, source);
        
        // Set a timeout to release the lock (failsafe)
        this.preventDuplicateTimeout = setTimeout(() => {
            if (this.isProcessingSend) {
                console.log('🔓 Releasing processing lock (timeout)');
                this.isProcessingSend = false;
            }
        }, 3000); // 3 seconds max lock
    }
    
    executeStrictSend(message, source) {
        console.log(`📤 STRICT SEND processing: "${message.substring(0, 30)}${message.length > 30 ? '...' : ''}" from ${source}`);
        
        try {
            // Only clear input if it's from the input field (not voice)
            if (source !== 'voice_input' && this.messageInput) {
                this.messageInput.value = '';
                this.autoResizeTextarea();
                this.messageInput.focus();
            }
            
            // Add user message to UI
            this.addMessage(message, 'user');
            
            // Trigger AI response
            this.getAIResponse(message);
            
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            // Always release the processing lock after a short delay
            setTimeout(() => {
                console.log('🔓 Releasing processing lock (completed)');
                this.isProcessingSend = false;
            }, 500); // Short delay to prevent immediate re-sends
        }
    }

    // The rest of the methods remain largely the same...
