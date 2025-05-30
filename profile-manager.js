// Profile Manager - Handle User Profile and Personalization
class ProfileManager {
    constructor() {
        this.profile = null;
        this.nameUsageCount = 0;
        this.messagesSinceLastName = 0;
        
        this.initializeElements();
        this.bindEvents();
        this.loadProfile();
        
        console.log('ProfileManager initialized');
    }

    initializeElements() {
        this.profileButton = document.getElementById('profile-button');
        this.profileModal = document.getElementById('profile-modal');
        this.closeProfileButton = document.getElementById('close-profile'); // Fixed ID
        this.profileForm = document.getElementById('profile-form');
        
        // Profile form fields - using your actual HTML IDs
        this.preferredNameInput = document.getElementById('preferred-name');
        this.ageRangeSelect = document.getElementById('age-range');
        this.pronounsInput = document.getElementById('pronouns');
        this.diagnosesTextarea = document.getElementById('diagnoses');
        this.medicationsTextarea = document.getElementById('medications');
        this.treatmentHistoryTextarea = document.getElementById('treatment-history');
        this.therapyGoalsTextarea = document.getElementById('therapy-goals');
        this.copingStrategiesTextarea = document.getElementById('coping-strategies');
        this.currentStressorsTextarea = document.getElementById('current-stressors');
        this.therapistInfoTextarea = document.getElementById('therapist-info');
        this.significantPeopleTextarea = document.getElementById('profile-significant-people');
        
        // Form buttons
        this.clearProfileButton = document.getElementById('clear-profile');
        this.cancelProfileButton = document.getElementById('cancel-profile');
        this.saveProfileButton = this.profileForm?.querySelector('button[type="submit"]');
    }

    bindEvents() {
        // Profile button
        if (this.profileButton) {
            this.profileButton.addEventListener('click', () => this.openProfileModal());
        }

        // Modal close events
        if (this.closeProfileButton) {
            this.closeProfileButton.addEventListener('click', () => this.closeProfileModal());
        }

        if (this.cancelProfileButton) {
            this.cancelProfileButton.addEventListener('click', () => this.closeProfileModal());
        }

        // Clear profile button
        if (this.clearProfileButton) {
            this.clearProfileButton.addEventListener('click', () => this.handleClearProfile());
        }

        // Modal background click to close
        if (this.profileModal) {
            this.profileModal.addEventListener('click', (e) => {
                if (e.target === this.profileModal) {
                    this.closeProfileModal();
                }
            });
        }

        // Form submission
        if (this.profileForm) {
            this.profileForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }
    }

    openProfileModal() {
        if (!this.profileModal) return;

        // Populate form with current profile data
        this.populateForm();
        
        // Show modal
        this.profileModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        console.log('Profile modal opened');
    }

    closeProfileModal() {
        if (!this.profileModal) return;
        
        this.profileModal.classList.remove('active');
        document.body.style.overflow = '';
        
        console.log('Profile modal closed');
    }

