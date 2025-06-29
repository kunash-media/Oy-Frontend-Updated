// user-profile/user-logout.js

class UserSessionManager {
    constructor() {
        this.loginLogoutLink = null;
        this.initialized = false;
        this.maxInitAttempts = 10;
        this.initAttempts = 0;
        
        this.init();
    }

    async init() {
        try {
            await this.waitForDependencies();
            this.createLogoutOverlay();
            this.setupEventListeners();
            this.updateLoginLogoutUI();
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
                    resolve();
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
                    <button id="confirmLogout" >Yes</button>
                    <button id="cancelLogout">No</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    updateLoginLogoutUI() {
        if (!this.loginLogoutLink) return;

        const isLoggedIn = userAPI.checkLoginState();
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
            userAPI.logout();
            this.updateLoginLogoutUI();
            document.getElementById('logoutOverlay').style.display = 'none';
            window.location.href = '/login.html';
        });

        // Logout cancellation
        document.getElementById('cancelLogout')?.addEventListener('click', () => {
            document.getElementById('logoutOverlay').style.display = 'none';
        });

        // Update when storage changes (other tabs)
        window.addEventListener('storage', () => {
            this.updateLoginLogoutUI();
        });

        // Update when userAPI state changes
        window.addEventListener('userAPIStateChange', () => {
            this.updateLoginLogoutUI();
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