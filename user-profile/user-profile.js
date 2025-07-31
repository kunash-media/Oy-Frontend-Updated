/**
 * User Profile Management Script
 * Handles profile data loading, editing, password change functionality, notifications, and shipping address management
 */
class UserProfile {
    constructor() {
        this.API_BASE_URL = 'https://api.oyjewells.com/api/users';
        this.API_ADDRESS_URL = 'https://api.oyjewells.com/api/addresses';
        this.currentUser = null;
        this.originalUserData = null;
        this.isEditMode = false;
        this.shippingAddress = null;
        this.isEditingAddress = false;
        this.init();
    }

    /**
     * Initialize the profile page
     */
    async init() {
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
                window.location.href = '/login.html';
            };

            // Append elements
            loginPrompt.appendChild(icon);
            loginPrompt.appendChild(title);
            loginPrompt.appendChild(desc);
            loginPrompt.appendChild(loginBtn);

            // Add to document
            document.body.appendChild(loginPrompt);
            return;
        }

        // Get current user from session
        this.currentUser = window.userAPI.getCurrentUser();
        if (!this.currentUser) {
            this.showNotification('Unable to load user session', 'error');
            return;
        }

        // Load user profile and shipping address data
        await this.loadUserProfileAndShippingAddress();

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
        confirmPasswordInput.addEventListener('input', () => this.validatePasswordMatch());
        newPasswordInput.addEventListener('input', () => this.validatePasswordMatch());

        // Handle marital status change for anniversary field
        const maritalStatusSelect = document.getElementById('maritalStatus');
        maritalStatusSelect.addEventListener('change', () => this.handleMaritalStatusChange());

        // Setup event listeners for shipping address functionality
        const addShippingAddressBtn = document.getElementById('add-shipping-address-btn');
        const editShippingAddressBtn = document.getElementById('edit-shipping-address-btn');
        const cancelShippingAddressBtn = document.getElementById('cancel-shipping-address-btn');
        const shippingAddressForm = document.getElementById('shipping-address-form');

        addShippingAddressBtn.addEventListener('click', () => this.openShippingAddressOverlay(false));
        editShippingAddressBtn.addEventListener('click', () => this.openShippingAddressOverlay(true));
        cancelShippingAddressBtn.addEventListener('click', () => this.closeShippingAddressOverlay());
        shippingAddressForm.addEventListener('submit', (e) => this.handleShippingAddressSubmit(e));
    }


    /**
 * Create and store combined payload in localStorage
 */
storeCombinedPayload(userData, shippingAddress) {
    // Only store if both userData and shippingAddress are valid and non-empty
    if (!userData || !shippingAddress) {
        console.log('Combined payload not stored: Missing user or shipping data');
        return;
    }

    // Check if all required fields have valid values
    const requiredFields = [
        'customerFirstName', 'customerLastName', 'email', 'mobile',
        'customerPhone', 'customerEmail', 'shippingAddress', 'shippingCity',
        'shippingState', 'shippingPincode', 'shippingCountry'
    ];

    const hasAllRequiredFields = requiredFields.every(field => 
        userData[field] || shippingAddress[field]
    );

    if (!hasAllRequiredFields) {
        console.log('Combined payload not stored: Missing required fields');
        return;
    }

    // Validate customerDOB
    let customerDOB = userData.customerDOB;
    if (!customerDOB || customerDOB === 'undefined' || !/^\d{4}-\d{2}-\d{2}$/.test(customerDOB)) {
        customerDOB = null; // Set to null if invalid or undefined
    }

    // Create combined payload
    const combinedPayload = {
        userId: userData.userId,
        customerFirstName: userData.customerFirstName,
        customerLastName: userData.customerLastName,
        customerPhone: shippingAddress.customerPhone,
        customerEmail: shippingAddress.customerEmail,
        shippingAddress: shippingAddress.shippingAddress,
        shippingCity: shippingAddress.shippingCity,
        shippingState: shippingAddress.shippingState,
        shippingPincode: shippingAddress.shippingPincode,
        shippingCountry: shippingAddress.shippingCountry,
        shippingIsBilling: false,
        billingCustomerName: userData.customerFirstName,
        billingLastName: userData.customerLastName,
        billingAddress: shippingAddress.shippingAddress,
        billingCity: shippingAddress.shippingCity,
        billingState: shippingAddress.shippingState,
        billingPincode: shippingAddress.shippingPincode,
        billingCountry: shippingAddress.shippingCountry,
        billingEmail: shippingAddress.customerEmail,
        billingPhone: shippingAddress.customerPhone,
        email: userData.email,
        mobile: userData.mobile,
        maritalStatus: userData.maritalStatus,
        customerDOB: customerDOB,
        anniversary: userData.anniversary
    };

    try {
        localStorage.setItem('userProfileData', JSON.stringify(combinedPayload));
        console.log('Combined payload successfully stored in localStorage:', combinedPayload);
    } catch (error) {
        console.error('Error storing combined payload in localStorage:', error);
        this.showNotification('Failed to store profile data locally', 'error');
    }
}


/**
 * Load user profile and shipping address, then store combined payload
 */
