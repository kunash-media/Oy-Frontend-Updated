class UserSessionManager {
    constructor() {
        this.loginLogoutLink = null;
        this.initialized = false;
        this.maxInitAttempts = 10;
        this.initAttempts = 0;
        this.API_BASE_URL = 'http://localhost:8080/api/users';
        this.API_ADDRESS_URL = 'http://localhost:8080/api/addresses';
        
        this.init();
    }

    async init() {
        try {
            await this.waitForDependencies();
            this.createLogoutOverlay();
            this.setupEventListeners();
            this.updateLoginLogoutUI();
            // Check login state and store profile data if logged in
            if (window.userAPI.checkLoginState()) {
                await this.storeUserProfileData();
            }
            this.initialized = true;
            console.log('UserSessionManager initialized successfully');
        } catch (error) {
            console.error('Initialization failed:', error);
            if (this.initAttempts < this.maxInitAttempts) {
                setTimeout(() => this.init(), 500);
                this.initAttempts++;
            }
        }
    }

    waitForDependencies() {
        return new Promise((resolve, reject) => {
            // Check if userAPI is available
            const checkAPI = () => {
                if (window.userAPI) {
                    return true;
                }
                return false;
            };

            // Check if DOM is ready
            const checkDOM = () => {
                const link = document.querySelector('.user-dropdown .dropdown-content a[href="/login.html"]');
                if (link) {
                    this.loginLogoutLink = link;
                    return true;
                }
                return false;
            };

            // Immediate check
            if (checkAPI() && checkDOM()) {
                resolve();
                return;
            }

            // Set up event listeners if not immediately available
            let apiReady = false;
            let domReady = false;

            const apiListener = () => {
                apiReady = true;
                if (domReady) {
                    window.removeEventListener('userAPIReady', apiListener);
                    document.removeEventListener('DOMContentLoaded', domListener);
                    resolve();
                }
            };

            const domListener = () => {
                domReady = checkDOM();
                if (apiReady && domReady) {
                    window.removeEventListener('userAPIReady', apiListener);
                    document.removeEventListener('DOMContentLoaded', domListener);
                    resolve();
                }
            };

            window.addEventListener('userAPIReady', apiListener);
            document.addEventListener('DOMContentLoaded', domListener);

            // Timeout fallback
            setTimeout(() => {
                if (!apiReady || !domReady) {
                    window.removeEventListener('userAPIReady', apiListener);
                    document.removeEventListener('DOMContentLoaded', domListener);
                    reject(new Error('Dependencies not loaded within timeout'));
                }
            }, 3000);
        });
    }

    createLogoutOverlay() {
        if (document.getElementById('logoutOverlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'logoutOverlay';
        overlay.className = 'logout-overlay';
        overlay.innerHTML = `
            <div class="logout-confirm-box">
                <p>Are you sure you want to logout?</p>
                <div class="logout-buttons">
                    <button id="confirmLogout">Yes</button>
                    <button id="cancelLogout">No</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    async storeUserProfileData() {
        try {
            const currentUser = window.userAPI.getCurrentUser();
            if (!currentUser) {
                console.log('No current user found, skipping userProfileData storage');
                return;
            }

            // Fetch user profile data
            const userResponse = await fetch(`${this.API_BASE_URL}/${currentUser.userId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!userResponse.ok) {
                console.error('Failed to fetch user profile data');
                return;
            }

            const userData = await userResponse.json();

            // Fetch shipping address data
            const addressResponse = await fetch(`${this.API_ADDRESS_URL}/get-address-by-userId/${currentUser.userId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            let shippingAddress = null;
            if (addressResponse.ok) {
                const addresses = await addressResponse.json();
                if (addresses.length > 0) {
                    shippingAddress = addresses[0];
                }
            }

            // Only store if both userData and shippingAddress are valid
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
                billingPhone: shippingAddress.customerPhone
            };

            try {
                localStorage.setItem('userProfileData', JSON.stringify(combinedPayload));
                console.log('Combined payload successfully stored in localStorage:', combinedPayload);
            } catch (error) {
                console.error('Error storing combined payload in localStorage:', error);
            }
        } catch (error) {
            console.error('Error fetching profile or shipping address for storage:', error);
        }
    }

    updateLoginLogoutUI() {
        if (!this.loginLogoutLink) return;

        const isLoggedIn = window.userAPI.checkLoginState();
        console.log('Updating UI. Logged in:', isLoggedIn);

        if (isLoggedIn) {
            this.loginLogoutLink.textContent = 'Logout';
            this.loginLogoutLink.href = '#';
            this.loginLogoutLink.onclick = (e) => {
                e.preventDefault();
                document.getElementById('logoutOverlay').style.display = 'flex';
            };
        } else {
            this.loginLogoutLink.textContent = 'Login';
            this.loginLogoutLink.href = '/login.html';
            this.loginLogoutLink.onclick = null;
        }
    }

    setupEventListeners() {
        // Logout confirmation
        document.getElementById('confirmLogout')?.addEventListener('click', () => {
            try {
                // Clear user profile data from localStorage
                localStorage.removeItem('userProfileData');
                console.log('userProfileData cleared from localStorage');

                // Perform logout
                window.userAPI.logout();

                // Dispatch custom event to notify other scripts
                const logoutEvent = new Event('userLoggedOut');
                document.dispatchEvent(logoutEvent);

                // Update UI and hide overlay
                this.updateLoginLogoutUI();
                document.getElementById('logoutOverlay').style.display = 'none';

                // Redirect to login page
                window.location.href = '/login.html';
            } catch (error) {
                console.error('Error during logout:', error);
            }
        });

        // Logout cancellation
        document.getElementById('cancelLogout')?.addEventListener('click', () => {
            document.getElementById('logoutOverlay').style.display = 'none';
        });

        // Update when storage changes (other tabs)
        window.addEventListener('storage', () => {
            this.updateLoginLogoutUI();
        });

        // Update when userAPI state changes and store profile data on login
        window.addEventListener('userAPIStateChange', async () => {
            this.updateLoginLogoutUI();
            if (window.userAPI.checkLoginState()) {
                await this.storeUserProfileData();
            }
        });
    }
}

// Initialize the session manager
document.addEventListener('DOMContentLoaded', () => {
    new UserSessionManager();
});

// Fallback initialization in case DOM is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    new UserSessionManager();
}











// class UserSessionManager {
//     constructor() {
//         this.loginLogoutLink = null;
//         this.initialized = false;
//         this.maxInitAttempts = 10;
//         this.initAttempts = 0;
        
//         this.init();
//     }

//     async init() {
//         try {
//             await this.waitForDependencies();
//             this.createLogoutOverlay();
//             this.setupEventListeners();
//             this.updateLoginLogoutUI();
//             this.initialized = true;
//             console.log('UserSessionManager initialized successfully');
//         } catch (error) {
//             console.error('Initialization failed:', error);
//             if (this.initAttempts < this.maxInitAttempts) {
//                 setTimeout(() => this.init(), 500);
//                 this.initAttempts++;
//             }
//         }
//     }

//     waitForDependencies() {
//         return new Promise((resolve, reject) => {
//             // Check if userAPI is available
//             const checkAPI = () => {
//                 if (window.userAPI) {
//                     resolve();
//                     return true;
//                 }
//                 return false;
//             };

//             // Check if DOM is ready
//             const checkDOM = () => {
//                 const link = document.querySelector('.user-dropdown .dropdown-content a[href="/login.html"]');
//                 if (link) {
//                     this.loginLogoutLink = link;
//                     return true;
//                 }
//                 return false;
//             };

//             // Immediate check
//             if (checkAPI() && checkDOM()) {
//                 resolve();
//                 return;
//             }

//             // Set up event listeners if not immediately available
//             let apiReady = false;
//             let domReady = false;

//             const apiListener = () => {
//                 apiReady = true;
//                 if (domReady) {
//                     window.removeEventListener('userAPIReady', apiListener);
//                     document.removeEventListener('DOMContentLoaded', domListener);
//                     resolve();
//                 }
//             };

//             const domListener = () => {
//                 domReady = checkDOM();
//                 if (apiReady && domReady) {
//                     window.removeEventListener('userAPIReady', apiListener);
//                     document.removeEventListener('DOMContentLoaded', domListener);
//                     resolve();
//                 }
//             };

//             window.addEventListener('userAPIReady', apiListener);
//             document.addEventListener('DOMContentLoaded', domListener);

//             // Timeout fallback
//             setTimeout(() => {
//                 if (!apiReady || !domReady) {
//                     window.removeEventListener('userAPIReady', apiListener);
//                     document.removeEventListener('DOMContentLoaded', domListener);
//                     reject(new Error('Dependencies not loaded within timeout'));
//                 }
//             }, 3000);
//         });
//     }

//     createLogoutOverlay() {
//         if (document.getElementById('logoutOverlay')) return;

//         const overlay = document.createElement('div');
//         overlay.id = 'logoutOverlay';
//         overlay.className = 'logout-overlay';
//         overlay.innerHTML = `
//             <div class="logout-confirm-box">
//                 <p>Are you sure you want to logout?</p>
//                 <div class="logout-buttons">
//                     <button id="confirmLogout">Yes</button>
//                     <button id="cancelLogout">No</button>
//                 </div>
//             </div>
//         `;
//         document.body.appendChild(overlay);
//     }

//     updateLoginLogoutUI() {
//         if (!this.loginLogoutLink) return;

//         const isLoggedIn = window.userAPI.checkLoginState();
//         console.log('Updating UI. Logged in:', isLoggedIn);

//         if (isLoggedIn) {
//             this.loginLogoutLink.textContent = 'Logout';
//             this.loginLogoutLink.href = '#';
//             this.loginLogoutLink.onclick = (e) => {
//                 e.preventDefault();
//                 document.getElementById('logoutOverlay').style.display = 'flex';
//             };
//         } else {
//             this.loginLogoutLink.textContent = 'Login';
//             this.loginLogoutLink.href = '/login.html';
//             this.loginLogoutLink.onclick = null;
//         }
//     }

//     setupEventListeners() {
//         // Logout confirmation
//         document.getElementById('confirmLogout')?.addEventListener('click', () => {
//             try {
//                 // Clear user profile data from localStorage
//                 localStorage.removeItem('userProfileData');
//                 console.log('userProfileData cleared from localStorage');

//                 // Perform logout
//                 window.userAPI.logout();

//                 // Dispatch custom event to notify other scripts
//                 const logoutEvent = new Event('userLoggedOut');
//                 document.dispatchEvent(logoutEvent);

//                 // Update UI and hide overlay
//                 this.updateLoginLogoutUI();
//                 document.getElementById('logoutOverlay').style.display = 'none';

//                 // Redirect to login page
//                 window.location.href = '/login.html';
//             } catch (error) {
//                 console.error('Error during logout:', error);
//             }
//         });

//         // Logout cancellation
//         document.getElementById('cancelLogout')?.addEventListener('click', () => {
//             document.getElementById('logoutOverlay').style.display = 'none';
//         });

//         // Update when storage changes (other tabs)
//         window.addEventListener('storage', () => {
//             this.updateLoginLogoutUI();
//         });

//         // Update when userAPI state changes
//         window.addEventListener('userAPIStateChange', () => {
//             this.updateLoginLogoutUI();
//         });
//     }
// }

// // Initialize the session manager
// document.addEventListener('DOMContentLoaded', () => {
//     new UserSessionManager();
// });

// // Fallback initialization in case DOM is already loaded
// if (document.readyState === 'complete' || document.readyState === 'interactive') {
//     new UserSessionManager();
// }