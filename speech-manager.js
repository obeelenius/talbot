// Hold-to-Speak Speech Manager with Auto-Send
class SpeechManager {
    constructor() {
        this.isListening = false;
        this.isSpeaking = false;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.currentUtterance = null;
        this.bestVoice = null;
        this.currentAudio = null;
        
        // Hold-to-speak properties
        this.isHolding = false;
        this.interimTranscript = '';
        this.finalTranscript = '';
        this.recordingStartTime = null;
        
        // Voice settings - 0: Mute, 1: Female, 2: Male
        this.voiceMode = TalbotConfig.DEVELOPMENT_MODE ? TalbotConfig.DEV_VOICE_MODE : 0;
        this.elevenLabsAvailable = false;
        this.elevenLabsApiKey = null;
        
        // Voice IDs - will be loaded from environment variables
        this.femaleVoiceId = 'M7ya1YbaeFaPXljg9BpK'; // Default Hannah - Female voice
        this.maleVoiceId = 'ZthjuvLPty3kTMaNKVKb'; // Default Peter - Male voice
        
        this.voiceSettingsExpanded = false; // Track expansion state
        
        // Usage tracking
        this.elevenLabsCallCount = parseInt(localStorage.getItem(TalbotConfig.SETTINGS.STORAGE_KEYS.ELEVENLABS_CALLS) || '0');
        
        this.initializeElements();
        this.initializeSpeech();
        this.bindEvents();
        this.loadVoiceIds(); // Load voice IDs from environment
        this.checkElevenLabsAPI();
        this.loadVoicePreference();
        this.showDevModeStatus();
    }