    populateForm() {
        if (!this.profile) return;

        if (this.preferredNameInput) this.preferredNameInput.value = this.profile.preferredName || '';
        if (this.ageRangeSelect) this.ageRangeSelect.value = this.profile.ageRange || '';
        if (this.pronounsInput) this.pronounsInput.value = this.profile.pronouns || '';
        if (this.diagnosesTextarea) this.diagnosesTextarea.value = this.profile.diagnoses || '';
        if (this.medicationsTextarea) this.medicationsTextarea.value = this.profile.medications || '';
        if (this.treatmentHistoryTextarea) this.treatmentHistoryTextarea.value = this.profile.treatmentHistory || '';
        if (this.therapyGoalsTextarea) this.therapyGoalsTextarea.value = this.profile.therapyGoals || '';
        if (this.copingStrategiesTextarea) this.copingStrategiesTextarea.value = this.profile.copingStrategies || '';
        if (this.currentStressorsTextarea) this.currentStressorsTextarea.value = this.profile.currentStressors || '';
        if (this.therapistInfoTextarea) this.therapistInfoTextarea.value = this.profile.therapistInfo || '';
        if (this.significantPeopleTextarea) this.significantPeopleTextarea.value = this.profile.significantPeople || '';
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        try {
            // Collect form data using your actual form field IDs
            const profileData = {
                preferredName: this.preferredNameInput?.value?.trim() || '',
                ageRange: this.ageRangeSelect?.value || '',
                pronouns: this.pronounsInput?.value?.trim() || '',
                diagnoses: this.diagnosesTextarea?.value?.trim() || '',
                medications: this.medicationsTextarea?.value?.trim() || '',
                treatmentHistory: this.treatmentHistoryTextarea?.value?.trim() || '',
                therapyGoals: this.therapyGoalsTextarea?.value?.trim() || '',
                copingStrategies: this.copingStrategiesTextarea?.value?.trim() || '',
                currentStressors: this.currentStressorsTextarea?.value?.trim() || '',
                therapistInfo: this.therapistInfoTextarea?.value?.trim() || '',
                significantPeople: this.significantPeopleTextarea?.value?.trim() || '',
                lastUpdated: new Date().toISOString()
            };

            // Validate required fields
            if (!profileData.preferredName) {
                this.showErrorMessage('Please enter your preferred name.');
                return;
            }

            // Save profile
            this.saveProfile(profileData);
            
            // Show success message
            this.showSuccessMessage('Profile saved successfully!');
            
            // Close modal
            this.closeProfileModal();
            
            console.log('Profile saved:', profileData);
            
        } catch (error) {
            console.error('Error saving profile:', error);
            this.showErrorMessage('Sorry, there was an issue saving your profile. Please try again.');
        }
    }

    handleClearProfile() {
        const confirmed = confirm(
            'Are you sure you want to clear all profile data?\n\n' +
            'This action cannot be undone.'
        );
        
        if (confirmed) {
            this.profile = null;
            localStorage.removeItem('talbot-user-profile');
            this.resetNameUsageTracking();
            this.populateForm(); // This will clear the form since profile is null
            this.showSuccessMessage('Profile data cleared.');
            console.log('Profile data cleared');
        }
    }

    saveProfile(profileData) {
        this.profile = profileData;
        localStorage.setItem('talbot-user-profile', JSON.stringify(profileData));
        
        // Reset name usage tracking when profile is updated
        this.resetNameUsageTracking();
    }

