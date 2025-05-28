// Enhanced Speech Manager with Voice Slider (Mute, Female, Male)
class SpeechManager {
    constructor() {
        this.isListening = false;
        this.isSpeaking = false;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.currentUtterance = null;
        this.bestVoice = null;
        this.currentAudio = null;
        
        // Voice settings - 0: Mute, 1: Female, 2: Male
        this.voiceMode = 0; // Default to mute
        this.elevenLabsAvailable = false;
        this.elevenLabsApiKey = null;
        this.femaleVoiceId = 'EXAVITQu4vr4xnSDxMaL'; // Bella - Female voice
        this.maleVoiceId = 'pNInz6obpgDQGcFmaJgB'; // Adam - Male voice
        
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
        this.voiceSliderContainer = document.getElementById('voice-slider-container');
        this.voiceRange = document.getElementById('voice-range');
        this.voiceIndicator = document.getElementById('voice-indicator');
    }

    async checkElevenLabsAPI() {
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
                    hasApiKey: !!data.apiKey
                });
                
                // Update slider visibility
                this.updateSliderVisibility();
            } else {
                console.error('ElevenLabs key check failed with status:', response.status);
                const errorText = await response.text();
                console.error('Error details:', errorText);
                
                this.elevenLabsAvailable = false;
                this.updateSliderVisibility();
            }
        } catch (error) {
            console.error('ElevenLabs API check failed with error:', error);
            this.elevenLabsAvailable = false;
            this.updateSliderVisibility();
        }
    }

    updateSliderVisibility() {
        if (!this.voiceSliderContainer) return;
        
        if (this.elevenLabsAvailable) {
            this.voiceSliderContainer.style.display = 'flex';
            this.updateVoiceIndicator();
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

    getVoiceMode() {
        return this.voiceMode;
    }

    getElevenLabsAvailable() {
        return this.elevenLabsAvailable;
    }

    // Legacy compatibility methods (for existing code)
    getIsPremiumVoiceEnabled() {
        return this.voiceMode > 0 && this.elevenLabsAvailable;
    }

    togglePremiumVoice() {
        // Legacy method - now cycles through voice modes
        this.voiceMode = (this.voiceMode + 1) % 3;
        if (this.voiceRange) {
            this.voiceRange.value = this.voiceMode;
        }
        this.saveVoicePreference();
        this.updateVoiceIndicator();
        
        const messages = {
            0: 'Voice muted',
            1: 'Female voice selected',
            2: 'Male voice selected'
        };
        this.showVoiceStatus(messages[this.voiceMode], this.voiceMode > 0);
    }
}voiceSliderContainer.style.display = 'none';
            this.voiceMode = 0; // Force mute if ElevenLabs not available
        }
    }

    loadVoicePreference() {
        try {
            const saved = localStorage.getItem('talbot-voice-mode');
            if (saved !== null) {
                this.voiceMode = parseInt(saved, 10);
                if (this.voiceRange) {
                    this.voiceRange.value = this.voiceMode;
                }
                this.updateVoiceIndicator();
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

    updateVoiceIndicator() {
        if (!this.voiceIndicator) return;
        
        const labels = ['Mute', 'Female', 'Male'];
        this.voiceIndicator.textContent = labels[this.voiceMode] || 'Mute';
        
        console.log('Voice mode updated to:', labels[this.voiceMode]);
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
        // Voice slider events
        if (this.voiceRange) {
            this.voiceRange.addEventListener('input', (e) => {
                this.voiceMode = parseInt(e.target.value, 10);
                this.saveVoicePreference();
                this.updateVoiceIndicator();
                
                // Show feedback message
                const messages = {
                    0: 'Voice muted',
                    1: 'Female voice selected',
                    2: 'Male voice selected'
                };
                this.showVoiceStatus(messages[this.voiceMode], this.voiceMode > 0);
            });
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
        }, 2000);
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

    // Enhanced speak method with voice mode support
    async speakMessage(text) {
        if (!text || this.voiceMode === 0) {
            console.log('Speech skipped - voice is muted or no text');
            return; // Skip if muted or no text
        }
        
        this.stopSpeaking();
        
        const naturalText = this.makeTextMoreNatural(text);
        
        // Use ElevenLabs if available, otherwise fall back to browser TTS
        if (this.elevenLabsAvailable) {
            console.log(`Using ElevenLabs ${this.voiceMode === 1 ? 'female' : 'male'} voice`);
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
            
            const voiceType = this.voiceMode === 1 ? 'female' : 'male';
            this.updateStatus(`Talbot is speaking... (${voiceType})`, '🗣️');

            // Select voice ID based on mode
            const selectedVoiceId = this.voiceMode === 1 ? this.femaleVoiceId : this.maleVoiceId;

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
            this.