async loadUserProfileAndShippingAddress() {
    try {
        this.showLoading(true);

        // Fetch user profile data from API
        const userResponse = await fetch(`${this.API_BASE_URL}/${this.currentUser.userId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!userResponse.ok) {
            const errorData = await userResponse.json();
            this.showNotification(errorData.message || 'Failed to load profile data', 'error');
            return;
        }

        const userData = await userResponse.json();
        // Validate and set defaults for critical fields
        userData.email = userData.email || '';
        userData.mobile = userData.mobile || '';
        userData.maritalStatus = userData.maritalStatus || '';
        userData.customerDOB = userData.customerDOB && userData.customerDOB !== 'undefined' && /^\d{4}-\d{2}-\d{2}$/.test(userData.customerDOB) ? userData.customerDOB : '';
        userData.anniversary = userData.anniversary || null;

        this.populateProfileForm(userData);
        this.originalUserData = { ...userData };
        this.showNotification('Profile loaded successfully', 'success');

        // Fetch shipping address data
        const addressResponse = await fetch(`${this.API_ADDRESS_URL}/get-address-by-userId/${this.currentUser.userId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        let shippingAddress = null;
        if (addressResponse.ok) {
            const addresses = await addressResponse.json();
            if (addresses.length > 0) {
                shippingAddress = addresses[0];
            }
        } else {
            this.showNotification('Failed to load shipping address', 'error');
        }

        const addButton = document.getElementById('add-shipping-address-btn');
        const container = document.getElementById('shipping-address-container');

        if (shippingAddress) {
            this.shippingAddress = shippingAddress;
            this.displayShippingAddress();
            addButton.style.display = 'none';
            container.style.display = 'block';
            // Store combined payload with user and shipping data
            this.storeCombinedPayload(userData, this.shippingAddress);
        } else {
            addButton.textContent = 'Add Shipping Address';
            addButton.style.display = 'inline-block';
            container.style.display = 'none';
            console.log('No shipping address found, combined payload not stored');
        }
    } catch (error) {
        console.error('Error loading profile or shipping address:', error);
        this.showNotification('Network error while loading profile data', 'error');
    } finally {
        this.showLoading(false);
    }
}

    /**
     * Load shipping address data from API
     */
    async loadShippingAddress() {
        try {
            this.showLoading(true);
            const response = await fetch(`${this.API_ADDRESS_URL}/get-address-by-userId/${this.currentUser.userId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const addresses = await response.json();
                const addButton = document.getElementById('add-shipping-address-btn');
                const container = document.getElementById('shipping-address-container');

                if (addresses.length > 0) {
                    this.shippingAddress = addresses[0];
                    this.displayShippingAddress();
                    addButton.style.display = 'none';
                    container.style.display = 'block';
                } else {
                    addButton.textContent = 'Add Shipping Address';
                    addButton.style.display = 'inline-block';
                    container.style.display = 'none';
                }
            } else {
                this.showNotification('Failed to load shipping address', 'error');
            }
        } catch (error) {
            console.error('Error loading shipping address:', error);
            this.showNotification('Network error while loading shipping address', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Display shipping address in the rectangular container
     */
    displayShippingAddress() {
        const addressText = document.getElementById('shipping-address-text');
        const address = this.shippingAddress;
        addressText.textContent = `${address.shippingAddress}, ${address.shippingCity}, ${address.shippingState}, ${address.shippingPincode}, ${address.shippingCountry} | Phone: ${address.customerPhone} | Email: ${address.customerEmail}`;
    }

    /**
     * Open the overlay form for adding/editing shipping address
     */
    openShippingAddressOverlay(isEditing) {
        this.isEditingAddress = isEditing;
        const overlay = document.getElementById('shipping-address-overlay');
        const form = document.getElementById('shipping-address-form');
        const title = document.getElementById('overlay-title');
        
        title.textContent = isEditing ? 'Edit Shipping Address' : 'Add Shipping Address';
        
        if (isEditing && this.shippingAddress) {
            document.getElementById('shipping-customer-phone').value = this.shippingAddress.customerPhone || '';
            document.getElementById('shipping-customer-email').value = this.shippingAddress.customerEmail || '';
            document.getElementById('shipping-address').value = this.shippingAddress.shippingAddress || '';
            document.getElementById('shipping-city').value = this.shippingAddress.shippingCity || '';
            document.getElementById('shipping-state').value = this.shippingAddress.shippingState || '';
            document.getElementById('shipping-pincode').value = this.shippingAddress.shippingPincode || '';
            document.getElementById('shipping-country').value = this.shippingAddress.shippingCountry || '';
        } else {
            form.reset();
        }
        
        overlay.style.display = 'flex';
        overlay.classList.add('show');
    }

    /**
     * Close the shipping address overlay form
     */
    closeShippingAddressOverlay() {
        const overlay = document.getElementById('shipping-address-overlay');
        overlay.style.display = 'none';
        overlay.classList.remove('show');
        document.getElementById('shipping-address-form').reset();
    }

   /**
 * Handle form submission for adding/editing shipping address
 */
async handleShippingAddressSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const payload = {
        customerPhone: form.customerPhone.value,
        customerEmail: form.customerEmail.value,
        shippingAddress: form.shippingAddress.value,
        shippingCity: form.shippingCity.value,
        shippingState: form.shippingState.value,
        shippingPincode: form.shippingPincode.value,
        shippingCountry: form.shippingCountry.value
    };

    try {
        this.showLoading(true);
        const url = this.isEditingAddress 
            ? `${this.API_ADDRESS_URL}/patch-address/${this.currentUser.userId}/${this.shippingAddress.shippingId}`
            : `${this.API_ADDRESS_URL}/create-address/${this.currentUser.userId}`;
        const method = this.isEditingAddress ? 'PATCH' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            await this.loadShippingAddress();
            this.closeShippingAddressOverlay();
            this.showNotification(`Shipping address ${this.isEditingAddress ? 'updated' : 'added'} successfully`, 'success');
            // Update combined payload after address change
            if (this.originalUserData) {
                this.storeCombinedPayload(this.originalUserData, this.shippingAddress);
            }
        } else {
            const errorData = await response.json();
            this.showNotification(errorData.message || 'Failed to save shipping address', 'error');
        }
    } catch (error) {
        console.error('Error saving shipping address:', error);
        this.showNotification('Network error while saving shipping address', 'error');
    } finally {
        this.showLoading(false);
    }
}

/**
 * Populate the profile form with user data
 */
populateProfileForm(userData) {
    document.getElementById('customerFirstName').value = userData.customerFirstName || '';
    document.getElementById('customerLastName').value = userData.customerLastName || '';
    document.getElementById('email').value = userData.email || '';
    document.getElementById('mobile').value = userData.mobile || '';
    document.getElementById('maritalStatus').value = userData.maritalStatus || '';
    
    document.getElementById('customerDOB').value = userData.customerDOB && userData.customerDOB !== 'undefined' && /^\d{4}-\d{2}-\d{2}$/.test(userData.customerDOB) ? userData.customerDOB : '';
    
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

    this.currentUser = userData;
    this.handleMaritalStatusChange();
}

    /**
     * Toggle edit mode
     */
    toggleEditMode(enable) {
        this.isEditMode = enable;
        const editableFields = ['customerFirstName', 'customerLastName', 'mobile', 'maritalStatus', 'customerDOB', 'anniversary'];
        const editBtn = document.getElementById('edit-profile-btn');
        const saveBtn = document.getElementById('save-profile-btn');
        const cancelBtn = document.getElementById('cancel-edit-btn');

        if (enable) {
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

            editBtn.style.display = 'none';
            saveBtn.style.display = 'inline-block';
            cancelBtn.style.display = 'inline-block';
        } else {
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
            // Update combined payload if shipping address exists
            if (this.shippingAddress) {
                this.storeCombinedPayload(updatedData, this.shippingAddress);
            }
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
            customerFirstName: document.getElementById('customerFirstName').value.trim(),
            customerLastName: document.getElementById('customerLastName').value.trim(),
            email: document.getElementById('email').value.trim(),
            mobile: document.getElementById('mobile').value.trim(),
            maritalStatus: maritalStatus,
            customerDOB: document.getElementById('customerDOB').value,
            anniversary: maritalStatus === 'Married' ? document.getElementById('anniversary').value : null,
        };
    }

    /**
     * Validate form data
     */
    validateFormData(formData) {
        if (!formData.customerFirstName) {
            this.showNotification('First name is required', 'warning');
            document.getElementById('customerFirstName').focus();
            return false;
        }

        if (!formData.customerLastName) {
            this.showNotification('Last name is required', 'warning');
            document.getElementById('customerLastName').focus();
            return false;
        }

        if (!formData.mobile) {
            this.showNotification('Mobile number is required', 'warning');
            document.getElementById('mobile').focus();
            return false;
        }

        const mobileRegex = /^[0-9+\-\s()]+$/;
        if (!mobileRegex.test(formData.mobile)) {
            this.showNotification('Please enter a valid mobile number', 'warning');
            document.getElementById('mobile').focus();
            return false;
        }

        if (!formData.customerDOB) {
            this.showNotification('Date of birth is required', 'warning');
            document.getElementById('customerDOB').focus();
            return false;
        }

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
        document.getElementById('password-form').reset();
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
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            ${message}
            <button class="close-notification" onclick="this.parentElement.remove()">×</button>
        `;
        container.appendChild(notification);
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
        if (!window.userAPI.isLoggedIn()) {
            window.userProfile.showNotification('Session expired. Please log in again.', 'warning');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }
    }
});























// /**
//  * User Profile Management Script
//  * Handles profile data loading, editing, password change functionality, notifications, and shipping address management
//  */

// class UserProfile {
//     constructor() {
//         this.API_BASE_URL = 'http://localhost:8080/api/users';
//         this.API_ADDRESS_URL = 'http://localhost:8080/api/addresses';
//         this.currentUser = null;
//         this.originalUserData = null;
//         this.isEditMode = false;
//         this.shippingAddress = null;
//         this.isEditingAddress = false;
//         this.init();
//     }

//     /**
//      * Initialize the profile page and store combined payload after login
//      */
//     async init() {
//         // Check if user is logged in
//         if (!window.userAPI || !window.userAPI.isLoggedIn()) {
//             // Hide all existing page content
//             document.body.style.display = 'flex';
//             document.body.style.justifyContent = 'center';
//             document.body.style.alignItems = 'center';
//             document.body.style.minHeight = '100vh';
//             document.body.style.margin = '0';
//             document.body.style.padding = '20px';
//             document.body.style.boxSizing = 'border-box';
//             document.body.style.backgroundColor = '#f5f5f5';
//             document.body.innerHTML = ''; // Clear existing content

//             // Create login prompt container
//             const loginPrompt = document.createElement('div');
//             loginPrompt.style.textAlign = 'center';
//             loginPrompt.style.padding = '40px';
//             loginPrompt.style.backgroundColor = 'white';
//             loginPrompt.style.borderRadius = '12px';
//             loginPrompt.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
//             loginPrompt.style.maxWidth = '400px';
//             loginPrompt.style.width = '100%';

//             // Add icon
//             const icon = document.createElement('div');
//             icon.innerHTML = `
//                 <svg width="48" height="48" viewBox="0 0 24 24" style="color: #666;">
//                     <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
//                     <circle cx="12" cy="8" r="3" stroke="currentColor" stroke-width="2" fill="none"/>
//                     <path d="M8.21 13.89a6 6 0 0 1 7.58 0" stroke="currentColor" stroke-width="2" fill="none"/>
//                 </svg>`;
//             icon.style.fontSize = '48px';
//             icon.style.marginBottom = '16px';

//             // Add title
//             const title = document.createElement('h2');
//             title.textContent = 'Profile not found';
//             title.style.margin = '0 0 8px 0';
//             title.style.color = '#333';
//             title.style.fontFamily = 'Arial, sans-serif';

//             // Add description
//             const desc = document.createElement('p');
//             desc.textContent = 'Please log in to access your profile.';
//             desc.style.margin = '0 0 24px 0';
//             desc.style.color = '#666';
//             desc.style.fontFamily = 'Arial, sans-serif';

//             // Add login button
//             const loginBtn = document.createElement('button');
//             loginBtn.textContent = 'Login';
//             loginBtn.style.backgroundColor = '#511D43';
//             loginBtn.style.color = 'white';
//             loginBtn.style.border = 'none';
//             loginBtn.style.borderRadius = '6px';
//             loginBtn.style.padding = '12px 24px';
//             loginBtn.style.fontSize = '16px';
//             loginBtn.style.cursor = 'pointer';
//             loginBtn.style.fontWeight = '600';
//             loginBtn.style.transition = 'background-color 0.2s';
//             loginBtn.onmouseenter = () => loginBtn.style.backgroundColor = '#3A152F';
//             loginBtn.onmouseleave = () => loginBtn.style.backgroundColor = '#511D43';
//             loginBtn.onclick = () => {
//                 window.location.href = '/login.html';
//             };

//             // Append elements
//             loginPrompt.appendChild(icon);
//             loginPrompt.appendChild(title);
//             loginPrompt.appendChild(desc);
//             loginPrompt.appendChild(loginBtn);

//             // Add to document
//             document.body.appendChild(loginPrompt);
//             return;
//         }

//         // Get current user from session
//         this.currentUser = window.userAPI.getCurrentUser();
//         if (!this.currentUser) {
//             this.showNotification('Unable to load user session', 'error');
//             return;
//         }

//         // Load user profile and shipping address data, then store combined payload
//         await this.loadUserProfileAndStoreCombinedPayload();

//         // Setup event listeners
//         this.setupEventListeners();
//     }

//     /**
//      * Setup all event listeners
//      */
//     setupEventListeners() {
//         // Edit profile button
//         const editProfileBtn = document.getElementById('edit-profile-btn');
//         editProfileBtn.addEventListener('click', () => this.toggleEditMode(true));

//         // Save profile button
//         const saveProfileBtn = document.getElementById('save-profile-btn');
//         saveProfileBtn.addEventListener('click', () => this.saveProfileChanges());

//         // Cancel edit button
//         const cancelEditBtn = document.getElementById('cancel-edit-btn');
//         cancelEditBtn.addEventListener('click', () => this.cancelEdit());

//         // Change password button
//         const changePasswordBtn = document.getElementById('change-password-btn');
//         changePasswordBtn.addEventListener('click', () => this.showPasswordOverlay());

//         // Close overlay buttons
//         const closeOverlay = document.getElementById('close-overlay');
//         const cancelPassword = document.getElementById('cancel-password');
//         closeOverlay.addEventListener('click', () => this.hidePasswordOverlay());
//         cancelPassword.addEventListener('click', () => this.hidePasswordOverlay());

//         // Password form submission
//         const passwordForm = document.getElementById('password-form');
//         passwordForm.addEventListener('submit', (e) => this.handlePasswordChange(e));

//         // Close overlay when clicking outside
//         const overlay = document.getElementById('password-overlay');
//         overlay.addEventListener('click', (e) => {
//             if (e.target === overlay) {
//                 this.hidePasswordOverlay();
//             }
//         });

//         // Real-time password validation
//         const newPasswordInput = document.getElementById('newPassword');
//         const confirmPasswordInput = document.getElementById('confirmPassword');
//         confirmPasswordInput.addEventListener('input', () => this.validatePasswordMatch());
//         newPasswordInput.addEventListener('input', () => this.validatePasswordMatch());

//         // Handle marital status change for anniversary field
//         const maritalStatusSelect = document.getElementById('maritalStatus');
//         maritalStatusSelect.addEventListener('change', () => this.handleMaritalStatusChange());

//         // Setup event listeners for shipping address functionality
//         const addShippingAddressBtn = document.getElementById('add-shipping-address-btn');
//         const editShippingAddressBtn = document.getElementById('edit-shipping-address-btn');
//         const cancelShippingAddressBtn = document.getElementById('cancel-shipping-address-btn');
//         const shippingAddressForm = document.getElementById('shipping-address-form');

//         addShippingAddressBtn.addEventListener('click', () => this.openShippingAddressOverlay(false));
//         editShippingAddressBtn.addEventListener('click', () => this.openShippingAddressOverlay(true));
//         cancelShippingAddressBtn.addEventListener('click', () => this.closeShippingAddressOverlay());
//         shippingAddressForm.addEventListener('submit', (e) => this.handleShippingAddressSubmit(e));
//     }

//     /**
//      * Create and store combined payload in localStorage
//      */
//     storeCombinedPayload(userData, shippingAddress) {
//         // Only store if both userData and shippingAddress are valid and non-empty
//         if (!userData || !shippingAddress) {
//             console.log('Combined payload not stored: Missing user or shipping data');
//             return;
//         }

//         // Check if all required fields have valid values
//         const requiredFields = [
//             'customerFirstName', 'customerLastName', 'email', 'mobile',
//             'customerPhone', 'customerEmail', 'shippingAddress', 'shippingCity',
//             'shippingState', 'shippingPincode', 'shippingCountry'
//         ];

//         const hasAllRequiredFields = requiredFields.every(field => 
//             userData[field] || shippingAddress[field]
//         );

//         if (!hasAllRequiredFields) {
//             console.log('Combined payload not stored: Missing required fields');
//             return;
//         }

//         // Create combined payload
//         const combinedPayload = {
//             userId: userData.userId,
//             customerFirstName: userData.customerFirstName,
//             customerLastName: userData.customerLastName,
//             customerPhone: shippingAddress.customerPhone,
//             customerEmail: shippingAddress.customerEmail,
//             shippingAddress: shippingAddress.shippingAddress,
//             shippingCity: shippingAddress.shippingCity,
//             shippingState: shippingAddress.shippingState,
//             shippingPincode: shippingAddress.shippingPincode,
//             shippingCountry: shippingAddress.shippingCountry,
//             shippingIsBilling: false,
//             billingCustomerName: userData.customerFirstName,
//             billingLastName: userData.customerLastName,
//             billingAddress: shippingAddress.shippingAddress,
//             billingCity: shippingAddress.shippingCity,
//             billingState: shippingAddress.shippingState,
//             billingPincode: shippingAddress.shippingPincode,
//             billingCountry: shippingAddress.shippingCountry,
//             billingEmail: shippingAddress.customerEmail,
//             billingPhone: shippingAddress.customerPhone
//         };

//         try {
//             localStorage.setItem('userProfileData', JSON.stringify(combinedPayload));
//             console.log('Combined payload successfully stored in localStorage:', combinedPayload);
//         } catch (error) {
//             console.error('Error storing combined payload in localStorage:', error);
//             this.showNotification('Failed to store profile data locally', 'error');
//         }
//     }

//     /**
//      * Load user profile and shipping address, then store combined payload
//      */
//     async loadUserProfileAndStoreCombinedPayload() {
//         try {
//             this.showLoading(true);

//             // Fetch user profile data
//             const userResponse = await fetch(`${this.API_BASE_URL}/${this.currentUser.userId}`, {
//                 method: 'GET',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 }
//             });

//             if (!userResponse.ok) {
//                 const errorData = await userResponse.json();
//                 this.showNotification(errorData.message || 'Failed to load profile data', 'error');
//                 return;
//             }

//             const userData = await userResponse.json();
//             this.populateProfileForm(userData);
//             this.originalUserData = { ...userData };
//             this.showNotification('Profile loaded successfully', 'success');

//             // Fetch shipping address data
//             const addressResponse = await fetch(`${this.API_ADDRESS_URL}/get-address-by-userId/${this.currentUser.userId}`, {
//                 method: 'GET',
//                 headers: { 'Content-Type': 'application/json' }
//             });

//             if (addressResponse.ok) {
//                 const addresses = await addressResponse.json();
//                 const addButton = document.getElementById('add-shipping-address-btn');
//                 const container = document.getElementById('shipping-address-container');

//                 if (addresses.length > 0) {
//                     this.shippingAddress = addresses[0];
//                     this.displayShippingAddress();
//                     addButton.style.display = 'none';
//                     container.style.display = 'block';
//                     // Store combined payload with user and shipping data
//                     this.storeCombinedPayload(userData, this.shippingAddress);
//                 } else {
//                     addButton.textContent = 'Add Shipping Address';
//                     addButton.style.display = 'inline-block';
//                     container.style.display = 'none';
//                     console.log('No shipping address found, combined payload not stored');
//                 }
//             } else {
//                 this.showNotification('Failed to load shipping address', 'error');
//                 console.log('No shipping address found, combined payload not stored');
//             }
//         } catch (error) {
//             console.error('Error loading profile or shipping address:', error);
//             this.showNotification('Network error while loading profile data', 'error');
//         } finally {
//             this.showLoading(false);
//         }
//     }

//     /**
//      * Load shipping address data from API
//      */
//     async loadShippingAddress() {
//         try {
//             this.showLoading(true);
//             const response = await fetch(`${this.API_ADDRESS_URL}/get-address-by-userId/${this.currentUser.userId}`, {
//                 method: 'GET',
//                 headers: { 'Content-Type': 'application/json' }
//             });

//             if (response.ok) {
//                 const addresses = await response.json();
//                 const addButton = document.getElementById('add-shipping-address-btn');
//                 const container = document.getElementById('shipping-address-container');

//                 if (addresses.length > 0) {
//                     this.shippingAddress = addresses[0];
//                     this.displayShippingAddress();
//                     addButton.style.display = 'none';
//                     container.style.display = 'block';
//                     // Update combined payload when shipping address is updated
//                     if (this.originalUserData) {
//                         this.storeCombinedPayload(this.originalUserData, this.shippingAddress);
//                     }
//                 } else {
//                     addButton.textContent = 'Add Shipping Address';
//                     addButton.style.display = 'inline-block';
//                     container.style.display = 'none';
//                     console.log('No shipping address found, combined payload not stored');
//                 }
//             } else {
//                 this.showNotification('Failed to load shipping address', 'error');
//             }
//         } catch (error) {
//             console.error('Error loading shipping address:', error);
//             this.showNotification('Network error while loading shipping address', 'error');
//         } finally {
//             this.showLoading(false);
//         }
//     }

//     /**
//      * Display shipping address in the rectangular container
//      */
//     displayShippingAddress() {
//         const addressText = document.getElementById('shipping-address-text');
//         const address = this.shippingAddress;
//         addressText.textContent = `${address.shippingAddress}, ${address.shippingCity}, ${address.shippingState}, ${address.shippingPincode}, ${address.shippingCountry} | Phone: ${address.customerPhone} | Email: ${address.customerEmail}`;
//     }

//     /**
//      * Open the overlay form for adding/editing shipping address
//      */
//     openShippingAddressOverlay(isEditing) {
//         this.isEditingAddress = isEditing;
//         const overlay = document.getElementById('shipping-address-overlay');
//         const form = document.getElementById('shipping-address-form');
//         const title = document.getElementById('overlay-title');
        
//         title.textContent = isEditing ? 'Edit Shipping Address' : 'Add Shipping Address';
        
//         if (isEditing && this.shippingAddress) {
//             document.getElementById('shipping-customer-phone').value = this.shippingAddress.customerPhone || '';
//             document.getElementById('shipping-customer-email').value = this.shippingAddress.customerEmail || '';
//             document.getElementById('shipping-address').value = this.shippingAddress.shippingAddress || '';
//             document.getElementById('shipping-city').value = this.shippingAddress.shippingCity || '';
//             document.getElementById('shipping-state').value = this.shippingAddress.shippingState || '';
//             document.getElementById('shipping-pincode').value = this.shippingAddress.shippingPincode || '';
//             document.getElementById('shipping-country').value = this.shippingAddress.shippingCountry || '';
//         } else {
//             form.reset();
//         }
        
//         overlay.style.display = 'flex';
//         overlay.classList.add('show');
//     }

//     /**
//      * Close the shipping address overlay form
//      */
//     closeShippingAddressOverlay() {
//         const overlay = document.getElementById('shipping-address-overlay');
//         overlay.style.display = 'none';
//         overlay.classList.remove('show');
//         document.getElementById('shipping-address-form').reset();
//     }

//     /**
//      * Handle form submission for adding/editing shipping address
//      */
//     async handleShippingAddressSubmit(event) {
//         event.preventDefault();
//         const form = event.target;
//         const payload = {
//             customerPhone: form.customerPhone.value,
//             customerEmail: form.customerEmail.value,
//             shippingAddress: form.shippingAddress.value,
//             shippingCity: form.shippingCity.value,
//             shippingState: form.shippingState.value,
//             shippingPincode: form.shippingPincode.value,
//             shippingCountry: form.shippingCountry.value
//         };

//         try {
//             this.showLoading(true);
//             const url = this.isEditingAddress 
//                 ? `${this.API_ADDRESS_URL}/patch-address/${this.currentUser.userId}/${this.shippingAddress.shippingId}`
//                 : `${this.API_ADDRESS_URL}/create-address/${this.currentUser.userId}`;
//             const method = this.isEditingAddress ? 'PATCH' : 'POST';

//             const response = await fetch(url, {
//                 method: method,
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify(payload)
//             });

//             if (response.ok) {
//                 await this.loadShippingAddress();
//                 this.closeShippingAddressOverlay();
//                 this.showNotification(`Shipping address ${this.isEditingAddress ? 'updated' : 'added'} successfully`, 'success');
//             } else {
//                 const errorData = await response.json();
//                 this.showNotification(errorData.message || 'Failed to save shipping address', 'error');
//             }
//         } catch (error) {
//             console.error('Error saving shipping address:', error);
//             this.showNotification('Network error while saving shipping address', 'error');
//         } finally {
//             this.showLoading(false);
//         }
//     }

//     /**
//      * Populate the profile form with user data
//      */
//     populateProfileForm(userData) {
//         document.getElementById('customerFirstName').value = userData.customerFirstName || '';
//         document.getElementById('customerLastName').value = userData.customerLastName || '';
//         document.getElementById('email').value = userData.email || '';
//         document.getElementById('mobile').value = userData.mobile || '';
//         document.getElementById('maritalStatus').value = userData.maritalStatus || '';
        
//         document.getElementById('customerDOB').value = userData.customerDOB;
        
//         const anniversaryGroup = document.getElementById('anniversary-group');
//         const anniversaryInput = document.getElementById('anniversary');
        
//         const anniversaryDate = userData.anniversary;
//         if (anniversaryDate && userData.maritalStatus === 'Married') {
//             anniversaryInput.value = anniversaryDate;
//             anniversaryGroup.classList.remove('hidden');
//         } else {
//             anniversaryInput.value = '';
//             anniversaryGroup.classList.add('hidden');
//         }

//         this.currentUser = userData;
//         this.handleMaritalStatusChange();
//     }

//     /**
//      * Toggle edit mode
//      */
//     toggleEditMode(enable) {
//         this.isEditMode = enable;
//         const editableFields = ['customerFirstName', 'customerLastName', 'mobile', 'maritalStatus', 'customerDOB', 'anniversary'];
//         const editBtn = document.getElementById('edit-profile-btn');
//         const saveBtn = document.getElementById('save-profile-btn');
//         const cancelBtn = document.getElementById('cancel-edit-btn');

//         if (enable) {
//             editableFields.forEach(fieldId => {
//                 const field = document.getElementById(fieldId);
//                 if (field) {
//                     if (field.type === 'select-one') {
//                         field.disabled = false;
//                     } else {
//                         field.readOnly = false;
//                     }
//                     field.classList.add('editable');
//                 }
//             });

//             editBtn.style.display = 'none';
//             saveBtn.style.display = 'inline-block';
//             cancelBtn.style.display = 'inline-block';
//         } else {
//             editableFields.forEach(fieldId => {
//                 const field = document.getElementById(fieldId);
//                 if (field) {
//                     if (field.type === 'select-one') {
//                         field.disabled = true;
//                     } else {
//                         field.readOnly = true;
//                     }
//                     field.classList.remove('editable');
//                 }
//             });

//             editBtn.style.display = 'inline-block';
//             saveBtn.style.display = 'none';
//             cancelBtn.style.display = 'none';
//         }
//     }

//     /**
//      * Handle marital status change to show/hide anniversary field
//      */
//     handleMaritalStatusChange() {
//         const maritalStatus = document.getElementById('maritalStatus').value;
//         const anniversaryGroup = document.getElementById('anniversary-group');

//         if (maritalStatus === 'Married') {
//             anniversaryGroup.style.display = 'block';
//         } else {
//             anniversaryGroup.style.display = 'none';
//             if (this.isEditMode) {
//                 document.getElementById('anniversary').value = '';
//             }
//         }
//     }

//     /**
//      * Save profile changes
//      */
//     async saveProfileChanges() {
//         try {
//             const formData = this.getFormData();
//             if (!this.validateFormData(formData)) {
//                 return;
//             }

//             this.showLoading(true);
//             const response = await fetch(`${this.API_BASE_URL}/update/${this.currentUser.userId}`, {
//                 method: 'PATCH',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify(formData)
//             });

//             if (response.ok) {
//                 const updatedData = await response.json();
//                 this.currentUser = updatedData;
//                 this.originalUserData = { ...updatedData };
//                 this.toggleEditMode(false);
//                 this.showNotification('Profile updated successfully', 'success');
//                 // Update combined payload after profile update
//                 if (this.shippingAddress) {
//                     this.storeCombinedPayload(updatedData, this.shippingAddress);
//                 }
//             } else {
//                 const errorData = await response.json();
//                 this.showNotification(errorData.message || 'Failed to update profile', 'error');
//             }
//         } catch (error) {
//             console.error('Error updating profile:', error);
//             this.showNotification('Network error while updating profile', 'error');
//         } finally {
//             this.showLoading(false);
//         }
//     }

//     /**
//      * Cancel edit and restore original data
//      */
//     cancelEdit() {
//         if (this.originalUserData) {
//             this.populateProfileForm(this.originalUserData);
//         }
//         this.toggleEditMode(false);
//         this.showNotification('Changes cancelled', 'info');
//     }

//     /**
//      * Get form data
//      */
//     getFormData() {
//         const maritalStatus = document.getElementById('maritalStatus').value;
//         return {
//             customerFirstName: document.getElementById('customerFirstName').value.trim(),
//             customerLastName: document.getElementById('customerLastName').value.trim(),
//             email: document.getElementById('email').value.trim(),
//             mobile: document.getElementById('mobile').value.trim(),
//             maritalStatus: maritalStatus,
//             customerDOB: document.getElementById('customerDOB').value,
//             anniversary: maritalStatus === 'Married' ? document.getElementById('anniversary').value : null,
//         };
//     }

//     /**
//      * Validate form data
//      */
//     validateFormData(formData) {
//         if (!formData.customerFirstName) {
//             this.showNotification('First name is required', 'warning');
//             document.getElementById('customerFirstName').focus();
//             return false;
//         }

//         if (!formData.customerLastName) {
//             this.showNotification('Last name is required', 'warning');
//             document.getElementById('customerLastName').focus();
//             return false;
//         }

//         if (!formData.mobile) {
//             this.showNotification('Mobile number is required', 'warning');
//             document.getElementById('mobile').focus();
//             return false;
//         }

//         const mobileRegex = /^[0-9+\-\s()]+$/;
//         if (!mobileRegex.test(formData.mobile)) {
//             this.showNotification('Please enter a valid mobile number', 'warning');
//             document.getElementById('mobile').focus();
//             return false;
//         }

//         if (!formData.customerDOB) {
//             this.showNotification('Date of birth is required', 'warning');
//             document.getElementById('customerDOB').focus();
//             return false;
//         }

//         if (formData.maritalStatus === 'Married' && !formData.anniversary) {
//             this.showNotification('Anniversary date is required for married status', 'warning');
//             document.getElementById('anniversary').focus();
//             return false;
//         }

//         return true;
//     }

//     /**
//      * Show password change overlay
//      */
//     showPasswordOverlay() {
//         const overlay = document.getElementById('password-overlay');
//         overlay.classList.add('show');
//         document.getElementById('password-form').reset();
//         setTimeout(() => {
//             document.getElementById('oldPassword').focus();
//         }, 300);
//     }

//     /**
//      * Hide password change overlay
//      */
//     hidePasswordOverlay() {
//         const overlay = document.getElementById('password-overlay');
//         overlay.classList.remove('show');
//         document.getElementById('password-form').reset();
//     }

//     /**
//      * Handle password change form submission
//      */
//     async handlePasswordChange(event) {
//         event.preventDefault();
//         const oldPassword = document.getElementById('oldPassword').value;
//         const newPassword = document.getElementById('newPassword').value;
//         const confirmPassword = document.getElementById('confirmPassword').value;

//         if (!oldPassword || !newPassword || !confirmPassword) {
//             this.showNotification('Please fill in all password fields', 'warning');
//             return;
//         }

//         if (newPassword !== confirmPassword) {
//             this.showNotification('New passwords do not match', 'error');
//             return;
//         }

//         if (newPassword.length < 4) {
//             this.showNotification('New password must be at least 4 characters long', 'warning');
//             return;
//         }

//         if (oldPassword === newPassword) {
//             this.showNotification('New password must be different from old password', 'warning');
//             return;
//         }

//         try {
//             this.showLoading(true);
//             const changePasswordUrl = `${this.API_BASE_URL}/change-password/${this.currentUser.userId}?oldPassword=${encodeURIComponent(oldPassword)}&newPassword=${encodeURIComponent(newPassword)}`;
//             const response = await fetch(changePasswordUrl, {
//                 method: 'PATCH',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 }
//             });

//             if (response.ok) {
//                 this.showNotification('Password changed successfully', 'success');
//                 this.hidePasswordOverlay();
//             } else {
//                 const errorData = await response.json();
//                 if (errorData.message && errorData.message.toLowerCase().includes('old password')) {
//                     this.showNotification('Old password is incorrect', 'error');
//                 } else {
//                     this.showNotification(errorData.message || 'Failed to change password', 'error');
//                 }
//             }
//         } catch (error) {
//             console.error('Error changing password:', error);
//             this.showNotification('Network error while changing password', 'error');
//         } finally {
//             this.showLoading(false);
//         }
//     }

//     /**
//      * Validate password match in real-time
//      */
//     validatePasswordMatch() {
//         const newPassword = document.getElementById('newPassword').value;
//         const confirmPassword = document.getElementById('confirmPassword').value;
//         const confirmInput = document.getElementById('confirmPassword');

//         if (confirmPassword && newPassword !== confirmPassword) {
//             confirmInput.style.borderColor = '#f44336';
//             confirmInput.style.backgroundColor = '#ffebee';
//         } else if (confirmPassword) {
//             confirmInput.style.borderColor = '#4CAF50';
//             confirmInput.style.backgroundColor = '#e8f5e8';
//         } else {
//             confirmInput.style.borderColor = '#e0e0e0';
//             confirmInput.style.backgroundColor = '#f8f9fa';
//         }
//     }

//     /**
//      * Show/hide loading spinner
//      */
//     showLoading(show) {
//         const loadingSpinner = document.getElementById('loading-spinner');
//         if (show) {
//             loadingSpinner.classList.add('show');
//         } else {
//             loadingSpinner.classList.remove('show');
//         }
//     }

//     /**
//      * Show notification popup
//      */
//     showNotification(message, type = 'info', duration = 5000) {
//         const container = document.getElementById('notification-container');
//         const notification = document.createElement('div');
//         notification.className = `notification ${type}`;
//         notification.innerHTML = `
//             ${message}
//             <button class="close-notification" onclick="this.parentElement.remove()">×</button>
//         `;
//         container.appendChild(notification);
//         setTimeout(() => {
//             if (notification.parentElement) {
//                 notification.style.transform = 'translateX(100%)';
//                 notification.style.opacity = '0';
//                 setTimeout(() => {
//                     if (notification.parentElement) {
//                         notification.remove();
//                     }
//                 }, 300);
//             }
//         }, duration);
//     }

//     /**
//      * Extend user session on activity
//      */
//     extendSession() {
//         if (window.userAPI) {
//             window.userAPI.extendSession();
//         }
//     }
// }

// // Initialize when DOM is loaded
// document.addEventListener('DOMContentLoaded', () => {
//     window.userProfile = new UserProfile();
// });

// // Extend session on user activity
// document.addEventListener('click', () => {
//     if (window.userProfile) {
//         window.userProfile.extendSession();
//     }
// });

// // Handle page visibility change
// document.addEventListener('visibilitychange', () => {
//     if (!document.hidden && window.userProfile && window.userAPI) {
//         if (!window.userAPI.isLoggedIn()) {
//             window.userProfile.showNotification('Session expired. Please log in again.', 'warning');
//             setTimeout(() => {
//                 window.location.href = 'login.html';
//             }, 2000);
//         }
//     }
// });