    loadProfile() {
        try {
            const saved = localStorage.getItem('talbot-user-profile');
            if (saved) {
                this.profile = JSON.parse(saved);
                console.log('Profile loaded:', this.profile);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }

    // Legacy method for backward compatibility
    buildContextualMessage(message) {
        // Simple implementation for backward compatibility
        return message;
    }

    // Legacy method for backward compatibility  
    getProfile() {
        return this.profile;
    }

    // Name usage tracking methods
    resetNameUsageTracking() {
        this.nameUsageCount = 0;
        this.messagesSinceLastName = 0;
    }

    incrementMessageCount() {
        this.messagesSinceLastName++;
    }

    shouldUseName() {
        // Use name if it's been 5-6 messages since last usage
        return this.messagesSinceLastName >= 5;
    }

    markNameUsed() {
        this.nameUsageCount++;
        this.messagesSinceLastName = 0;
    }

    getNameUsageStats() {
        return {
            totalUsage: this.nameUsageCount,
            messagesSinceLastName: this.messagesSinceLastName
        };
    }

    // Profile data getters
    getName() {
        return this.profile?.preferredName || '';
    }

    getAge() {
        return this.profile?.ageRange || '';
    }

    getPronouns() {
        return this.profile?.pronouns || '';
    }

    getDiagnoses() {
        return this.profile?.diagnoses || '';
    }

    getMedications() {
        return this.profile?.medications || '';
    }

    getTreatmentHistory() {
        return this.profile?.treatmentHistory || '';
    }

    getTherapyGoals() {
        return this.profile?.therapyGoals || '';
    }

    getCopingStrategies() {
        return this.profile?.copingStrategies || '';
    }

    getCurrentStressors() {
        return this.profile?.currentStressors || '';
    }

    getTherapistInfo() {
        return this.profile?.therapistInfo || '';
    }

    getSignificantPeople() {
        return this.profile?.significantPeople || '';
    }

    // Parse significant people into structured format
    getSignificantPeopleList() {
        const significantPeople = this.getSignificantPeople();
        if (!significantPeople) return [];

        // Parse format like "Marian - mother, Peter - partner, Zea - sister"
        const people = [];
        const entries = significantPeople.split(',');
        
        entries.forEach(entry => {
            const trimmed = entry.trim();
            if (trimmed) {
                const parts = trimmed.split(' - ');
                if (parts.length >= 2) {
                    people.push({
                        name: parts[0].trim(),
                        relationship: parts[1].trim()
                    });
                } else {
                    // Just a name without relationship
                    people.push({
                        name: trimmed,
                        relationship: ''
                    });
                }
            }
        });

        return people;
    }

    hasProfile() {
        return this.profile !== null;
    }

    hasName() {
        return this.profile?.preferredName && this.profile.preferredName.trim().length > 0;
    }

    // Generate context for AI
    getProfileContext() {
        if (!this.profile) {
            return '';
        }

        let context = '';
        
        if (this.profile.preferredName) {
            context += `User's preferred name: ${this.profile.preferredName}. `;
        }
        
        if (this.profile.ageRange) {
            context += `Age range: ${this.profile.ageRange}. `;
        }
        
        if (this.profile.pronouns) {
            context += `Pronouns: ${this.profile.pronouns}. `;
        }
        
        if (this.profile.diagnoses) {
            context += `Current diagnoses: ${this.profile.diagnoses}. `;
        }
        
        if (this.profile.medications) {
            context += `Current medications: ${this.profile.medications}. `;
        }
        
        if (this.profile.treatmentHistory) {
            context += `Treatment history: ${this.profile.treatmentHistory}. `;
        }
        
        if (this.profile.therapyGoals) {
            context += `Current therapy goals: ${this.profile.therapyGoals}. `;
        }
        
        if (this.profile.copingStrategies) {
            context += `Effective coping strategies: ${this.profile.copingStrategies}. `;
        }
        
        if (this.profile.currentStressors) {
            context += `Current stressors: ${this.profile.currentStressors}. `;
        }
        
        if (this.profile.therapistInfo) {
            context += `Therapist information: ${this.profile.therapistInfo}. `;
        }

        if (this.profile.significantPeople) {
            const peopleList = this.getSignificantPeopleList();
            if (peopleList.length > 0) {
                const peopleDescriptions = peopleList.map(person => 
                    person.relationship ? `${person.name} (${person.relationship})` : person.name
                );
                context += `Important people in their life: ${peopleDescriptions.join(', ')}. `;
            }
        }
        
        return context.trim();
    }

    showSuccessMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'profile-status success';
        messageDiv.textContent = text;
        messageDiv.style.cssText = `
            position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
            z-index: 1002; background: #27ae60; color: white;
            padding: 12px 24px; border-radius: 8px; font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2); font-family: 'Lora', serif;
            max-width: 400px; text-align: center;
            opacity: 0; transition: all 0.3s ease;
        `;
        
        document.body.appendChild(messageDiv);
        
        // Show with animation
        setTimeout(() => {
            messageDiv.style.opacity = '1';
        }, 100);
        
        // Hide after delay
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            setTimeout(() => messageDiv.remove(), 300);
        }, 3000);
    }

    showErrorMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'profile-status error';
        messageDiv.textContent = text;
        messageDiv.style.cssText = `
            position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
            z-index: 1002; background: #e74c3c; color: white;
            padding: 12px 24px; border-radius: 8px; font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2); font-family: 'Lora', serif;
            max-width: 400px; text-align: center;
            opacity: 0; transition: all 0.3s ease;
        `;
        
        document.body.appendChild(messageDiv);
        
        // Show with animation
        setTimeout(() => {
            messageDiv.style.opacity = '1';
        }, 100);
        
        // Hide after delay
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            setTimeout(() => messageDiv.remove(), 300);
        }, 4000);
    }
}
