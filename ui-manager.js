// PERMANENT FIX: Replace bindEvents method in ui-manager.js with this

bindEvents() {
    // Duplicate prevention
    let isProcessingSend = false;
    let lastSendTime = 0;
    
    const safeSendMessage = (source) => {
        const now = Date.now();
        
        // Prevent rapid-fire or concurrent sends
        if (now - lastSendTime < 300 || isProcessingSend) {
            console.log(`🛑 Duplicate send prevented from ${source}`);
            return;
        }
        
        isProcessingSend = true;
        lastSendTime = now;
        
        try {
            this.handleSendMessage();
        } finally {
            setTimeout(() => { isProcessingSend = false; }, 200);
        }
    };

    // Send button
    if (this.sendButton) {
        this.sendButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            safeSendMessage('click');
        });
    }

    // Enter key to send
    if (this.messageInput) {
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                safeSendMessage('enter');
            }
        });

        // Auto-resize textarea AND notify speech manager
        this.messageInput.addEventListener('input', () => {
            this.autoResizeTextarea();
            
            // Notify speech manager that user is typing
            if (this.speechManager && typeof this.speechManager.handleUserTyping === 'function') {
                this.speechManager.handleUserTyping();
            }
        });
    }
}
