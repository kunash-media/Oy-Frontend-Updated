/**
 * User Profile Management Script
 * Handles profile data loading, editing, password change functionality, and notifications
 */

class UserProfile {
    constructor() {
        this.API_BASE_URL = 'http://localhost:8080/api/users';
        this.currentUser = null;
        this.originalUserData = null;
        this.isEditMode = false;
        this.init();
    }

    /**
     * Initialize the profile page
     */
    init() {
        // Check if user is logged in
        if (!window.userAPI || !window.userAPI.isLoggedIn()) {
            // Hide all existing page content
            document.body.style.display = 'flex';
            document.body.style.justifyContent = 'center';
            document.body.style.alignItems = 'center';
            document.body.style.minHeight = '100vh';
            document.body.style.margin = '0';
            document.body.style.padding = '20px';
            document.body.style.boxSizing = 'border-box';
            document.body.style.backgroundColor = '#f5f5f5';
            document.body.innerHTML = ''; // Clear existing content

            // Create login prompt container
            const loginPrompt = document.createElement('div');
            loginPrompt.style.textAlign = 'center';
            loginPrompt.style.padding = '40px';
            loginPrompt.style.backgroundColor = 'white';
            loginPrompt.style.borderRadius = '12px';
            loginPrompt.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
            loginPrompt.style.maxWidth = '400px';
            loginPrompt.style.width = '100%';

            // Add icon
            const icon = document.createElement('div');

            icon.innerHTML = `
                <svg width="48" height="48" viewBox="0 0 24 24" style="color: #666;">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
                    <circle cx="12" cy="8" r="3" stroke="currentColor" stroke-width="2" fill="none"/>
                    <path d="M8.21 13.89a6 6 0 0 1 7.58 0" stroke="currentColor" stroke-width="2" fill="none"/>
                </svg>`;

            icon.style.fontSize = '48px';
            icon.style.marginBottom = '16px';

            // Add title
            const title = document.createElement('h2');
            title.textContent = 'Profile not found';
            title.style.margin = '0 0 8px 0';
            title.style.color = '#333';
            title.style.fontFamily = 'Arial, sans-serif';

            // Add description
            const desc = document.createElement('p');
            desc.textContent = 'Please log in to access your profile.';
            desc.style.margin = '0 0 24px 0';
            desc.style.color = '#666';
            desc.style.fontFamily = 'Arial, sans-serif';

            // Add login button
            const loginBtn = document.createElement('button');
            loginBtn.textContent = 'Login';
            loginBtn.style.backgroundColor = '#511D43';
            loginBtn.style.color = 'white';
            loginBtn.style.border = 'none';
            loginBtn.style.borderRadius = '6px';
            loginBtn.style.padding = '12px 24px';
            loginBtn.style.fontSize = '16px';
            loginBtn.style.cursor = 'pointer';
            loginBtn.style.fontWeight = '600';
            loginBtn.style.transition = 'background-color 0.2s';
            loginBtn.onmouseenter = () => loginBtn.style.backgroundColor = '#3A152F';
            loginBtn.onmouseleave = () => loginBtn.style.backgroundColor = '#511D43';
            loginBtn.onclick = () => {
                window.location.href = '/login.html'; // Adjust path as needed
            };

            // Append elements
            loginPrompt.appendChild(icon);
            loginPrompt.appendChild(title);
            loginPrompt.appendChild(desc);
            loginPrompt.appendChild(loginBtn);

            // Add to document
            document.body.appendChild(loginPrompt);

            return; // Stop further execution
        }

        // Get current user from session
        this.currentUser = window.userAPI.getCurrentUser();
        if (!this.currentUser) {
            this.showNotification('Unable to load user session', 'error');
            return;
        }

        // Load user profile data
        this.loadUserProfile();

        // Setup event listeners
        this.setupEventListeners();
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Edit profile button
        const editProfileBtn = document.getElementById('edit-profile-btn');
        editProfileBtn.addEventListener('click', () => this.toggleEditMode(true));

        // Save profile button
        const saveProfileBtn = document.getElementById('save-profile-btn');
        saveProfileBtn.addEventListener('click', () => this.saveProfileChanges());

        // Cancel edit button
        const cancelEditBtn = document.getElementById('cancel-edit-btn');
        cancelEditBtn.addEventListener('click', () => this.cancelEdit());

        // Change password button
        const changePasswordBtn = document.getElementById('change-password-btn');
        changePasswordBtn.addEventListener('click', () => this.showPasswordOverlay());

        // Close overlay buttons
        const closeOverlay = document.getElementById('close-overlay');
        const cancelPassword = document.getElementById('cancel-password');

        closeOverlay.addEventListener('click', () => this.hidePasswordOverlay());
        cancelPassword.addEventListener('click', () => this.hidePasswordOverlay());

        // Password form submission
        const passwordForm = document.getElementById('password-form');
        passwordForm.addEventListener('submit', (e) => this.handlePasswordChange(e));

        // Close overlay when clicking outside
        const overlay = document.getElementById('password-overlay');
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.hidePasswordOverlay();
            }
        });

        // Real-time password validation
        const newPasswordInput = document.getElementById('newPassword');
        const confirmPasswordInput = document.getElementById('confirmPassword');

        confirmPasswordInput.addEventListener('input', () => {
            this.validatePasswordMatch();
        });

        newPasswordInput.addEventListener('input', () => {
            this.validatePasswordMatch();
        });

        // Handle marital status change for anniversary field
        const maritalStatusSelect = document.getElementById('maritalStatus');
        maritalStatusSelect.addEventListener('change', () => {
            this.handleMaritalStatusChange();
        });
    }

    /**
     * Load user profile data from API
     */
    async loadUserProfile() {
        try {
            this.showLoading(true);

            const response = await fetch(`${this.API_BASE_URL}/${this.currentUser.userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                const userData = await response.json();
                this.populateProfileForm(userData);
                this.originalUserData = { ...userData }; // Store original data
                this.showNotification('Profile loaded successfully', 'success');
            } else {
                const errorData = await response.json();
                this.showNotification(errorData.message || 'Failed to load profile data', 'error');
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            this.showNotification('Network error while loading profile', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Populate the profile form with user data
     */
    populateProfileForm(userData) {

    //------for array date format to string format function-------//   
    // Convert array dates to yyyy-MM-dd format for HTML inputs
    // const formatDateForInput = (dateArray) => {
    //     if (!dateArray || dateArray.length !== 3) return '';
    //     const [year, month, day] = dateArray;
    //     // Note: month is 1-12 in your data (no need for +1 adjustment)
    //     return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    // };

    // Populate form fields
    document.getElementById('customerName').value = userData.customerName || '';
    document.getElementById('email').value = userData.email || '';
    document.getElementById('mobile').value = userData.mobile || '';
    document.getElementById('maritalStatus').value = userData.maritalStatus || '';
    document.getElementById('status').value = userData.status || '';
    
    // Handle dates (convert from array to string format)
    document.getElementById('customerDOB').value = userData.customerDOB;
    
    // Handle anniversary field
    const anniversaryGroup = document.getElementById('anniversary-group');
    const anniversaryInput = document.getElementById('anniversary');
    
    const anniversaryDate = userData.anniversary;
    if (anniversaryDate && userData.maritalStatus === 'Married') {
        anniversaryInput.value = anniversaryDate;
        anniversaryGroup.classList.remove('hidden');
    } else {
        anniversaryInput.value = '';
        anniversaryGroup.classList.add('hidden');
    }

    // Update current user data
    this.currentUser = userData;

    // Handle anniversary visibility based on marital status
    this.handleMaritalStatusChange();
}

    /**
     * Toggle edit mode
     */
    toggleEditMode(enable) {
        this.isEditMode = enable;

        // Get form elements
        const editableFields = ['customerName', 'mobile', 'maritalStatus', 'customerDOB', 'anniversary'];
        const editBtn = document.getElementById('edit-profile-btn');
        const saveBtn = document.getElementById('save-profile-btn');
        const cancelBtn = document.getElementById('cancel-edit-btn');

        if (enable) {
            // Enable editing
            editableFields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) {
                    if (field.type === 'select-one') {
                        field.disabled = false;
                    } else {
                        field.readOnly = false;
                    }
                    field.classList.add('editable');
                }
            });

            // Show/hide buttons
            editBtn.style.display = 'none';
            saveBtn.style.display = 'inline-block';
            cancelBtn.style.display = 'inline-block';
        } else {
            // Disable editing
            editableFields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) {
                    if (field.type === 'select-one') {
                        field.disabled = true;
                    } else {
                        field.readOnly = true;
                    }
                    field.classList.remove('editable');
                }
            });

            // Show/hide buttons
            editBtn.style.display = 'inline-block';
            saveBtn.style.display = 'none';
            cancelBtn.style.display = 'none';
        }
    }

    /**
     * Handle marital status change to show/hide anniversary field
     */
    handleMaritalStatusChange() {
        const maritalStatus = document.getElementById('maritalStatus').value;
        const anniversaryGroup = document.getElementById('anniversary-group');

        if (maritalStatus === 'Married') {
            anniversaryGroup.style.display = 'block';
        } else {
            anniversaryGroup.style.display = 'none';
            // Clear anniversary value if not married
            if (this.isEditMode) {
                document.getElementById('anniversary').value = '';
            }
        }
    }

    /**
     * Save profile changes
     */
    async saveProfileChanges() {
        try {
            // Validate form data
            const formData = this.getFormData();

            if (!this.validateFormData(formData)) {
                return;
            }

            this.showLoading(true);

            const response = await fetch(`${this.API_BASE_URL}/update/${this.currentUser.userId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const updatedData = await response.json();
                this.currentUser = updatedData;
                this.originalUserData = { ...updatedData };
                this.toggleEditMode(false);
                this.showNotification('Profile updated successfully', 'success');
            } else {
                const errorData = await response.json();
                this.showNotification(errorData.message || 'Failed to update profile', 'error');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showNotification('Network error while updating profile', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Cancel edit and restore original data
     */
    cancelEdit() {
        if (this.originalUserData) {
            this.populateProfileForm(this.originalUserData);
        }
        this.toggleEditMode(false);
        this.showNotification('Changes cancelled', 'info');
    }

    /**
     * Get form data
     */
    getFormData() {
        const maritalStatus = document.getElementById('maritalStatus').value;

        return {
            customerName: document.getElementById('customerName').value.trim(),
            email: document.getElementById('email').value.trim(), // Email remains readonly but included
            mobile: document.getElementById('mobile').value.trim(),
            maritalStatus: maritalStatus,
            customerDOB: document.getElementById('customerDOB').value,
            anniversary: maritalStatus === 'Married' ? document.getElementById('anniversary').value : null,
            status: document.getElementById('status').value.trim() // Status remains readonly but included
        };
    }

    /**
     * Validate form data
     */
    validateFormData(formData) {
        // Customer name validation
        if (!formData.customerName) {
            this.showNotification('Customer name is required', 'warning');
            document.getElementById('customerName').focus();
            return false;
        }

        // Mobile validation
        if (!formData.mobile) {
            this.showNotification('Mobile number is required', 'warning');
            document.getElementById('mobile').focus();
            return false;
        }

        // Mobile format validation (basic)
        const mobileRegex = /^[0-9+\-\s()]+$/;
        if (!mobileRegex.test(formData.mobile)) {
            this.showNotification('Please enter a valid mobile number', 'warning');
            document.getElementById('mobile').focus();
            return false;
        }

        // Date of birth validation
        if (!formData.customerDOB) {
            this.showNotification('Date of birth is required', 'warning');
            document.getElementById('customerDOB').focus();
            return false;
        }

        // Anniversary validation for married status
        if (formData.maritalStatus === 'Married' && !formData.anniversary) {
            this.showNotification('Anniversary date is required for married status', 'warning');
            document.getElementById('anniversary').focus();
            return false;
        }

        return true;
    }

    /**
     * Show password change overlay
     */
    showPasswordOverlay() {
        const overlay = document.getElementById('password-overlay');
        overlay.classList.add('show');

        // Clear previous form data
        document.getElementById('password-form').reset();

        // Focus on old password field
        setTimeout(() => {
            document.getElementById('oldPassword').focus();
        }, 300);
    }

    /**
     * Hide password change overlay
     */
    hidePasswordOverlay() {
        const overlay = document.getElementById('password-overlay');
        overlay.classList.remove('show');

        // Clear form
        document.getElementById('password-form').reset();
    }

    /**
     * Handle password change form submission
     */
    async handlePasswordChange(event) {
        event.preventDefault();

        const oldPassword = document.getElementById('oldPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validation
        if (!oldPassword || !newPassword || !confirmPassword) {
            this.showNotification('Please fill in all password fields', 'warning');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showNotification('New passwords do not match', 'error');
            return;
        }

        if (newPassword.length < 4) {
            this.showNotification('New password must be at least 4 characters long', 'warning');
            return;
        }

        if (oldPassword === newPassword) {
            this.showNotification('New password must be different from old password', 'warning');
            return;
        }

        try {
            this.showLoading(true);

            // Construct change password URL
            const changePasswordUrl = `${this.API_BASE_URL}/change-password/${this.currentUser.userId}?oldPassword=${encodeURIComponent(oldPassword)}&newPassword=${encodeURIComponent(newPassword)}`;

            const response = await fetch(changePasswordUrl, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                this.showNotification('Password changed successfully', 'success');
                this.hidePasswordOverlay();
            } else {
                const errorData = await response.json();

                // Check for specific error messages
                if (errorData.message && errorData.message.toLowerCase().includes('old password')) {
                    this.showNotification('Old password is incorrect', 'error');
                } else {
                    this.showNotification(errorData.message || 'Failed to change password', 'error');
                }
            }
        } catch (error) {
            console.error('Error changing password:', error);
            this.showNotification('Network error while changing password', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Validate password match in real-time
     */
    validatePasswordMatch() {
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const confirmInput = document.getElementById('confirmPassword');

        if (confirmPassword && newPassword !== confirmPassword) {
            confirmInput.style.borderColor = '#f44336';
            confirmInput.style.backgroundColor = '#ffebee';
        } else if (confirmPassword) {
            confirmInput.style.borderColor = '#4CAF50';
            confirmInput.style.backgroundColor = '#e8f5e8';
        } else {
            confirmInput.style.borderColor = '#e0e0e0';
            confirmInput.style.backgroundColor = '#f8f9fa';
        }
    }

    /**
     * Show/hide loading spinner
     */
    showLoading(show) {
        const loadingSpinner = document.getElementById('loading-spinner');
        if (show) {
            loadingSpinner.classList.add('show');
        } else {
            loadingSpinner.classList.remove('show');
        }
    }

    /**
     * Show notification popup
     */
    showNotification(message, type = 'info', duration = 5000) {
        const container = document.getElementById('notification-container');

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;

        notification.innerHTML = `
            ${message}
            <button class="close-notification" onclick="this.parentElement.remove()">&times;</button>
        `;

        // Add to container
        container.appendChild(notification);

        // Auto remove after duration
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.transform = 'translateX(100%)';
                notification.style.opacity = '0';
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 300);
            }
        }, duration);
    }

    /**
     * Extend user session on activity
     */
    extendSession() {
        if (window.userAPI) {
            window.userAPI.extendSession();
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.userProfile = new UserProfile();
});

// Extend session on user activity
document.addEventListener('click', () => {
    if (window.userProfile) {
        window.userProfile.extendSession();
    }
});

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.userProfile && window.userAPI) {
        // Check if session is still valid when page becomes visible
        if (!window.userAPI.isLoggedIn()) {
            window.userProfile.showNotification('Session expired. Please log in again.', 'warning');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }
    }
});