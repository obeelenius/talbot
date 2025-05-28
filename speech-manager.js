// Enhanced Speech Manager with Premium Voice Toggle
class SpeechManager {
    constructor() {
        this.isListening = false;
        this.isSpeaking = false;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.currentUtterance = null;
        this.bestVoice = null;
        this.currentAudio = null;
        
        // Voice toggle settings
        this.premiumVoiceEnabled = false; // Default to free browser TTS
        this.elevenLabsAvailable = false;
        this.elevenLabsApiKey = null;
        this.selectedVoiceId = 'pNInz6obpgDQGcFmaJgB'; // Adam voice
        
        this.initializeElements();
        this.initializeSpeech();
        this.bindEvents();
        this.checkElevenLabsAPI();
        this.loadVoicePreference();
    }

    initializeElements() {
        this.voiceButton = document.getElementById('voice-button');
        this.statusText = document.getElementById('status-text');
        this.statusIndicator = document.getElementById('status-indicator');
        this.messageInput = document.getElementById('message-input');
        this.voiceToggle = document.getElementById('voice-toggle');
        this.toggleIcon = document.getElementById('toggle-icon');
        this.toggleText = document.getElementById('toggle-text');
    }

    async checkElevenLabsAPI() {
        try {
            const response = await fetch('/.netlify/functions/elevenlabs-key');
            if (response.ok) {
                const data = await response.json();
                this.elevenLabsAvailable = data.available;
                this.elevenLabsApiKey = data.apiKey;
                console.log('ElevenLabs API check:', this.elevenLabsAvailable ? 'Available' : 'Not available');
                
                // Update toggle visibility
                this.updateToggleVisibility();
            } else {
                this.elevenLabsAvailable = false;
                this.updateToggleVisibility();
            }
        } catch (error) {
            console.log('ElevenLabs API check failed');
            this.elevenLabsAvailable = false;
            this.updateToggleVisibility();
        }
    }

    updateToggleVisibility() {
        if (!this.voiceToggle) return;
        
        if (this.elevenLabsAvailable) {
            this.voiceToggle.style.display = 'flex';
            this.updateToggleState();
        } else {
            this.voiceToggle.style.display = 'none';
            this.premiumVoiceEnabled = false;
        }
    }

    loadVoicePreference() {
        try {
            const saved = localStorage.getItem('talbot-premium-voice');
            if (saved !== null) {
                this.premiumVoiceEnabled = JSON.parse(saved);
                this.updateToggleState();
            }
        } catch (error) {
            console.error('Error loading voice preference:', error);
        }
    }

    saveVoicePreference() {
        try {
            localStorage.setItem('talbot-premium-voice', JSON.stringify(this.premiumVoiceEnabled));
        } catch (error) {
            console.error('Error saving voice preference:', error);
        }
    }

    togglePremiumVoice() {
        if (!this.elevenLabsAvailable) {
            this.showVoiceStatus('Premium voice not available', false);
            return;
        }

        this.premiumVoiceEnabled = !this.premiumVoiceEnabled;
        this.saveVoicePreference();
        this.updateToggleState();
        
        // Show status message
        const message = this.premiumVoiceEnabled ? 
            'Premium voice enabled - Natural AI speech' : 
            'Premium voice disabled - Using browser speech';
        this.showVoiceStatus(message, this.premiumVoiceEnabled);
        
        console.log('Premium voice:', this.premiumVoiceEnabled ? 'Enabled' : 'Disabled');
    }

    updateToggleState() {
        if (!this.voiceToggle) return;
        
        if (this.premiumVoiceEnabled) {
            this.voiceToggle.classList.add('premium');
            this.toggleIcon.textContent = '✨';
            this.toggleText.textContent = 'Premium Voice';
        } else {
            this.voiceToggle.classList.remove('premium');
            this.toggleIcon.textContent = '🔊';
            this.toggleText.textContent = 'Basic Voice';
        }
    }

