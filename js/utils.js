/**
 * AyosPH - Utility Functions
 * Common helper functions used across the application
 */

/**
 * Display toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Display duration in ms
 */
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.getElementById('toast');
    if (!toast) {
        console.warn('Toast element not found');
        return;
    }

    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

/**
 * Show error message
 */
function showError(message) {
    showToast(message, 'error', 4000);
}

/**
 * Show success message
 */
function showSuccess(message) {
    showToast(message, 'success', 3000);
}

/**
 * Show loading state on button
 */
function setButtonLoading(button, isLoading = true) {
    if (!button) return;

    if (isLoading) {
        button.disabled = true;
        button.classList.add('loading');
    } else {
        button.disabled = false;
        button.classList.remove('loading');
    }
}

/**
 * Format date to readable format
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 */
function formatDate(date) {
    if (!date) return '';

    const d = new Date(date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/**
 * Format date and time
 */
function formatDateTime(date) {
    if (!date) return '';

    const d = new Date(date);
    const dateStr = formatDate(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${dateStr} ${hours}:${minutes}`;
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
function formatTimeAgo(date) {
    if (!date) return '';

    const d = new Date(date);
    const now = new Date();
    const seconds = Math.floor((now - d) / 1000);

    if (seconds < 60) return 'just now';
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    
    return formatDate(date);
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Validate phone number
 */
function isValidPhone(phone) {
    const re = /^[\d\s+\-()]+$/;
    return re.length >= 10 && re.test(phone);
}

/**
 * Get user from localStorage
 */
function getCurrentUser() {
    const session = supabase.getSession();
    if (!session) return null;

    const user = localStorage.getItem('ayosph_user');
    return user ? JSON.parse(user) : null;
}

/**
 * Store user in localStorage
 */
function setCurrentUser(user) {
    if (user) {
        localStorage.setItem('ayosph_user', JSON.stringify(user));
    } else {
        localStorage.removeItem('ayosph_user');
    }
}

/**
 * Check if current user is admin
 */
function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
}

/**
 * Check if current user is resident
 */
function isResident() {
    const user = getCurrentUser();
    return user && user.role === 'resident';
}

/**
 * Redirect to login if not authenticated
 */
function requireAuth(redirectAfterLogin = null) {
    if (!supabase.isAuthenticated()) {
        const redirect = redirectAfterLogin ? `?redirect=${redirectAfterLogin}` : '';
        window.location.href = `login.html${redirect}`;
        return false;
    }
    return true;
}

/**
 * Redirect to admin if not admin
 */
function requireAdmin() {
    if (!requireAuth()) return false;
    
    if (!isAdmin()) {
        showError('Access denied. Admin role required.');
        window.location.href = 'dashboard.html';
        return false;
    }
    return true;
}

/**
 * Compress image before upload
 */
function compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) {
    return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions
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

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(resolve, 'image/jpeg', quality);
            };

            img.src = e.target.result;
        };

        reader.readAsDataURL(file);
    });
}

/**
 * Get file size in readable format
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validate file size
 */
function isValidFileSize(file, maxSizeMB = 10) {
    return file.size <= maxSizeMB * 1024 * 1024;
}

/**
 * Validate file type
 */
function isValidImageFile(file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    return validTypes.includes(file.type);
}

/**
 * Generate UUID v4
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

/**
 * Deep clone object
 */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Debounce function
 */
function debounce(func, delay = 300) {
    let timeoutId;

    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

/**
 * Throttle function
 */
function throttle(func, limit = 300) {
    let lastFunc;
    let lastRan;

    return function (...args) {
        if (!lastRan) {
            func(...args);
            lastRan = Date.now();
        } else {
            clearTimeout(lastFunc);
            lastFunc = setTimeout(function () {
                if ((Date.now() - lastRan) >= limit) {
                    func(...args);
                    lastRan = Date.now();
                }
            }, limit - (Date.now() - lastRan));
        }
    };
}

/**
 * Get query parameter
 */
function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

/**
 * Set query parameter in URL
 */
function setQueryParam(name, value) {
    const params = new URLSearchParams(window.location.search);
    params.set(name, value);
    window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
}

/**
 * Close all dropdowns
 */
function closeAllDropdowns() {
    document.querySelectorAll('.notification-dropdown, .profile-dropdown').forEach(el => {
        el.classList.remove('active');
    });
}

/**
 * Close modal
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * Open modal
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

/**
 * Get status badge color
 */
function getStatusColor(status) {
    const colors = {
        'Pending': '#f39c12',
        'Under Review': '#3498db',
        'In Progress': '#2ecc71',
        'Fixed': '#2ecc71',
        'Rejected': '#e74c3c'
    };
    return colors[status] || '#95a5a6';
}

/**
 * Get severity color
 */
function getSeverityColor(severity) {
    const colors = {
        'Low': '#3498db',
        'Medium': '#f39c12',
        'High': '#e67e22',
        'Emergency': '#e74c3c'
    };
    return colors[severity] || '#95a5a6';
}

/**
 * Format currency
 */
function formatCurrency(amount, currency = 'PHP') {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

/**
 * Initialize tooltips
 */
function initTooltips() {
    // Add tooltip functionality
    document.addEventListener('mouseenter', (e) => {
        if (e.target.hasAttribute('data-tooltip')) {
            // Tooltip implementation
        }
    });
}

/**
 * Add click outside listener
 */
function onClickOutside(element, callback) {
    document.addEventListener('click', (e) => {
        if (!element.contains(e.target)) {
            callback();
        }
    });
}

// All functions are globally available as plain script includes.
// No module exports needed for vanilla JS with <script> tags.
