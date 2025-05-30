// Main App - Initialize Talbot Application
class TalbotApp {
    constructor() {
        this.uiManager = null;
        this.profileManager = null;
        this.conversationManager = null;
        this.aiHandler = null;
        
        this.init();
    }

    async init() {
        try {
            console.log('Initializing Talbot App...');
            
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }

            // Initialize managers in correct order
            this.initializeManagers();
            
            // Set up global references
            this.setupGlobalReferences();
            
            // Initialize app state
            this.initializeAppState();
            
            console.log('Talbot App initialized successfully');
            
        } catch (error) {
            console.error('Error initializing Talbot App:', error);
            this.showInitializationError();
        }
    }

    initializeManagers() {
        // Initialize UI Manager first
        this.uiManager = new UIManager();
        
        // Initialize Profile Manager
        this.profileManager = new ProfileManager();
        
        // Initialize Conversation Manager
        this.conversationManager = new ConversationManager(this.uiManager, this.profileManager);
        
        // Initialize AI Handler last (depends on other managers)
        this.aiHandler = new AIHandler(this.uiManager, this.profileManager, this.conversationManager);
    }

    setupGlobalReferences() {
        // Make managers available globally for cross-component communication
        window.talbotApp = this;
        window.uiManager = this.uiManager;
        window.profileManager = this.profileManager;
        window.conversationManager = this.conversationManager;
        window.aiHandler = this.aiHandler;
    }

    initializeAppState() {
        // Check if user has a profile
        if (!this.profileManager.hasProfile()) {
            this.showProfilePrompt();
        }

        // Show conversation memory notice if applicable
        if (this.conversationManager.hasConversationMemory()) {
            this.showConversationMemoryNotice();
        }

        // Set up error handling
        this.setupErrorHandling();
        
        // Set up periodic health checks
        this.setupHealthChecks();
    }

    showProfilePrompt() {
        // Show a gentle prompt to set up profile
        setTimeout(() => {
            const shouldSetupProfile = confirm(
                "Welcome to Talbot!\n\n" +
                "Would you like to set up your profile? This helps me provide more personalized support.\n\n" +
                "You can always do this later by clicking the profile button."
            );
            
            if (shouldSetupProfile) {
                this.profileManager.openProfileModal();
            }
        }, 2000); // Show after 2 seconds
    }

    showConversationMemoryNotice() {
        const memory = this.conversationManager.getConversationMemory();
        if (memory && memory.topics && memory.topics.length > 0) {
            const noticeDiv = document.createElement('div');
            noticeDiv.className = 'memory-notice';
            noticeDiv.innerHTML = `
                <div class="memory-content">
                    <strong>Continuing our conversation</strong>
                    <p>I remember we were discussing: ${memory.topics.slice(0, 3).join(', ')}</p>
                    <button onclick="this.parentElement.parentElement.remove()">Got it</button>
                </div>
            `;
            noticeDiv.style.cssText = `
                position: fixed; top: 80px; left: 50%; transform: translateX(-50%);
                z-index: 1001; background: #f8f9fa; border: 1px solid #dee2e6;
                padding: 16px; border-radius: 8px; font-size: 14px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1); font-family: 'Lora', serif;
                max-width: 400px; text-align: center;
            `;
            
            document.body.appendChild(noticeDiv);
            
            // Auto-remove after 8 seconds
            setTimeout(() => {
                if (noticeDiv.parentElement) {
                    noticeDiv.remove();
                }
            }, 8000);
        }
    }

    setupErrorHandling() {
        // Global error handler
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.handleGlobalError(event.error);
        });

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.handleGlobalError(event.reason);
        });
    }

    handleGlobalError(error) {
        // Log error details for debugging
        const errorInfo = {
            message: error.message || 'Unknown error',
            stack: error.stack || 'No stack trace',
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        console.error('Talbot Error [Global Error]:', errorInfo);

        // Show user-friendly error message
        this.showErrorNotification(
            "I'm experiencing a technical issue. Please refresh the page if problems persist."
        );
    }

    setupHealthChecks() {
        // Periodic health check
        setInterval(() => {
            this.performHealthCheck();
        }, 60000); // Every minute

        // Initial health check
        setTimeout(() => {
            this.performHealthCheck();
        }, 5000); // After 5 seconds
    }

    performHealthCheck() {
        const healthStatus = {
            timestamp: new Date().toISOString(),
            managers: {
                uiManager: !!this.uiManager,
                profileManager: !!this.profileManager,
                conversationManager: !!this.conversationManager,
                aiHandler: !!this.aiHandler
            },
            localStorage: this.checkLocalStorageAccess(),
            domElements: this.checkCriticalElements()
        };

        // Log health status (for debugging)
        console.log('Health check:', healthStatus);

        // Take corrective action if needed
        if (!healthStatus.managers.uiManager || !healthStatus.managers.aiHandler) {
            console.warn('Critical managers missing, attempting re-initialization...');
            this.attemptRecovery();
        }
    }

    checkLocalStorageAccess() {
        try {
            localStorage.setItem('talbot-health-check', 'test');
            localStorage.removeItem('talbot-health-check');
            return true;
        } catch (error) {
            return false;
        }
    }

    checkCriticalElements() {
        const criticalElements = [
            'messages-container',
            'message-input',
            'send-button'
        ];

        return criticalElements.reduce((acc, id) => {
            acc[id] = !!document.getElementById(id);
            return acc;
        }, {});
    }

    attemptRecovery() {
        try {
            // Re-initialize missing managers
            if (!this.uiManager) {
                this.uiManager = new UIManager();
                window.uiManager = this.uiManager;
            }
            
            if (!this.aiHandler) {
                this.aiHandler = new AIHandler(this.uiManager, this.profileManager, this.conversationManager);
                window.aiHandler = this.aiHandler;
            }
            
            console.log('Recovery attempt completed');
        } catch (error) {
            console.error('Recovery failed:', error);
        }
    }

    showErrorNotification(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
            z-index: 1003; background: #e74c3c; color: white;
            padding: 12px 24px; border-radius: 8px; font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2); font-family: 'Lora', serif;
            max-width: 400px; text-align: center;
            opacity: 0; transition: all 0.3s ease;
        `;
        
        document.body.appendChild(errorDiv);
        
        // Show with animation
        setTimeout(() => {
            errorDiv.style.opacity = '1';
        }, 100);
        
        // Hide after delay
        setTimeout(() => {
            errorDiv.style.opacity = '0';
            setTimeout(() => {
                if (errorDiv.parentElement) {
                    errorDiv.remove();
                }
            }, 300);
        }, 5000);
    }

    showInitializationError() {
        document.body.innerHTML = `
            <div style="
                display: flex; justify-content: center; align-items: center; 
                height: 100vh; font-family: 'Lora', serif; text-align: center;
                background: #f8f9fa; color: #333;
            ">
                <div>
                    <h1 style="color: #e74c3c; margin-bottom: 16px;">Oops!</h1>
                    <p style="margin-bottom: 16px;">Something went wrong while starting Talbot.</p>
                    <button onclick="window.location.reload()" style="
                        background: #3498db; color: white; border: none; 
                        padding: 12px 24px; border-radius: 6px; cursor: pointer;
                        font-family: 'Lora', serif; font-size: 14px;
                    ">
                        Refresh Page
                    </button>
                </div>
            </div>
        `;
    }

    // Public API methods
    getAppStatus() {
        return {
            initialized: !!(this.uiManager && this.profileManager && this.conversationManager && this.aiHandler),
            managers: {
                uiManager: !!this.uiManager,
                profileManager: !!this.profileManager,
                conversationManager: !!this.conversationManager,
                aiHandler: !!this.aiHandler
            },
            hasProfile: this.profileManager?.hasProfile() || false,
            hasMessages: this.uiManager?.hasMessages() || false,
            hasConversationMemory: this.conversationManager?.hasConversationMemory() || false
        };
    }

    exportAppData() {
        const appData = {
            exportDate: new Date().toISOString(),
            profile: this.profileManager?.profile || null,
            messages: this.uiManager?.getMessages() || [],
            conversationMemory: this.conversationManager?.getConversationMemory() || null,
            stats: {
                messageStats: this.uiManager?.getMessageStats() || null,
                conversationStats: this.aiHandler?.getConversationStats() || null
            }
        };

        const dataStr = JSON.stringify(appData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `talbot-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    reset() {
        if (confirm('Are you sure you want to reset everything? This will clear all data and cannot be undone.')) {
            localStorage.clear();
            window.location.reload();
        }
    }
}

// Initialize app when script loads
document.addEventListener('DOMContentLoaded', () => {
    window.talbotApp = new TalbotApp();
});

// Fallback initialization if DOMContentLoaded already fired
if (document.readyState !== 'loading') {
    window.talbotApp = new TalbotApp();
}
