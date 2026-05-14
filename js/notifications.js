/**
 * AyosPH - Notifications Module
 * Handles real-time notifications via Supabase Realtime
 */

class NotificationManager {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.pollingInterval = null;
        this.realtimeChannel = null;
    }

    /**
     * Initialize notification system
     */
    async init() {
        await this.loadNotifications();
        this.setupRealtimeSubscription();
        this.setupEventListeners();
        this.startPolling(); // Fallback polling every 30s
    }

    /**
     * Load notifications from Supabase
     */
    async loadNotifications() {
        try {
            const user = getCurrentUser();
            if (!user) return;

            // In production: fetch from Supabase
            // const data = await supabase.get('notifications', `user_id=eq.${user.id}&order=created_at.desc&limit=20`);

            // Demo: use mock notifications
            this.notifications = this.getMockNotifications();
            this.unreadCount = this.notifications.filter(n => !n.is_read).length;
            this.updateUI();
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    /**
     * Setup Supabase Realtime subscription
     */
    setupRealtimeSubscription() {
        // In production, subscribe to realtime changes
        // This uses Supabase Realtime WebSocket subscription
        try {
            const user = getCurrentUser();
            if (!user || !window.supabase?.from) return;

            // Example of how to set up realtime with Supabase official SDK:
            // this.realtimeChannel = supabase
            //     .channel('notifications')
            //     .on('postgres_changes', {
            //         event: 'INSERT',
            //         schema: 'public',
            //         table: 'notifications',
            //         filter: `user_id=eq.${user.id}`
            //     }, (payload) => {
            //         this.handleNewNotification(payload.new);
            //     })
            //     .subscribe();

            console.log('📡 Realtime subscription configured');
        } catch (error) {
            console.warn('Realtime subscription failed, using polling:', error);
        }
    }

    /**
     * Handle new incoming notification
     */
    handleNewNotification(notification) {
        this.notifications.unshift(notification);
        this.unreadCount++;
        this.updateUI();
        this.showDesktopNotification(notification);
        this.playNotificationSound();
    }

    /**
     * Start polling fallback
     */
    startPolling(interval = 30000) {
        this.pollingInterval = setInterval(() => {
            this.loadNotifications();
        }, interval);
    }

    /**
     * Stop polling
     */
    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId) {
        try {
            const notification = this.notifications.find(n => n.id === notificationId);
            if (!notification || notification.is_read) return;

            notification.is_read = true;
            this.unreadCount = Math.max(0, this.unreadCount - 1);
            this.updateUI();

            // In production: update in Supabase
            // await supabase.patch('notifications', notificationId, { is_read: true });
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead() {
        try {
            this.notifications.forEach(n => n.is_read = true);
            this.unreadCount = 0;
            this.updateUI();

            // In production: update all in Supabase
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    }

    /**
     * Delete notification
     */
    async deleteNotification(notificationId) {
        try {
            const index = this.notifications.findIndex(n => n.id === notificationId);
            if (index === -1) return;

            if (!this.notifications[index].is_read) {
                this.unreadCount = Math.max(0, this.unreadCount - 1);
            }

            this.notifications.splice(index, 1);
            this.updateUI();

            // In production: delete from Supabase
            // await supabase.delete('notifications', notificationId);
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    }

    /**
     * Update UI elements
     */
    updateUI() {
        this.updateBadge();
        this.updateDropdown();
    }

    /**
     * Update notification badge count
     */
    updateBadge() {
        const badge = document.getElementById('notificationBadge');
        if (!badge) return;

        if (this.unreadCount > 0) {
            badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }

    /**
     * Update notification dropdown content
     */
    updateDropdown() {
        const container = document.getElementById('notificationList');
        if (!container) return;

        if (this.notifications.length === 0) {
            container.innerHTML = `
                <div class="notification-empty">
                    <div class="notification-empty-icon">🔔</div>
                    <p>No notifications yet</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            ${this.unreadCount > 0 ? `
                <div class="notification-actions">
                    <button class="btn-text" onclick="notificationManager.markAllAsRead()">Mark all as read</button>
                </div>
            ` : ''}
            ${this.notifications.slice(0, 10).map(notification => `
                <div class="notification-item ${notification.is_read ? '' : 'unread'}" 
                     onclick="notificationManager.handleNotificationClick('${notification.id}', '${notification.link || ''}')">
                    <div class="notification-icon">${this.getNotificationIcon(notification.type)}</div>
                    <div class="notification-content">
                        <div class="notification-item-title">${this.escapeHtml(notification.title)}</div>
                        <div class="notification-item-text">${this.escapeHtml(notification.message)}</div>
                        <div class="notification-item-time">${formatTimeAgo(notification.created_at)}</div>
                    </div>
                    ${!notification.is_read ? '<div class="notification-dot"></div>' : ''}
                </div>
            `).join('')}
            ${this.notifications.length > 10 ? `
                <div class="notification-footer">
                    <a href="#" onclick="notificationManager.viewAll()">View all ${this.notifications.length} notifications</a>
                </div>
            ` : ''}
        `;
    }

    /**
     * Handle notification click
     */
    handleNotificationClick(notificationId, link) {
        this.markAsRead(notificationId);

        if (link) {
            window.location.href = link;
        }
    }

    /**
     * Get notification icon based on type
     */
    getNotificationIcon(type) {
        const icons = {
            'status_update': '📋',
            'comment': '💬',
            'assignment': '👤',
            'system': '⚙️'
        };
        return icons[type] || '🔔';
    }

    /**
     * Show browser desktop notification
     */
    async showDesktopNotification(notification) {
        if (!('Notification' in window)) return;

        if (Notification.permission === 'default') {
            await Notification.requestPermission();
        }

        if (Notification.permission === 'granted') {
            const desktopNotification = new Notification(notification.title, {
                body: notification.message,
                icon: '/assets/icons/icon-192.png',
                badge: '/assets/icons/badge.png',
                tag: notification.id
            });

            desktopNotification.onclick = () => {
                window.focus();
                if (notification.link) {
                    window.location.href = notification.link;
                }
                desktopNotification.close();
            };

            setTimeout(() => desktopNotification.close(), 5000);
        }
    }

    /**
     * Play notification sound
     */
    playNotificationSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            // Audio not available
        }
    }

    /**
     * Request notification permission
     */
    async requestPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                showSuccess('Notifications enabled!');
            }
        }
    }

    /**
     * View all notifications
     */
    viewAll() {
        // Navigate to notifications page or open full-screen modal
        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown) dropdown.classList.remove('active');

        showToast('View all notifications — coming soon!', 'info');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Toggle dropdown
        const notificationBtn = document.getElementById('notificationBtn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const dropdown = document.getElementById('notificationDropdown');
                const profileDropdown = document.getElementById('profileDropdown');

                if (dropdown) {
                    const isOpen = dropdown.classList.contains('active');
                    profileDropdown?.classList.remove('active');
                    dropdown.classList.toggle('active');

                    // Mark visible as read after 2s
                    if (!isOpen) {
                        setTimeout(() => {
                            this.notifications
                                .filter(n => !n.is_read)
                                .slice(0, 5)
                                .forEach(n => this.markAsRead(n.id));
                        }, 2000);
                    }
                }
            });
        }

        // Profile dropdown
        const profileBtn = document.getElementById('profileBtn');
        if (profileBtn) {
            profileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const dropdown = document.getElementById('profileDropdown');
                const notificationDropdown = document.getElementById('notificationDropdown');

                notificationDropdown?.classList.remove('active');
                dropdown?.classList.toggle('active');
            });
        }

        // Close dropdowns on outside click
        document.addEventListener('click', () => {
            document.getElementById('notificationDropdown')?.classList.remove('active');
            document.getElementById('profileDropdown')?.classList.remove('active');
        });

        // Setup user info in header
        this.populateUserInfo();
    }

    /**
     * Populate user info in header
     */
    populateUserInfo() {
        const user = getCurrentUser();
        if (!user) return;

        const profileDropdown = document.getElementById('profileDropdown');
        if (profileDropdown) {
            const header = profileDropdown.querySelector('.dropdown-header');
            if (header) {
                header.innerHTML = `
                    <div class="profile-info">
                        <div class="profile-name">${user.full_name || user.email || 'User'}</div>
                        <div class="profile-role">${user.role || 'Resident'}</div>
                    </div>
                `;
            }
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    }

    /**
     * Create mock notifications for demo
     */
    getMockNotifications() {
        return [
            {
                id: generateUUID(),
                title: 'Report Status Updated',
                message: 'Your road issue report is now "In Progress"',
                type: 'status_update',
                is_read: false,
                link: '#',
                created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
            },
            {
                id: generateUUID(),
                title: 'New Comment',
                message: 'An admin replied to your garbage report',
                type: 'comment',
                is_read: false,
                link: '#',
                created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
            },
            {
                id: generateUUID(),
                title: 'Issue Resolved',
                message: 'Your street light report has been marked as Fixed!',
                type: 'status_update',
                is_read: true,
                link: '#',
                created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: generateUUID(),
                title: 'Welcome to AyosPH',
                message: 'Your account is ready. Start reporting community issues!',
                type: 'system',
                is_read: true,
                link: '#',
                created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];
    }

    /**
     * Destroy and clean up
     */
    destroy() {
        this.stopPolling();
        if (this.realtimeChannel) {
            this.realtimeChannel.unsubscribe();
        }
    }
}

/**
 * Factory: create notification for a report status change
 */
async function createStatusNotification(reportId, reporterId, oldStatus, newStatus, adminName) {
    const notification = {
        user_id: reporterId,
        report_id: reportId,
        title: 'Report Status Updated',
        message: `Your report status changed from "${oldStatus}" to "${newStatus}" by ${adminName}`,
        type: 'status_update',
        is_read: false,
        link: `dashboard.html#report-${reportId}`,
        created_at: new Date().toISOString()
    };

    // In production: save to Supabase
    // await supabase.post('notifications', notification);

    return notification;
}

/**
 * Factory: create comment notification
 */
async function createCommentNotification(reportId, targetUserId, commenterName, commentPreview) {
    const notification = {
        user_id: targetUserId,
        report_id: reportId,
        title: 'New Comment on Your Report',
        message: `${commenterName} commented: "${commentPreview.substring(0, 60)}..."`,
        type: 'comment',
        is_read: false,
        link: `dashboard.html#report-${reportId}`,
        created_at: new Date().toISOString()
    };

    return notification;
}

// Instantiate and initialize notification manager
const notificationManager = new NotificationManager();

document.addEventListener('DOMContentLoaded', () => {
    if (supabase.isAuthenticated()) {
        notificationManager.init();
    }
});