    showVoiceStatus(message, isPremium) {
        // Remove existing status
        const existingStatus = document.querySelector('.voice-status');
        if (existingStatus) {
            existingStatus.remove();
        }

        // Create new status
        const statusDiv = document.createElement('div');
        statusDiv.className = `voice-status ${isPremium ? 'premium' : ''}`;
        statusDiv.textContent = message;
        
        document.body.appendChild(statusDiv);
        
        // Show with animation
        setTimeout(() => statusDiv.classList.add('show'), 100);
        
        // Hide after delay
        setTimeout(() => {
            statusDiv.classList.remove('show');
            setTimeout(() => statusDiv.remove(), 300);
        }, 2500);
    }

    initializeSpeech() {
        this.initializeSpeechRecognition();
        this.initializeSpeechSynthesis();
    }

    initializeSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-AU';
            
            this.recognition.onstart = () => {
                this.isListening = true;
                this.updateVoiceButton();
                this.updateStatus('Listening...', '👂');
                this.onListeningStart?.();
            };
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.messageInput.value = transcript;
                this.onSpeechResult?.(transcript);
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.showError('Voice recognition error. Please try again.');
                this.stopListening();
            };
            
            this.recognition.onend = () => {
                this.stopListening();
            };
        } else {
            this.voiceButton.style.display = 'none';
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

    bindEvents() {
        // Voice toggle button
        if (this.voiceToggle) {
            this.voiceToggle.addEventListener('click', () => this.togglePremiumVoice());
        }

        // Voice button events
        this.voiceButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startListening();
        });
        
        this.voiceButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopListening();
        });
        
        this.voiceButton.addEventListener('mousedown', () => this.startListening());
        this.voiceButton.addEventListener('mouseup', () => this.stopListening());
        this.voiceButton.addEventListener('mouseleave', () => this.stopListening());
        
        // Stop speech when typing
        this.messageInput.addEventListener('input', () => {
            if (this.isSpeaking) {
                this.stopSpeaking();
            }
        });
    }

    startListening() {
        if (this.recognition && !this.isListening) {
            this.recognition.start();
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
            this.updateVoiceButton();
            this.updateStatus('Ready to listen', '💙');
        }
    }

    // Enhanced speak method with toggle support
    async speakMessage(text) {
        if (!text) return;
        
        this.stopSpeaking();
        
        const naturalText = this.makeTextMoreNatural(text);
        
        // Use premium voice if enabled and available
        if (this.premiumVoiceEnabled && this.elevenLabsAvailable) {
            console.log('Using ElevenLabs premium voice');
            await this.speakWithElevenLabs(naturalText);
        } else {
            console.log('Using browser voice');
            this.speakWithBrowser(naturalText);
        }
    }

    async speakWithElevenLabs(text) {
        try {
            this.isSpeaking = true;
            this.updateVoiceButton();
            this.updateStatus('Talbot is speaking... ✨', '🗣️');

            const response = await fetch('/.netlify/functions/elevenlabs-tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    voice_id: this.selectedVoiceId,
                    voice_settings: {
                        stability: 0.75,
                        similarity_boost: 0.85,
                        style: 0.6, // Slightly more expressive for mental health context
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
            this.updateStatus('Talbot is speaking...', '🗣️');
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

    updateVoiceButton() {
        this.voiceButton.classList.remove('listening', 'speaking');
        
        if (this.isListening) {
            this.voiceButton.classList.add('listening');
            this.voiceButton.innerHTML = '⏹️';
        } else if (this.isSpeaking) {
            this.voiceButton.classList.add('speaking');
            this.voiceButton.innerHTML = '🔊';
        } else {
            this.voiceButton.innerHTML = '🎤';
        }
    }

    updateStatus(text, indicator) {
        this.statusText.textContent = text;
        this.statusIndicator.textContent = indicator;
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        document.querySelector('.chat-container').insertBefore(errorDiv, document.getElementById('messages'));
        
        setTimeout(() => {
            errorDiv.remove();
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

    getIsPremiumVoiceEnabled() {
        return this.premiumVoiceEnabled;
    }

    getElevenLabsAvailable() {
        return this.elevenLabsAvailable;
    }
}
