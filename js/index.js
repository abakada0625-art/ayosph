/**
 * AyosPH - Landing Page Module
 * Handles landing page interactions
 */

document.addEventListener('DOMContentLoaded', () => {
    initializeLandingPage();
});

/**
 * Initialize landing page
 */
function initializeLandingPage() {
    setupNavigation();
    setupScrollAnimations();
    setupMobileNav();
}

/**
 * Setup navigation
 */
function setupNavigation() {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href === '#') {
                e.preventDefault();
                return;
            }

            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
                
                // Close mobile menu
                const mobileMenu = document.querySelector('.nav-links');
                if (mobileMenu) {
                    mobileMenu.style.display = 'none';
                }
            }
        });
    });
}

/**
 * Setup scroll animations
 */
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.feature-card, .step, .stat-card, .about-visual').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.6s ease-in-out';
        observer.observe(el);
    });
}

/**
 * Setup mobile navigation
 */
function setupMobileNav() {
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            if (navLinks.style.display === 'flex') {
                navLinks.style.display = 'none';
            } else {
                navLinks.style.display = 'flex';
                navLinks.style.position = 'absolute';
                navLinks.style.top = '100%';
                navLinks.style.left = '0';
                navLinks.style.right = '0';
                navLinks.style.backgroundColor = 'var(--color-bg)';
                navLinks.style.flexDirection = 'column';
                navLinks.style.borderTop = '1px solid var(--color-border)';
                navLinks.style.padding = 'var(--spacing-lg)';
                navLinks.style.gap = 'var(--spacing-md)';
                navLinks.style.zIndex = 'var(--z-dropdown)';
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.navbar')) {
                navLinks.style.display = 'none';
            }
        });
    }
}
