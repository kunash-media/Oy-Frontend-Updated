/**
 * User API Handler
 * File: C:\Jewelry-frontend-updated\global_js\backend_apis\users.js
 * 
 * This module handles user authentication and local storage management
 * Session timeout is set to 1 hour (3600000 ms)
 * 
 */

class UserAPI {
    constructor() {
        // Session timeout: 1 hour in milliseconds
        this.SESSION_TIMEOUT = 60 * 1000; // 3600000 ms = 1 min
        this.API_BASE_URL = 'http://localhost:8080/api/users';
        this.STORAGE_KEYS = {
            USER_DATA: 'userData',
            SESSION_TIMESTAMP: 'sessionTimestamp',
            IS_LOGGED_IN: 'isLoggedIn'
        };
    }

    /**
     * Login user with mobile number and password
     * @param {string} mobile - User's mobile number
     * @param {string} password - User's password
     * @returns {Promise<Object>} - Login response with user data
     */
    async login(mobile, password) {
        try {
            // Construct login URL with query parameters
            const loginUrl = `${this.API_BASE_URL}/login?mobile=${encodeURIComponent(mobile)}&password=${encodeURIComponent(password)}`;
            
            // Make API call to login endpoint
            const response = await fetch(loginUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            // Check if login was successful
            if (response.ok) {
                const userData = await response.json();
                
                // Store user data in local storage with session management
                this.storeUserSession(userData);
                
                return {
                    success: true,
                    data: userData,
                    message: 'Login successful'
                };
            } else {
                // Handle login failure
                const errorData = await response.json();
                return {
                    success: false,
                    data: null,
                    message: errorData.message || 'Invalid credentials'
                };
            }
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                data: null,
                message: 'Network error. Please check your connection.'
            };
        }
    }

    /**
     * Store user session data in localStorage with timestamp
     * @param {Object} userData - User data received from API
     */
    storeUserSession(userData) {
        try {
            // Store user data (excluding sensitive password)
            const userDataToStore = {
                userId: userData.userId,
                customerName: userData.customerName,
                email: userData.email,
                mobile: userData.mobile,
                maritalStatus: userData.maritalStatus,
                customerDOB: userData.customerDOB,
                anniversary: userData.anniversary,
                status: userData.status
                // Note: Password is intentionally excluded for security
            };

            // Store user data in localStorage
            localStorage.setItem(this.STORAGE_KEYS.USER_DATA, JSON.stringify(userDataToStore));
            
            // Store session timestamp for expiry management
            localStorage.setItem(this.STORAGE_KEYS.SESSION_TIMESTAMP, Date.now().toString());
            
            // Set login status flag
            localStorage.setItem(this.STORAGE_KEYS.IS_LOGGED_IN, 'true');

        } catch (error) {
            console.error('Error storing user session:', error);
        }
    }

    /**
     * Get current user data from localStorage if session is valid
     * @returns {Object|null} - User data or null if session expired/invalid
     */
    getCurrentUser() {
        try {
            // Check if user is logged in
            const isLoggedIn = localStorage.getItem(this.STORAGE_KEYS.IS_LOGGED_IN);
            if (!isLoggedIn || isLoggedIn !== 'true') {
                return null;
            }

            // Check session validity
            if (!this.isSessionValid()) {
                this.logout(); // Clear expired session
                return null;
            }

            // Retrieve and return user data
            const userData = localStorage.getItem(this.STORAGE_KEYS.USER_DATA);
            return userData ? JSON.parse(userData) : null;

        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }

    /**
     * Check if current session is still valid (within 1 hour)
     * @returns {boolean} - True if session is valid, false otherwise
     */
    isSessionValid() {
        try {
            const sessionTimestamp = localStorage.getItem(this.STORAGE_KEYS.SESSION_TIMESTAMP);
            
            if (!sessionTimestamp) {
                return false;
            }

            const currentTime = Date.now();
            const sessionTime = parseInt(sessionTimestamp);
            const timeDifference = currentTime - sessionTime;

            // Check if session has expired (more than 1 hour)
            return timeDifference < this.SESSION_TIMEOUT;

        } catch (error) {
            console.error('Error checking session validity:', error);
            return false;
        }
    }

    /**
     * Check if user is currently logged in with valid session
     * @returns {boolean} - True if logged in with valid session
     */
    isLoggedIn() {
        const isLoggedIn = localStorage.getItem(this.STORAGE_KEYS.IS_LOGGED_IN);
        return isLoggedIn === 'true' && this.isSessionValid();
    }

    /**
     * Logout user and clear all session data
     */
    logout() {
        try {
            // Clear all user session data from localStorage
            localStorage.removeItem(this.STORAGE_KEYS.USER_DATA);
            localStorage.removeItem(this.STORAGE_KEYS.SESSION_TIMESTAMP);
            localStorage.removeItem(this.STORAGE_KEYS.IS_LOGGED_IN);

            console.log('User logged out successfully');
        } catch (error) {
            console.error('Error during logout:', error);
        }
    }

    /**
     * Extend current session by updating timestamp (useful for user activity)
     */
    extendSession() {
        if (this.isLoggedIn()) {
            localStorage.setItem(this.STORAGE_KEYS.SESSION_TIMESTAMP, Date.now().toString());
        }
    }

    /**
     * Get remaining session time in minutes
     * @returns {number} - Minutes remaining in session, 0 if expired
     */
    getRemainingSessionTime() {
        try {
            const sessionTimestamp = localStorage.getItem(this.STORAGE_KEYS.SESSION_TIMESTAMP);
            
            if (!sessionTimestamp) {
                return 0;
            }

            const currentTime = Date.now();
            const sessionTime = parseInt(sessionTimestamp);
            const timeDifference = currentTime - sessionTime;
            const remainingTime = this.SESSION_TIMEOUT - timeDifference;

            return remainingTime > 0 ? Math.ceil(remainingTime / (60 * 1000)) : 0;

        } catch (error) {
            console.error('Error calculating remaining session time:', error);
            return 0;
        }
    }
}

// Create and export a single instance of UserAPI
const userAPI = new UserAPI();

// Export for use in other modules (if using ES6 modules)
// export default userAPI;

// For global access in browser environment
window.userAPI = userAPI;