/**
 * AyosPH - Authentication Module
 * Handles user registration and login
 */

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm) {
        initializeLogin();
    }

    if (registerForm) {
        initializeRegister();
    }

    setupDropdowns();
});

/**
 * Initialize login functionality
 */
function initializeLogin() {
    const form = document.getElementById('loginForm');
    const emailInput = form.querySelector('#email');
    const passwordInput = form.querySelector('#password');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Validation
        if (!email || !isValidEmail(email)) {
            showError('Please enter a valid email address');
            return;
        }

        if (!password || password.length < 6) {
            showError('Password must be at least 6 characters');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        setButtonLoading(submitBtn, true);

        try {
            // Call Supabase sign in
            const response = await supabase.signIn(email, password);

            // Store user info
            const user = response.user || {};
            setCurrentUser({
                id: user.id,
                email: user.email,
                role: user.user_metadata?.role || 'resident'
            });

            showSuccess('Login successful!');

            // Redirect based on role
            setTimeout(() => {
                const redirectUrl = getQueryParam('redirect');
                if (user.user_metadata?.role === 'admin') {
                    window.location.href = redirectUrl || 'admin.html';
                } else {
                    window.location.href = redirectUrl || 'dashboard.html';
                }
            }, 500);
        } catch (error) {
            console.error('Login error:', error);
            showError(error.message || 'Login failed. Please check your credentials.');
        } finally {
            setButtonLoading(submitBtn, false);
        }
    });

    // Show/hide password on enter
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            form.dispatchEvent(new Event('submit'));
        }
    });
}

/**
 * Initialize register functionality
 */
function initializeRegister() {
    const form = document.getElementById('registerForm');
    const fullNameInput = form.querySelector('#fullName');
    const emailInput = form.querySelector('#email');
    const barangayInput = form.querySelector('#barangay');
    const contactInput = form.querySelector('#contactNumber');
    const passwordInput = form.querySelector('#password');
    const confirmInput = form.querySelector('#confirmPassword');
    const termsCheckbox = form.querySelector('#terms');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fullName = fullNameInput.value.trim();
        const email = emailInput.value.trim();
        const barangay = barangayInput.value;
        const contactNumber = contactInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmInput.value;
        const acceptedTerms = termsCheckbox.checked;

        // Validation
        let hasError = false;

        if (!fullName || fullName.length < 3) {
            showFieldError(fullNameInput, 'Full name must be at least 3 characters');
            hasError = true;
        } else {
            clearFieldError(fullNameInput);
        }

        if (!email || !isValidEmail(email)) {
            showFieldError(emailInput, 'Please enter a valid email address');
            hasError = true;
        } else {
            clearFieldError(emailInput);
        }

        if (!barangay) {
            showFieldError(barangayInput, 'Please select a barangay');
            hasError = true;
        } else {
            clearFieldError(barangayInput);
        }

        if (!contactNumber || !isValidPhone(contactNumber)) {
            showFieldError(contactInput, 'Please enter a valid contact number');
            hasError = true;
        } else {
            clearFieldError(contactInput);
        }

        if (!password || password.length < 8) {
            showFieldError(passwordInput, 'Password must be at least 8 characters');
            hasError = true;
        } else {
            clearFieldError(passwordInput);
        }

        if (password !== confirmPassword) {
            showFieldError(confirmInput, 'Passwords do not match');
            hasError = true;
        } else {
            clearFieldError(confirmInput);
        }

        if (!acceptedTerms) {
            showError('Please accept the terms and conditions');
            hasError = true;
        }

        if (hasError) return;

        const submitBtn = form.querySelector('button[type="submit"]');
        setButtonLoading(submitBtn, true);

        try {
            // Sign up with Supabase
            const response = await supabase.signUp(email, password, {
                full_name: fullName,
                barangay: barangay,
                contact_number: contactNumber,
                role: 'resident'
            });

            // Store user info
            const user = response.user || {};
            setCurrentUser({
                id: user.id,
                email: user.email,
                role: 'resident'
            });

            // Also create user profile in database
            try {
                await supabase.post('users', {
                    id: user.id,
                    full_name: fullName,
                    email: email,
                    barangay: barangay,
                    contact_number: contactNumber,
                    role: 'resident',
                    created_at: new Date().toISOString()
                });
            } catch (dbError) {
                console.warn('Profile creation note:', dbError);
            }

            showSuccess('Account created successfully!');

            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 500);
        } catch (error) {
            console.error('Registration error:', error);
            showError(error.message || 'Registration failed. Please try again.');
        } finally {
            setButtonLoading(submitBtn, false);
        }
    });
}

/**
 * Show field error
 */
function showFieldError(element, message) {
    const errorEl = element.parentElement.querySelector('.error-message');
    if (errorEl) {
        errorEl.textContent = message;
    }
    element.style.borderColor = 'var(--color-danger)';
}

/**
 * Clear field error
 */
function clearFieldError(element) {
    const errorEl = element.parentElement.querySelector('.error-message');
    if (errorEl) {
        errorEl.textContent = '';
    }
    element.style.borderColor = '';
}

/**
 * Setup dropdown menus
 */
function setupDropdowns() {
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.icon-btn')) {
            closeAllDropdowns();
        }
    });

    // Notification button
    const notificationBtn = document.getElementById('notificationBtn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const dropdown = document.getElementById('notificationDropdown');
            if (dropdown) {
                dropdown.classList.toggle('active');
            }
        });
    }

    // Profile button
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const dropdown = document.getElementById('profileDropdown');
            if (dropdown) {
                dropdown.classList.toggle('active');
            }
        });
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            try {
                await supabase.signOut();
                setCurrentUser(null);
                showSuccess('Logged out successfully');

                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 500);
            } catch (error) {
                showError('Logout failed');
                console.error(error);
            }
        });
    }
}

/**
 * Check authentication on page load for protected pages
 */
function checkAuthOnLoad() {
    const currentPage = window.location.pathname.split('/').pop();
    const publicPages = ['index.html', 'login.html', 'register.html'];

    if (!publicPages.includes(currentPage)) {
        requireAuth(currentPage);
    }
}

// Check auth on page load
document.addEventListener('DOMContentLoaded', checkAuthOnLoad);

/**
 * Simulate authentication for demo (remove in production)
 */
function setupDemoAuth() {
    // For demo purposes, create mock auth if Supabase is not configured
    if (!SUPABASE_URL.startsWith('http')) {
        console.log('📝 Demo mode: Using mock authentication');

        // Mock sign up
        const originalSignUp = supabase.signUp;
        supabase.signUp = async function (email, password, userData) {
            return {
                user: {
                    id: generateUUID(),
                    email: email,
                    user_metadata: userData
                }
            };
        };

        // Mock sign in
        const originalSignIn = supabase.signIn;
        supabase.signIn = async function (email, password) {
            // Demo: accept any email/password combination
            return {
                session: {
                    access_token: 'demo_token',
                    user: {
                        id: generateUUID(),
                        email: email,
                        user_metadata: {
                            role: email.includes('admin') ? 'admin' : 'resident'
                        }
                    }
                },
                user: {
                    id: generateUUID(),
                    email: email,
                    user_metadata: {
                        role: email.includes('admin') ? 'admin' : 'resident'
                    }
                }
            };
        };
    }
}

// Initialize demo auth
setupDemoAuth();