    // New method to load voice IDs from Netlify environment
    async loadVoiceIds() {
        try {
            console.log('Loading voice IDs from environment...');
            
            const response = await fetch('/.netlify/functions/elevenlabs-voices');
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.femaleVoiceId) {
                    this.femaleVoiceId = data.femaleVoiceId;
                    console.log('Female voice ID loaded:', this.femaleVoiceId);
                }
                
                if (data.maleVoiceId) {
                    this.maleVoiceId = data.maleVoiceId;
                    console.log('Male voice ID loaded:', this.maleVoiceId);
                }
                
                if (data.available) {
                    console.log('✅ Custom voice IDs loaded from environment');
                } else {
                    console.log('⚠️ Using default voice IDs - custom IDs not set in environment');
                }
            } else {
                console.warn('Could not load voice IDs from environment, using defaults');
            }
        } catch (error) {
            console.error('Error loading voice IDs:', error);
            console.log('Using default voice IDs as fallback');
        }
    }

    initializeElements() {
        this.voiceButton = document.getElementById('voice-button');
        this.statusText = document.getElementById('status-text');
        this.statusIndicator = document.getElementById('status-indicator');
        this.messageInput = document.getElementById('message-input');
        this.voiceSettingsButton = document.getElementById('voice-settings-button');
        this.voiceSliderContainer = document.getElementById('voice-slider-container');
        this.voiceRange = document.getElementById('voice-range');
    }

    showDevModeStatus() {
        if (TalbotConfig.DEVELOPMENT_MODE) {
            console.log('🔧 DEVELOPMENT MODE ACTIVE');
            console.log(`📊 ElevenLabs calls made: ${this.elevenLabsCallCount}`);
            console.log(`🔇 ElevenLabs disabled: ${TalbotConfig.DISABLE_ELEVENLABS_IN_DEV}`);
            console.log(`🎤 Default voice mode: ${TalbotConfig.DEV_VOICE_MODE} (0=mute, 1=female, 2=male)`);
            console.log(`👩 Female voice ID: ${this.femaleVoiceId}`);
            console.log(`👨 Male voice ID: ${this.maleVoiceId}`);
            console.log('💡 Use TalbotConfig.DEV_HELPERS.toggleDevMode() to toggle');
        }
    }

    updateDevMode() {
        // Called when dev mode is toggled
        this.showDevModeStatus();
        this.updateButtonVisibility();
    }

    async checkElevenLabsAPI() {
        // Skip API check in development mode if disabled
        if (TalbotConfig.DEVELOPMENT_MODE && TalbotConfig.DISABLE_ELEVENLABS_IN_DEV) {
            console.log('🔧 Dev mode: Skipping ElevenLabs API check');
            this.elevenLabsAvailable = false;
            this.updateButtonVisibility();
            return;
        }

        try {
            console.log('Checking ElevenLabs API availability...');
            
            const response = await fetch('/.netlify/functions/elevenlabs-key');
            
            console.log('ElevenLabs key check response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                this.elevenLabsAvailable = data.available;
                this.elevenLabsApiKey = data.apiKey;
                
                console.log('ElevenLabs API check result:', {
                    available: this.elevenLabsAvailable,
                    hasApiKey: !!data.apiKey,
                    devMode: TalbotConfig.DEVELOPMENT_MODE
                });
                
                // Update button visibility
                this.updateButtonVisibility();
            } else {
                console.error('ElevenLabs key check failed with status:', response.status);
                this.elevenLabsAvailable = false;
                this.updateButtonVisibility();
            }
        } catch (error) {
            console.error('ElevenLabs API check failed with error:', error);
            this.elevenLabsAvailable = false;
            this.updateButtonVisibility();
        }
    }

    updateButtonVisibility() {
        if (!this.voiceSettingsButton) return;
        
        // Show voice settings if ElevenLabs is available OR if we're in dev mode (for testing UI)
        const shouldShow = this.elevenLabsAvailable || TalbotConfig.DEVELOPMENT_MODE;
        
        if (shouldShow) {
            this.voiceSettingsButton.style.display = 'block';
        } else {
            this.voiceSettingsButton.style.display = 'none';
            this.voiceMode = 0; // Force mute if not available
        }
    }

    // Enhanced speak method with development mode support
    async speakMessage(text) {
        if (!text || this.voiceMode === 0) {
            console.log('Speech skipped - voice is muted or no text');
            return;
        }
        
        this.stopSpeaking();
        const naturalText = this.makeTextMoreNatural(text);
        
        // Development mode logic - save credits!
        if (TalbotConfig.DEVELOPMENT_MODE && TalbotConfig.DISABLE_ELEVENLABS_IN_DEV) {
            console.log('🔧 Dev mode: Using browser voice to save ElevenLabs credits');
            this.speakWithBrowser(naturalText);
            return;
        }
        
        // Text length check - save credits on long messages
        if (naturalText.length > TalbotConfig.MAX_TEXT_LENGTH_FOR_ELEVENLABS) {
            console.log(`💰 Text too long (${naturalText.length} chars), using browser voice to save credits`);
            this.speakWithBrowser(naturalText);
            return;
        }
        
        // Use ElevenLabs if available and not in dev mode
        if (this.elevenLabsAvailable && !TalbotConfig.DEVELOPMENT_MODE) {
            console.log(`Using ElevenLabs ${this.voiceMode === 1 ? 'female' : 'male'} voice`);
            console.log(`Voice ID: ${this.voiceMode === 1 ? this.femaleVoiceId : this.maleVoiceId}`);
            await this.speakWithElevenLabs(naturalText);
        } else {
            console.log('Using browser voice');
            this.speakWithBrowser(naturalText);
        }
    }

    async speakWithElevenLabs(text) {
        try {
            // Track usage
            this.elevenLabsCallCount++;
            localStorage.setItem(TalbotConfig.SETTINGS.STORAGE_KEYS.ELEVENLABS_CALLS, this.elevenLabsCallCount.toString());
            console.log(`💸 ElevenLabs API call #${this.elevenLabsCallCount}`);
            
            this.isSpeaking = true;
            this.updateVoiceButton();
            
            const voiceType = this.voiceMode === 1 ? 'female' : 'male';
            this.updateStatus(`Talbot is speaking... (${voiceType}) 💰`, '🗣️');

            // Select voice ID based on mode (now using loaded environment variables)
            const selectedVoiceId = this.voiceMode === 1 ? this.femaleVoiceId : this.maleVoiceId;
            console.log(`Using voice ID: ${selectedVoiceId} for ${voiceType} voice`);

            const response = await fetch('/.netlify/functions/elevenlabs-tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    voice_id: selectedVoiceId,
                    voice_settings: {
                        stability: 0.75,
                        similarity_boost: 0.85,
                        style: 0.6,
                        use_speaker_boost: true
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`ElevenLabs API error: ${response.status}`);
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            
            this.currentAudio = new Audio(audioUrl);
            
            this.currentAudio.onended = () => {
                this.isSpeaking = false;
                this.updateVoiceButton();
                this.updateStatus('Ready to listen', '💙');
                URL.revokeObjectURL(audioUrl);
            };
            
            this.currentAudio.onerror = (error) => {
                console.error('Audio playback error:', error);
                this.isSpeaking = false;
                this.updateVoiceButton();
                this.updateStatus('Ready to listen', '💙');
                URL.revokeObjectURL(audioUrl);
            };
            
            await this.currentAudio.play();
            
        } catch (error) {
            console.error('ElevenLabs TTS error:', error);
            
            // Show error and fallback
            this.showVoiceStatus('Premium voice failed, using backup', false);
            this.speakWithBrowser(text);
        }
    }

    speakWithBrowser(text) {
        if (!this.synthesis) return;
        
        console.log('🆓 Using free browser voice');
        
        this.currentUtterance = new SpeechSynthesisUtterance(text);
        
        this.currentUtterance.rate = 0.85;
        this.currentUtterance.pitch = 1.1;
        this.currentUtterance.volume = 0.9;
        
        if (this.bestVoice) {
            this.currentUtterance.voice = this.bestVoice;
        }
        
        this.currentUtterance.onstart = () => {
            this.isSpeaking = true;
            this.updateVoiceButton();
            const devIndicator = TalbotConfig.DEVELOPMENT_MODE ? ' 🔧' : '';
            this.updateStatus(`Talbot is speaking...${devIndicator}`, '🗣️');
        };
        
        this.currentUtterance.onend = () => {
            this.isSpeaking = false;
            this.updateVoiceButton();
            this.updateStatus('Ready to listen', '💙');
        };
        
        this.currentUtterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            this.isSpeaking = false;
            this.updateVoiceButton();
            this.updateStatus('Ready to listen', '💙');
        };
        
        setTimeout(() => {
            this.synthesis.speak(this.currentUtterance);
        }, 100);
    }

    toggleVoiceSettings() {
        if (!this.elevenLabsAvailable && !TalbotConfig.DEVELOPMENT_MODE) return;
        
        this.voiceSettingsExpanded = !this.voiceSettingsExpanded;
        
        if (this.voiceSettingsExpanded) {
            this.expandVoiceSettings();
        } else {
            this.collapseVoiceSettings();
        }
    }

    expandVoiceSettings() {
        if (!this.voiceSliderContainer || !this.voiceSettingsButton) return;
        
        this.voiceSettingsButton.classList.add('expanded');
        this.voiceSliderContainer.style.display = 'flex';
        this.voiceSliderContainer.classList.add('expanded');
        
        console.log('Voice settings expanded');
    }

    collapseVoiceSettings() {
        if (!this.voiceSliderContainer || !this.voiceSettingsButton) return;
        
        this.voiceSettingsButton.classList.remove('expanded');
        this.voiceSliderContainer.classList.remove('expanded');
        
        // Hide after animation
        setTimeout(() => {
            if (!this.voiceSettingsExpanded) {
                this.voiceSliderContainer.style.display = 'none';
            }
        }, 300);
        
        console.log('Voice settings collapsed');
    }

    loadVoicePreference() {
        try {
            const saved = localStorage.getItem('talbot-voice-mode');
            if (saved !== null) {
                this.voiceMode = parseInt(saved, 10);
            } else if (TalbotConfig.DEVELOPMENT_MODE) {
                // Use dev default if no saved preference
                this.voiceMode = TalbotConfig.DEV_VOICE_MODE;
            }
            
            if (this.voiceRange) {
                this.voiceRange.value = this.voiceMode;
            }
        } catch (error) {
            console.error('Error loading voice preference:', error);
        }
    }

    saveVoicePreference() {
        try {
            localStorage.setItem('talbot-voice-mode', this.voiceMode.toString());
        } catch (error) {
            console.error('Error saving voice preference:', error);
        }
    }

    // Hold-to-Speak Speech Recognition Setup
    initializeSpeech() {
        this.initializeSpeechRecognition();
        this.initializeSpeechSynthesis();
    }

    initializeSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            // Hold-to-speak settings
            this.recognition.continuous = true;        // Keep listening while held
            this.recognition.interimResults = true;    // Show live transcription
            this.recognition.lang = 'en-AU';
            this.recognition.maxAlternatives = 1;
            
            this.recognition.onstart = () => {
                this.isListening = true;
                this.recordingStartTime = Date.now();
                this.interimTranscript = '';
                this.finalTranscript = '';
                this.updateVoiceButton();
                this.updateStatus('Listening... (hold button)', '👂');
                this.updateMessageInputPlaceholder('Listening...');
                console.log('🎤 Hold-to-speak started');
            };
            
            this.recognition.onresult = (event) => {
                this.interimTranscript = '';
                this.finalTranscript = '';
                
                // Process all results
                for (let i = 0; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        this.finalTranscript += transcript + ' ';
                    } else {
                        this.interimTranscript += transcript;
                    }
                }
                
                // Show live transcription in input field
                const fullTranscript = this.finalTranscript + this.interimTranscript;
                this.messageInput.value = fullTranscript.trim();
                
                // Auto-resize the input as text grows
                this.messageInput.style.height = 'auto';
                this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
                
                console.log('🎤 Live transcription:', fullTranscript);
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                
                if (event.error === 'not-allowed') {
                    this.showError('Microphone access denied. Please allow microphone permissions and try again.');
                } else if (event.error === 'no-speech') {
                    // Don't show error for no speech in hold-to-speak mode
                    console.log('No speech detected while holding');
                } else {
                    this.showError('Voice recognition error. Please try again.');
                }
            };
            
            this.recognition.onend = () => {
                console.log('🎤 Speech recognition ended');
                this.finalizeHoldToSpeak();
            };
            
        } else {
            console.log('Speech recognition not supported');
            if (this.voiceButton) {
                this.voiceButton.style.display = 'none';
            }
        }
    }

    initializeSpeechSynthesis() {
        if (this.synthesis) {
            this.loadVoices();
            if (speechSynthesis.onvoiceschanged !== undefined) {
                speechSynthesis.onvoiceschanged = () => this.loadVoices();
            }
        }
    }

    loadVoices() {
        const voices = this.synthesis.getVoices();
        this.bestVoice = this.selectBestVoice(voices);
        if (this.bestVoice) {
            console.log(`Selected fallback voice: ${this.bestVoice.name}`);
        }
    }

    selectBestVoice(voices) {
        if (!voices || voices.length === 0) return null;
        
        let bestVoice = null;
        let highestScore = 0;
        
        voices.forEach(voice => {
            if (!voice.lang.startsWith('en')) return;
            
            let score = 0;
            
            if (voice.lang.includes('AU')) score += 20;
            if (voice.lang.includes('GB')) score += 15;
            if (/karen|samantha|allison|ava/i.test(voice.name)) score += 15;
            if (/female/i.test(voice.name)) score += 10;
            if (voice.localService) score += 10;
            if (voice.default) score += 5;
            
            if (score > highestScore) {
                highestScore = score;
                bestVoice = voice;
            }
        });
        
        return bestVoice;
    }

    // FIXED: Remove conflicting input listener - let UI Manager handle all input events
    bindEvents() {
        // Voice settings button (collapsible)
        if (this.voiceSettingsButton) {
            this.voiceSettingsButton.addEventListener('click', () => this.toggleVoiceSettings());
        }

        // Voice slider events
        if (this.voiceRange) {
            this.voiceRange.addEventListener('input', (e) => {
                this.voiceMode = parseInt(e.target.value, 10);
                this.saveVoicePreference();
                
                // Show feedback message
                const messages = {
                    0: 'Voice muted',
                    1: 'Female voice selected',
                    2: 'Male voice selected'
                };
                
                const devNote = TalbotConfig.DEVELOPMENT_MODE ? ' (dev mode - saving credits!)' : '';
                this.showVoiceStatus(messages[this.voiceMode] + devNote, this.voiceMode > 0);
            });
        }

        // Hold-to-Speak Voice button events
        if (this.voiceButton) {
            // Mouse events for desktop
            this.voiceButton.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.startHoldToSpeak();
            });
            
            this.voiceButton.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.stopHoldToSpeak();
            });
            
            this.voiceButton.addEventListener('mouseleave', (e) => {
                // Stop if they drag mouse away while holding
                this.stopHoldToSpeak();
            });
            
            // Touch events for mobile
            this.voiceButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.startHoldToSpeak();
            });
            
            this.voiceButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.stopHoldToSpeak();
            });
            
            this.voiceButton.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                this.stopHoldToSpeak();
            });
        }
        
        // REMOVED: The conflicting input listener that was causing duplicates
        // The UI Manager will handle all input-related events
        // Speech Manager will only handle voice-specific interactions
    }

    // NEW METHOD: Allow UI Manager to notify Speech Manager when user types
    handleUserTyping() {
        // Stop speaking if Talbot is talking when user starts typing
        if (this.isSpeaking) {
            console.log('🔇 User started typing - stopping speech');
            this.stopSpeaking();
        }
    }

    // Hold-to-Speak Methods

    startHoldToSpeak() {
        if (!this.recognition || this.isListening || this.isHolding) return;
        
        this.isHolding = true;
        
        try {
            // Clear any existing content
            this.messageInput.value = '';
            this.finalTranscript = '';
            this.interimTranscript = '';
            
            console.log('🎤 Starting hold-to-speak...');
            this.recognition.start();
            
        } catch (error) {
            console.error('Failed to start voice recognition:', error);
            this.showError('Could not start voice recognition. Please try again.');
            this.isHolding = false;
        }
    }

    stopHoldToSpeak() {
        if (!this.isHolding) return;
        
        this.isHolding = false;
        
        console.log('🎤 Stopping hold-to-speak...');
        
        try {
            this.recognition.stop();
        } catch (error) {
            console.log('Recognition already stopped');
        }
    }

    finalizeHoldToSpeak() {
        this.isListening = false;
        this.isHolding = false;
        this.updateVoiceButton();
        
        const finalText = this.messageInput.value.trim();
        
        if (finalText) {
            // Show success feedback
            const duration = this.recordingStartTime ? 
                Math.round((Date.now() - this.recordingStartTime) / 1000) : 0;
            
            this.updateStatus(`Sending message... (${duration}s recorded)`, '📤');
            console.log(`🎤 Auto-sending: "${finalText}" (${duration}s)`);
            
            // Auto-send the message
            this.onSpeechResult?.(finalText);
            
            // Clear the input after sending
            setTimeout(() => {
                this.messageInput.value = '';
                this.messageInput.style.height = 'auto';
                this.updateMessageInputPlaceholder();
                this.updateStatus('Ready to listen', '💙');
            }, 500);
            
        } else {
            this.updateStatus('No speech detected', '❌');
            this.updateMessageInputPlaceholder();
            
            setTimeout(() => {
                this.updateStatus('Ready to listen', '💙');
            }, 2000);
        }
        
        // Reset transcripts
        this.finalTranscript = '';
        this.interimTranscript = '';
        this.recordingStartTime = null;
    }

    // UI Helper Methods
    updateMessageInputPlaceholder(customText = null) {
        if (!this.messageInput) return;
        
        if (customText) {
            this.messageInput.placeholder = customText;
        } else {
            // Restore responsive placeholder
            const width = window.innerWidth;
            if (width <= 360) {
                this.messageInput.placeholder = "What's on your mind?";
            } else if (width <= 480) {
                this.messageInput.placeholder = "What's on your mind? Hold mic to speak";
            } else if (width <= 768) {
                this.messageInput.placeholder = "What's on your mind? Hold mic to speak";
            } else {
                this.messageInput.placeholder = "What's on your mind? Type or hold the mic to speak...";
            }
        }
    }

    updateVoiceButton() {
        if (!this.voiceButton) return;
        
        this.voiceButton.classList.remove('listening', 'speaking');
        
        if (this.isListening) {
            this.voiceButton.classList.add('listening');
            this.voiceButton.innerHTML = '⏹️';
            this.voiceButton.title = 'Hold to record - Release to send';
        } else if (this.isSpeaking) {
            this.voiceButton.classList.add('speaking');
            this.voiceButton.innerHTML = '🔊';
            this.voiceButton.title = 'Talbot is speaking';
        } else {
            // Clear button first
            this.voiceButton.innerHTML = '';
            
            // Create and configure the image element
            const micIcon = document.createElement('img');
            micIcon.src = '/mic-icon.png';
            micIcon.alt = 'Microphone';
            micIcon.className = 'mic-icon';
            
            // Add error handling
            micIcon.onerror = () => {
                console.log('Custom mic icon failed to load, using emoji fallback');
                this.voiceButton.innerHTML = '🎤';
            };
            
            micIcon.onload = () => {
                console.log('✅ Custom mic icon loaded successfully');
            };
            
            // Add the image to the button
            this.voiceButton.appendChild(micIcon);
            this.voiceButton.title = 'Hold to record voice message';
        }
    }

    showVoiceStatus(message, isActive) {
        // Remove existing status
        const existingStatus = document.querySelector('.voice-status');
        if (existingStatus) {
            existingStatus.remove();
        }

        // Create new status
        const statusDiv = document.createElement('div');
        statusDiv.className = `voice-status ${isActive ? 'active' : ''}`;
        statusDiv.textContent = message;
        statusDiv.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 1001;
            background: ${isActive ? '#27ae60' : '#95a5a6'};
            color: white; padding: 8px 16px; border-radius: 6px; font-size: 13px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2); font-family: 'Lora', serif;
            transform: translateY(-10px); opacity: 0; transition: all 0.3s ease;
        `;
        
        document.body.appendChild(statusDiv);
        
        // Show with animation
        setTimeout(() => {
            statusDiv.style.transform = 'translateY(0)';
            statusDiv.style.opacity = '1';
        }, 100);
        
        // Hide after delay
        setTimeout(() => {
            statusDiv.style.transform = 'translateY(-10px)';
            statusDiv.style.opacity = '0';
            setTimeout(() => statusDiv.remove(), 300);
        }, 3000);
    }

    makeTextMoreNatural(text) {
        let naturalText = text;
        
        // Clean up text for speech
        naturalText = naturalText.replace(/\. (I understand|I hear|That sounds)/g, '. $1');
        naturalText = naturalText.replace(/\.{2,}/g, '.');
        naturalText = naturalText.replace(/!{2,}/g, '!');
        naturalText = naturalText.replace(/\?{2,}/g, '?');
        
        // Make more conversational
        naturalText = naturalText.replace(/\btechniques\b/g, 'ways that might help');
        naturalText = naturalText.replace(/\bstrategies\b/g, 'things you can try');
        naturalText = naturalText.replace(/\bimplement\b/g, 'try');
        naturalText = naturalText.replace(/\butilize\b/g, 'use');
        naturalText = naturalText.replace(/^(Here are|These are)/g, 'Some things that might help are');
        naturalText = naturalText.replace(/\bAdditionally\b/g, 'Also');
        naturalText = naturalText.replace(/\bFurthermore\b/g, 'And');
        naturalText = naturalText.replace(/\bHowever\b/g, 'But');
        
        return naturalText;
    }

    stopSpeaking() {
        // Stop ElevenLabs audio
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
        
        // Stop browser TTS
        if (this.synthesis && this.isSpeaking) {
            this.synthesis.cancel();
        }
        
        this.isSpeaking = false;
        this.updateVoiceButton();
        this.updateStatus('Ready to listen', '💙');
    }

    updateStatus(text, indicator) {
        if (this.statusText) this.statusText.textContent = text;
        if (this.statusIndicator) this.statusIndicator.textContent = indicator;
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            background: #e74c3c; color: white; padding: 12px 20px; 
            border-radius: 8px; margin: 10px 20px; font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        
        const chatContainer = document.querySelector('.chat-container');
        if (chatContainer) {
            const messages = document.getElementById('messages');
            if (messages) {
                chatContainer.insertBefore(errorDiv, messages);
            } else {
                chatContainer.appendChild(errorDiv);
            }
        } else {
            document.body.appendChild(errorDiv);
        }
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    // Event callback setters
    setOnListeningStart(callback) {
        this.onListeningStart = callback;
    }

    setOnSpeechResult(callback) {
        this.onSpeechResult = callback;
    }

    // Getters
    getIsListening() {
        return this.isListening;
    }

    getIsSpeaking() {
        return this.isSpeaking;
    }

    getVoiceMode() {
        return this.voiceMode;
    }

    getElevenLabsAvailable() {
        return this.elevenLabsAvailable;
    }

    getUsageStats() {
        return {
            totalCalls: this.elevenLabsCallCount,
            devMode: TalbotConfig.DEVELOPMENT_MODE,
            elevenLabsDisabled: TalbotConfig.DISABLE_ELEVENLABS_IN_DEV,
            femaleVoiceId: this.femaleVoiceId,
            maleVoiceId: this.maleVoiceId
        };
    }

    // Legacy compatibility methods (for existing code)
    getIsPremiumVoiceEnabled() {
        return this.voiceMode > 0 && this.elevenLabsAvailable && !TalbotConfig.DEVELOPMENT_MODE;
    }

    togglePremiumVoice() {
        // Legacy method - now cycles through voice modes
        this.voiceMode = (this.voiceMode + 1) % 3;
        if (this.voiceRange) {
            this.voiceRange.value = this.voiceMode;
        }
        this.saveVoicePreference();
        
        const messages = {
            0: 'Voice muted',
            1: 'Female voice selected',
            2: 'Male voice selected'
        };
        
        const devNote = TalbotConfig.DEVELOPMENT_MODE ? ' (dev mode)' : '';
        this.showVoiceStatus(messages[this.voiceMode] + devNote, this.voiceMode > 0);
    }

    // Legacy methods for backward compatibility
    startListening() {
        // Legacy method - now just starts hold-to-speak
        this.startHoldToSpeak();
    }

    stopListening() {
        // Legacy method - now just stops hold-to-speak
        this.stopHoldToSpeak();
    }
}
