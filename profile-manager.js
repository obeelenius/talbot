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
        this.closeProfileModal = document.getElementById('close-profile-modal');
        this.profileForm = document.getElementById('profile-form');
        this.nameInput = document.getElementById('profile-name');
        this.ageInput = document.getElementById('profile-age');
        this.pronounsSelect = document.getElementById('profile-pronouns');
        this.locationInput = document.getElementById('profile-location');
        this.therapistInput = document.getElementById('profile-therapist');
        this.sessionFrequencySelect = document.getElementById('profile-session-frequency');
        this.mainConcernsTextarea = document.getElementById('profile-main-concerns');
        this.goalsTextarea = document.getElementById('profile-goals');
        this.significantPeopleTextarea = document.getElementById('profile-significant-people');
        this.saveProfileButton = document.getElementById('save-profile-button');
        this.cancelProfileButton = document.getElementById('cancel-profile-button');
    }

    bindEvents() {
        // Profile button
        if (this.profileButton) {
            this.profileButton.addEventListener('click', () => this.openProfileModal());
        }

        // Modal close events
        if (this.closeProfileModal) {
            this.closeProfileModal.addEventListener('click', () => this.closeProfileModal());
        }

        if (this.cancelProfileButton) {
            this.cancelProfileButton.addEventListener('click', () => this.closeProfileModal());
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

        if (this.saveProfileButton) {
            this.saveProfileButton.addEventListener('click', (e) => this.handleFormSubmit(e));
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

        if (this.nameInput) this.nameInput.value = this.profile.name || '';
        if (this.ageInput) this.ageInput.value = this.profile.age || '';
        if (this.pronounsSelect) this.pronounsSelect.value = this.profile.pronouns || '';
        if (this.locationInput) this.locationInput.value = this.profile.location || '';
        if (this.therapistInput) this.therapistInput.value = this.profile.therapist || '';
        if (this.sessionFrequencySelect) this.sessionFrequencySelect.value = this.profile.sessionFrequency || '';
        if (this.mainConcernsTextarea) this.mainConcernsTextarea.value = this.profile.mainConcerns || '';
        if (this.goalsTextarea) this.goalsTextarea.value = this.profile.goals || '';
        if (this.significantPeopleTextarea) this.significantPeopleTextarea.value = this.profile.significantPeople || '';
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        try {
            // Collect form data
            const profileData = {
                name: this.nameInput?.value?.trim() || '',
                age: this.ageInput?.value?.trim() || '',
                pronouns: this.pronounsSelect?.value || '',
                location: this.locationInput?.value?.trim() || '',
                therapist: this.therapistInput?.value?.trim() || '',
                sessionFrequency: this.sessionFrequencySelect?.value || '',
                mainConcerns: this.mainConcernsTextarea?.value?.trim() || '',
                goals: this.goalsTextarea?.value?.trim() || '',
                significantPeople: this.significantPeopleTextarea?.value?.trim() || '',
                lastUpdated: new Date().toISOString()
            };

            // Validate required fields
            if (!profileData.name) {
                this.showErrorMessage('Please enter your name.');
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
        return this.profile?.name || '';
    }

    getAge() {
        return this.profile?.age || '';
    }

    getPronouns() {
        return this.profile?.pronouns || '';
    }

    getLocation() {
        return this.profile?.location || '';
    }

    getTherapist() {
        return this.profile?.therapist || '';
    }

    getSessionFrequency() {
        return this.profile?.sessionFrequency || '';
    }

    getMainConcerns() {
        return this.profile?.mainConcerns || '';
    }

    getGoals() {
        return this.profile?.goals || '';
    }

    getSignificantPeople() {
        return this.profile?.significantPeople || '';
    }

    // Parse significant people into structured format
    getSignificantPeopleList() {
        const significantPeople = this.getSignificantPeople();
        if (!significantPeople) return [];

        // Parse format like "Marian - mother, Peter - boyfriend, Zea - sister"
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
        return this.profile?.name && this.profile.name.trim().length > 0;
    }

    // Generate context for AI
    getProfileContext() {
        if (!this.profile) {
            return '';
        }

        let context = '';
        
        if (this.profile.name) {
            context += `User's name: ${this.profile.name}. `;
        }
        
        if (this.profile.age) {
            context += `Age: ${this.profile.age}. `;
        }
        
        if (this.profile.pronouns) {
            context += `Pronouns: ${this.profile.pronouns}. `;
        }
        
        if (this.profile.location) {
            context += `Location: ${this.profile.location}. `;
        }
        
        if (this.profile.therapist) {
            context += `Therapist: ${this.profile.therapist}. `;
        }
        
        if (this.profile.sessionFrequency) {
            context += `Therapy frequency: ${this.profile.sessionFrequency}. `;
        }
        
        if (this.profile.mainConcerns) {
            context += `Main concerns: ${this.profile.mainConcerns}. `;
        }
        
        if (this.profile.goals) {
            context += `Goals: ${this.profile.goals}. `;
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
