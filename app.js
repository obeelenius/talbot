// Main App - Initialize Talbot Application
class TalbotApp {
    constructor() {
        this.uiManager = null;
        this.profileManager = null;
        this.conversationManager = null;
        this.aiResponseManager = null;
        this.speechManager = null;
        
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
        // Initialize Profile Manager first
        this.profileManager = new ProfileManager();
        
        // Initialize UI Manager (which will create its own SpeechManager)
        this.uiManager = new UIManager();
        
        // Get speech manager reference from UI Manager
        this.speechManager = this.uiManager.getSpeechManager();
        
        // Initialize Conversation Manager
        this.conversationManager = new ConversationManager(this.uiManager, this.profileManager);
        
        // Initialize AI Response Manager
        this.aiResponseManager = new AIResponseManager(this.profileManager, this.uiManager);
    }

    setupGlobalReferences() {
        // Make managers available globally for cross-component communication
        window.talbotApp = this;
        window.uiManager = this.uiManager;
        window.profileManager = this.profileManager;
        window.conversationManager = this.conversationManager;
        window.aiResponseManager = this.aiResponseManager;
        window.speechManager = this.speechManager;
        
        // For backward compatibility, also set aiHandler to point to aiResponseManager
        window.aiHandler = this.aiResponseManager;
    }

    initializeAppState() {
        // NO MORE ANNOYING POPUP - just quietly initialize
        
        // Show conversation memory notice if applicable
        if (this.conversationManager && this.conversationManager.hasConversationMemory()) {
            this.showConversationMemoryNotice();
        }

        // Set up error handling
        this.setupErrorHandling();
        
        // Set up periodic health checks
        this.setupHealthChecks();
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
        // Global error handler with better filtering
        window.addEventListener('error', (event) => {
            // Filter out extension and unimportant errors
            if (event.filename && (
                event.filename.includes('chrome-extension://') ||
                event.filename.includes('moz-extension://') ||
                event.filename.includes('extension')
            )) {
                return; // Ignore extension errors
            }
            
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
        // Only show error notification for critical errors
        if (error && error.message && !error.message.includes('extension')) {
            // Log error details for debugging
            const errorInfo = {
                message: error.message || 'Unknown error',
                stack: error.stack || 'No stack trace',
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href
            };

            console.error('Talbot Error [Global Error]:', errorInfo);

            // Only show user-friendly error message for serious issues
            if (error.message.includes('TypeError') || error.message.includes('ReferenceError')) {
                this.showErrorNotification(
                    "I'm experiencing a technical issue. Please refresh the page if problems persist."
                );
            }
        }
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
                aiResponseManager: !!this.aiResponseManager,
                speechManager: !!this.speechManager
            },
            localStorage: this.checkLocalStorageAccess(),
            domElements: this.checkCriticalElements()
        };

        // Log health status (for debugging)
        console.log('Health check:', healthStatus);

        // Take corrective action if needed
        if (!healthStatus.managers.uiManager || !healthStatus.managers.aiResponseManager) {
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
            'messages',
            'message-input',
            'send-button',
            'voice-button',
            'voice-settings-button'
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
                this.speechManager = this.uiManager.getSpeechManager();
                window.speechManager = this.speechManager;
            }
            
            if (!this.aiResponseManager) {
                this.aiResponseManager = new AIResponseManager(this.profileManager, this.uiManager);
                window.aiResponseManager = this.aiResponseManager;
                window.aiHandler = this.aiResponseManager;
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
            initialized: !!(this.uiManager && this.profileManager && this.conversationManager && this.aiResponseManager),
            managers: {
                uiManager: !!this.uiManager,
                profileManager: !!this.profileManager,
                conversationManager: !!this.conversationManager,
                aiResponseManager: !!this.aiResponseManager,
                speechManager: !!this.speechManager
            },
            hasProfile: this.profileManager?.hasProfile() || false,
            hasMessages: this.uiManager?.hasMessages() || false,
            hasConversationMemory: this.conversationManager?.hasConversationMemory() || false,
            voiceAvailable: !!this.speechManager
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
                conversationStats: this.aiResponseManager?.getConversationStats() || null,
                voiceStats: this.speechManager?.getUsageStats() || null
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

// FIXED: Single initialization point to prevent duplicate instances
(function initializeTalbot() {
    // Prevent multiple initializations
    if (window.talbotApp) {
        console.warn('🚨 TalbotApp already exists, skipping initialization');
        return;
    }
    
    function createApp() {
        console.log('🚀 Creating TalbotApp instance');
        window.talbotApp = new TalbotApp();
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createApp, { once: true });
    } else {
        // DOM already loaded
        createApp();
    }
})();
