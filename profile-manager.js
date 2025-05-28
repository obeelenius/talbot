// Enhanced Profile Manager with Photo Upload
class ProfileManager {
    constructor() {
        this.profile = null;
        this.documentContents = [];
        this.profilePhoto = null;
        this.initializeElements();
        this.bindEvents();
        this.loadProfile();
        
        console.log('ProfileManager initialized with photo support');
    }

    initializeElements() {
        this.profileButton = document.getElementById('profile-button');
        this.profileModal = document.getElementById('profile-modal');
        this.profileForm = document.getElementById('profile-form');
        this.closeProfile = document.getElementById('close-profile');
        this.cancelProfile = document.getElementById('cancel-profile');
        this.clearProfile = document.getElementById('clear-profile');
        this.clinicalDocuments = document.getElementById('clinical-documents');
        this.uploadedFiles = document.getElementById('uploaded-files');
        
        // Photo upload elements
        this.profilePhotoInput = document.getElementById('profile-photo-input');
        this.profilePhotoPreview = document.getElementById('profile-photo-preview');
    }

    bindEvents() {
        // Existing events
        this.profileButton.addEventListener('click', () => this.openProfile());
        this.closeProfile.addEventListener('click', () => this.closeProfileModal());
        this.cancelProfile.addEventListener('click', () => this.closeProfileModal());
        this.clearProfile.addEventListener('click', () => this.clearProfileData());
        this.profileForm.addEventListener('submit', (e) => this.saveProfile(e));
        
        // Modal close on outside click
        this.profileModal.addEventListener('click', (e) => {
            if (e.target === this.profileModal) {
                this.closeProfileModal();
            }
        });
        
        // Checkbox styling
        document.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox' && e.target.name === 'communicationStyle') {
                const item = e.target.closest('.checkbox-item');
                if (e.target.checked) {
                    item.classList.add('checked');
                } else {
                    item.classList.remove('checked');
                }
            }
        });
        
        // File upload
        this.clinicalDocuments.addEventListener('change', (e) => this.handleFileUpload(e));
        
        // Profile photo upload
        if (this.profilePhotoInput) {
            this.profilePhotoInput.addEventListener('change', (e) => this.handlePhotoUpload(e));
        }
    }

    // Photo upload handling
    async handlePhotoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showMessage('Please select an image file.', 'error');
            return;
        }

        // Validate file size (2MB limit)
        if (file.size > 2 * 1024 * 1024) {
            this.showMessage('Image must be smaller than 2MB.', 'error');
            return;
        }

        try {
            const imageDataUrl = await this.resizeImage(file, 400, 400);
            this.profilePhoto = imageDataUrl;
            
            // Update preview
            if (this.profilePhotoPreview) {
                this.profilePhotoPreview.innerHTML = `<img src="${imageDataUrl}" alt="Profile photo">`;
            }
            
            console.log('Profile photo uploaded and resized');
        } catch (error) {
            console.error('Error uploading photo:', error);
            this.showMessage('Error uploading photo. Please try again.', 'error');
        }
    }

    // Resize image to fit within max dimensions
    resizeImage(file, maxWidth, maxHeight) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // Calculate new dimensions
                let { width, height } = img;
                
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }

                // Set canvas size and draw image
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to data URL
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };

            img.src = URL.createObjectURL(file);
        });
    }

    // Enhanced save profile with photo
    saveProfile(e) {
        e.preventDefault();
        console.log('ProfileManager: Starting profile save with photo...');
        
        const profile = {};
        
        // Helper function to safely get and trim values
        const safeGetValue = (fieldId) => {
            const element = document.getElementById(fieldId);
            if (element && element.value) {
                return typeof element.value === 'string' ? element.value.trim() : String(element.value).trim();
            }
            return '';
        };
        
        // Field mappings
        const fieldMappings = {
            'preferred-name': 'preferredName',
            'age-range': 'ageRange', 
            'pronouns': 'pronouns',
            'diagnoses': 'diagnoses',
            'medications': 'medications',
            'treatment-history': 'treatmentHistory',
            'custom-communication': 'customCommunication',
            'triggers': 'triggers',
            'therapy-goals': 'therapyGoals',
            'coping-strategies': 'copingStrategies',
            'current-stressors': 'currentStressors',
            'therapist-info': 'therapistInfo'
        };
        
        // Get values from form fields safely
        for (const [fieldId, propertyName] of Object.entries(fieldMappings)) {
            const value = safeGetValue(fieldId);
            if (value) {
                profile[propertyName] = value;
                console.log(`ProfileManager: Mapped ${fieldId} -> ${propertyName}:`, value);
            }
        }
        
        // Get communication style checkboxes
        const communicationStyles = [];
        const checkboxes = document.querySelectorAll('input[name="communicationStyle"]:checked');
        checkboxes.forEach(checkbox => {
            if (checkbox.value) {
                communicationStyles.push(checkbox.value);
            }
        });
        
        if (communicationStyles.length > 0) {
            profile.communicationStyle = communicationStyles;
        }

        // Add profile photo if available
        if (this.profilePhoto) {
            profile.profilePhoto = this.profilePhoto;
            console.log('ProfileManager: Added profile photo to save data');
        }
        
        console.log('ProfileManager: Complete profile object to save');
        
        // Save to localStorage
        try {
            const profileJson = JSON.stringify(profile);
            localStorage.setItem('talbot-profile', profileJson);
            localStorage.setItem('talbot-documents', JSON.stringify(this.documentContents));
            this.profile = profile;
            
            console.log('ProfileManager: Profile with photo saved successfully');
            
            this.updateWelcomeMessage();
            this.updateUserAvatar();
            this.closeProfileModal();
            this.showMessage('Profile saved successfully!', 'success');
        } catch (error) {
            console.error('ProfileManager: Error saving profile:', error);
            this.showMessage('Error saving profile. Please try again.', 'error');
        }
    }

    // Load profile with photo support
    loadProfile() {
        console.log('ProfileManager: Loading profile with photo...');
        try {
            const savedProfile = localStorage.getItem('talbot-profile');
            const savedDocuments = localStorage.getItem('talbot-documents');
            
            if (savedProfile) {
                this.profile = JSON.parse(savedProfile);
                console.log('ProfileManager: Parsed profile with photo support');
                
                // Load profile photo
                if (this.profile.profilePhoto) {
                    this.profilePhoto = this.profile.profilePhoto;
                    this.updateUserAvatar();
                    
                    // Update preview in modal if it exists
                    if (this.profilePhotoPreview) {
                        this.profilePhotoPreview.innerHTML = `<img src="${this.profilePhoto}" alt="Profile photo">`;
                    }
                }
                
                this.populateProfileForm();
                this.updateWelcomeMessage();
            }
            
            if (savedDocuments) {
                this.documentContents = JSON.parse(savedDocuments);
                this.displaySavedDocuments();
            }
        } catch (error) {
            console.error('ProfileManager: Error loading profile:', error);
        }
    }

    // Update user avatar in chat messages
    updateUserAvatar() {
        if (!this.profilePhoto) return;
        
        // Update all existing user message avatars
        const userAvatars = document.querySelectorAll('.message.user .message-avatar');
        userAvatars.forEach(avatar => {
            avatar.innerHTML = `<img src="${this.profilePhoto}" alt="Your photo">`;
        });
        
        console.log('ProfileManager: Updated user avatars with profile photo');
    }

    // Get profile photo for new messages
    getUserAvatar() {
        if (this.profilePhoto) {
            return `<img src="${this.profilePhoto}" alt="Your photo">`;
        }
        return '👤'; // Default emoji
    }

    // Enhanced clear profile data
    clearProfileData() {
        if (confirm('Are you sure you want to clear your profile, photo, and all uploaded documents? This cannot be undone.')) {
            localStorage.removeItem('talbot-profile');
            localStorage.removeItem('talbot-documents');
            this.profile = null;
            this.profilePhoto = null;
            this.documentContents = [];
            this.profileForm.reset();
            this.uploadedFiles.innerHTML = '';
            
            // Clear photo preview
            if (this.profilePhotoPreview) {
                this.profilePhotoPreview.innerHTML = '📷';
            }
            
            // Clear checkbox styling
            document.querySelectorAll('.checkbox-item.checked').forEach(item => {
                item.classList.remove('checked');
            });
            
            // Reset welcome message and avatars
            const welcomeMessage = document.querySelector('.welcome-message h2');
            if (welcomeMessage) {
                welcomeMessage.textContent = 'Hi, I\'m Talbot';
            }
            
            // Reset all user avatars to default
            const userAvatars = document.querySelectorAll('.message.user .message-avatar');
            userAvatars.forEach(avatar => {
                avatar.innerHTML = '👤';
            });
            
            this.closeProfileModal();
            this.showMessage('Profile, photo and documents cleared successfully.', 'success');
        }
    }

    // Rest of the methods remain the same as previous version
    populateProfileForm() {
        if (!this.profile) return;
        
        console.log('ProfileManager: Populating form with profile data');
        
        const fieldMappings = {
            'preferredName': 'preferred-name',
            'ageRange': 'age-range',
            'pronouns': 'pronouns',
            'diagnoses': 'diagnoses',
            'medications': 'medications',
            'treatmentHistory': 'treatment-history',
            'customCommunication': 'custom-communication',
            'triggers': 'triggers',
            'therapyGoals': 'therapy-goals',
            'copingStrategies': 'coping-strategies',
            'currentStressors': 'current-stressors',
            'therapistInfo': 'therapist-info'
        };
        
        // Populate text inputs
        for (const [profileKey, fieldId] of Object.entries(fieldMappings)) {
            if (this.profile[profileKey]) {
                const element = document.getElementById(fieldId);
                if (element) {
                    element.value = this.profile[profileKey];
                }
            }
        }
        
        // Populate communication style checkboxes
        if (this.profile.communicationStyle && Array.isArray(this.profile.communicationStyle)) {
            this.profile.communicationStyle.forEach(style => {
                const checkbox = document.getElementById(style);
                if (checkbox) {
                    checkbox.checked = true;
                    const item = checkbox.closest('.checkbox-item');
                    if (item) {
                        item.classList.add('checked');
                    }
                }
            });
        }
    }

    updateWelcomeMessage() {
        const welcomeMessage = document.querySelector('.welcome-message h2');
        if (welcomeMessage && this.profile && this.profile.preferredName) {
            welcomeMessage.textContent = `Hi, ${this.profile.preferredName}`;
        }
    }

    openProfile() {
        this.profileModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeProfileModal() {
        this.profileModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    buildContextualMessage(message) {
        if (!this.profile) return message;
        
        let context = "User Profile Context:\n";
        
        if (this.profile.preferredName) {
            context += `- Call me: ${this.profile.preferredName}\n`;
        }
        
        if (this.profile.pronouns) {
            context += `- Pronouns: ${this.profile.pronouns}\n`;
        }
        
        if (this.profile.diagnoses) {
            context += `- Mental health conditions: ${this.profile.diagnoses}\n`;
        }
        
        if (this.documentContents && this.documentContents.length > 0) {
            context += `- Clinical Documentation:\n`;
            this.documentContents.forEach(doc => {
                context += `  * ${doc.name}:\n${doc.content}\n\n`;
            });
        }
        
        if (this.profile.medications) {
            context += `- Current medications: ${this.profile.medications}\n`;
        }
        
        if (this.profile.treatmentHistory) {
            context += `- Treatment background: ${this.profile.treatmentHistory}\n`;
        }
        
        if (this.profile.communicationStyle && this.profile.communicationStyle.length > 0) {
            context += `- Communication preferences: ${this.profile.communicationStyle.join(', ')}\n`;
        }
        
        if (this.profile.customCommunication) {
            context += `- Custom communication instructions: ${this.profile.customCommunication}\n`;
        }
        
        if (this.profile.triggers) {
            context += `- Sensitive topics: ${this.profile.triggers}\n`;
        }
        
        if (this.profile.therapyGoals) {
            context += `- Current therapy goals: ${this.profile.therapyGoals}\n`;
        }
        
        if (this.profile.copingStrategies) {
            context += `- Effective coping strategies: ${this.profile.copingStrategies}\n`;
        }
        
        if (this.profile.currentStressors) {
            context += `- Current stressors: ${this.profile.currentStressors}\n`;
        }
        
        if (this.profile.therapistInfo) {
            context += `- Therapist information: ${this.profile.therapistInfo}\n`;
        }
        
        return context + "\nUser message: " + message;
    }

    // File handling methods (simplified)
    async handleFileUpload(event) {
        const files = Array.from(event.target.files);
        
        for (const file of files) {
            if (file.size > 5 * 1024 * 1024) {
                this.showMessage(`File "${file.name}" is too large. Maximum size is 5MB.`, 'error');
                continue;
            }
            
            try {
                const content = await this.readFileContent(file);
                const fileData = {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    content: content,
                    id: Date.now() + Math.random()
                };
                
                this.documentContents.push(fileData);
                this.displayUploadedFile(fileData);
                
            } catch (error) {
                console.error('Error reading file:', error);
                this.showMessage(`Error reading file "${file.name}".`, 'error');
            }
        }
        
        event.target.value = '';
    }

    async readFileContent(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
                    resolve(e.target.result);
                } else {
                    resolve(`Document: ${file.name}\nType: ${file.type}\n\n[Document content would be extracted here]`);
                }
            };
            reader.onerror = () => resolve(`Error reading file: ${file.name}`);
            
            if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
                reader.readAsText(file);
            } else {
                resolve(`Document: ${file.name}\nType: ${file.type}\n\n[Document uploaded]`);
            }
        });
    }

    displayUploadedFile(fileData) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <div>
                <div class="file-name">${fileData.name}</div>
                <div class="file-size">${this.formatFileSize(fileData.size)}</div>
            </div>
            <button type="button" class="remove-file" data-file-id="${fileData.id}">×</button>
        `;
        
        fileItem.querySelector('.remove-file').addEventListener('click', () => {
            this.removeUploadedFile(fileData.id);
            fileItem.remove();
        });
        
        this.uploadedFiles.appendChild(fileItem);
    }

    displaySavedDocuments() {
        this.uploadedFiles.innerHTML = '';
        this.documentContents.forEach(fileData => {
            this.displayUploadedFile(fileData);
        });
    }

    removeUploadedFile(fileId) {
        this.documentContents = this.documentContents.filter(doc => doc.id !== fileId);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showMessage(text, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.textContent = text;
        messageDiv.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 1001;
            background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#8B3A3A'};
            color: white; padding: 12px 20px; border-radius: 8px; font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        
        document.body.appendChild(messageDiv);
        setTimeout(() => messageDiv.remove(), 3000);
    }

    getProfile() {
        return this.profile;
    }

    getDocuments() {
        return this.documentContents;
    }
}
