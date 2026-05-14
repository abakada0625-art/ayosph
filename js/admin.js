/**
 * AyosPH - Admin Dashboard Module
 * Handles admin report management, analytics, and user management
 */

let allReports = [];
let allUsers = [];
let charts = {};

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication and admin role
    requireAdmin();

    // Initialize admin dashboard
    initializeAdminDashboard();
    setupEventListeners();
    loadAdminData();
});

/**
 * Initialize admin dashboard
 */
function initializeAdminDashboard() {
    // Setup navigation
    document.querySelectorAll('[data-view]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const view = e.currentTarget.getAttribute('data-view');
            switchView(view);
        });
    });

    // Setup filters
    document.getElementById('adminStatusFilter')?.addEventListener('change', filterReports);
    document.getElementById('severityFilter')?.addEventListener('change', filterReports);
    document.getElementById('adminCategoryFilter')?.addEventListener('change', filterReports);
    document.getElementById('roleFilter')?.addEventListener('change', filterUsers);

    // Setup update report form
    const updateForm = document.getElementById('updateReportForm');
    if (updateForm) {
        updateForm.addEventListener('submit', handleUpdateReport);
    }

    // Setup status change trigger
    const statusSelect = document.getElementById('updateStatus');
    if (statusSelect) {
        statusSelect.addEventListener('change', handleStatusChange);
    }

    // Setup modal handlers
    setupModalHandlers();

    // Setup sidebar toggle for mobile
    setupSidebarToggle();
}

/**
 * Switch between views
 */
function switchView(viewName) {
    // Hide all views
    document.querySelectorAll('.view-content').forEach(view => {
        view.classList.remove('active');
    });

    // Show selected view
    const viewElement = document.getElementById(viewName + 'View');
    if (viewElement) {
        viewElement.classList.add('active');
    }

    // Update navigation
    document.querySelectorAll('[data-view]').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-view="${viewName}"]`)?.classList.add('active');

    // Load data for view
    if (viewName === 'manage-reports') {
        loadReports('manage');
    } else if (viewName === 'analytics') {
        initializeCharts();
    } else if (viewName === 'users') {
        loadUsers();
    }
}

/**
 * Load admin dashboard data
 */
async function loadAdminData() {
    try {
        // Simulate loading data (in production, fetch from Supabase)
        const mockReports = generateMockReports();
        const mockUsers = generateMockUsers();

        allReports = mockReports;
        allUsers = mockUsers;

        updateAdminStats();
        displayRecentReports();
        initializeCharts();
    } catch (error) {
        console.error('Error loading admin data:', error);
        showError('Failed to load admin data');
    }
}

/**
 * Update admin dashboard statistics
 */
function updateAdminStats() {
    const total = allReports.length;
    const pending = allReports.filter(r => r.status === 'Pending').length;
    const inProgress = allReports.filter(r => r.status === 'In Progress').length;
    const fixed = allReports.filter(r => r.status === 'Fixed').length;
    const emergency = allReports.filter(r => r.severity === 'Emergency').length;
    const activeUsers = allUsers.filter(u => u.role === 'resident').length;

    document.getElementById('totalReportsAdmin').textContent = total;
    document.getElementById('pendingReportsAdmin').textContent = pending;
    document.getElementById('inProgressReportsAdmin').textContent = inProgress;
    document.getElementById('fixedReportsAdmin').textContent = fixed;
    document.getElementById('emergencyReportsAdmin').textContent = emergency;
    document.getElementById('activeUsersAdmin').textContent = activeUsers;
}

/**
 * Display recent reports on admin dashboard
 */
function displayRecentReports() {
    const tbody = document.getElementById('recentReportsTable');
    if (!tbody) return;

    if (allReports.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="8" class="empty-state">No reports found</td>
            </tr>
        `;
        return;
    }

    const recent = allReports.slice(0, 10);
    tbody.innerHTML = recent.map(report => `
        <tr onclick="viewReportDetails('${report.id}')">
            <td>${report.id.substring(0, 8)}</td>
            <td><strong>${report.title}</strong></td>
            <td>${report.reported_by_name || 'Unknown'}</td>
            <td>${report.category}</td>
            <td><span class="status-badge ${report.status.toLowerCase().replace(' ', '-')}">${report.status}</span></td>
            <td><span class="severity-badge ${report.severity.toLowerCase()}">${report.severity}</span></td>
            <td>${formatDate(report.created_at)}</td>
            <td>
                <button class="btn btn-small" onclick="event.stopPropagation(); editReport('${report.id}')">
                    Edit
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * Load reports for manage view
 */
async function loadReports(view = 'manage') {
    try {
        const tbody = document.getElementById('manageReportsTable');
        if (!tbody) return;

        renderManageTable(allReports);
    } catch (error) {
        console.error('Error loading reports:', error);
        showError('Failed to load reports');
    }
}

/**
 * Filter reports
 */
function filterReports() {
    const statusFilter = document.getElementById('adminStatusFilter')?.value || '';
    const severityFilter = document.getElementById('severityFilter')?.value || '';
    const categoryFilter = document.getElementById('adminCategoryFilter')?.value || '';

    let filtered = allReports;
    if (statusFilter) filtered = filtered.filter(r => r.status === statusFilter);
    if (severityFilter) filtered = filtered.filter(r => r.severity === severityFilter);
    if (categoryFilter) filtered = filtered.filter(r => r.category === categoryFilter);

    renderManageTable(filtered);
}

/**
 * View report details
 */
function viewReportDetails(reportId) {
    const report = allReports.find(r => r.id === reportId);
    if (!report) return;

    const modal = document.getElementById('reportModal');
    const modalBody = document.getElementById('modalBody');

    modalBody.innerHTML = `
        <div class="report-details">
            <div class="detail-section">
                <h3>${report.title}</h3>
                <div class="detail-row">
                    <span class="detail-label">Status:</span>
                    <span class="status-badge ${report.status.toLowerCase().replace(' ', '-')}">${report.status}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Category:</span>
                    <span>${report.category}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Severity:</span>
                    <span class="severity-badge ${report.severity.toLowerCase()}">${report.severity}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Reporter:</span>
                    <span>${report.reported_by_name || 'Unknown'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Location:</span>
                    <span>${report.location}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date Reported:</span>
                    <span>${formatDateTime(report.created_at)}</span>
                </div>
            </div>

            <div class="detail-section">
                <h4>Description</h4>
                <p>${report.description}</p>
            </div>

            ${report.image_before ? `
                <div class="detail-section">
                    <h4>Issue Photo</h4>
                    <img src="${report.image_before}" alt="Issue photo" style="max-width: 100%; max-height: 300px; border-radius: var(--radius-lg);">
                </div>
            ` : ''}

            ${report.image_after ? `
                <div class="detail-section">
                    <h4>Resolution Photo</h4>
                    <img src="${report.image_after}" alt="After photo" style="max-width: 100%; max-height: 300px; border-radius: var(--radius-lg);">
                </div>
            ` : ''}

            ${report.remarks ? `
                <div class="detail-section">
                    <h4>Remarks</h4>
                    <p>${report.remarks}</p>
                </div>
            ` : ''}

            <div class="detail-section">
                <button class="btn btn-primary" onclick="editReport('${report.id}'); closeModal('reportModal')">
                    Update Status
                </button>
            </div>
        </div>
    `;

    modal.classList.add('active');
}

/**
 * Edit report
 */
function editReport(reportId) {
    const report = allReports.find(r => r.id === reportId);
    if (!report) return;

    document.getElementById('updateReportId').value = reportId;
    document.getElementById('updateStatus').value = report.status;
    document.getElementById('updateRemarks').value = report.remarks || '';

    // Show proof image group only for "Fixed" status
    const proofImageGroup = document.getElementById('proofImageGroup');
    if (proofImageGroup) {
        proofImageGroup.style.display = report.status === 'Fixed' ? 'block' : 'none';
    }

    openModal('updateReportModal');
}

/**
 * Handle status change
 */
function handleStatusChange() {
    const status = document.getElementById('updateStatus').value;
    const proofImageGroup = document.getElementById('proofImageGroup');

    if (proofImageGroup) {
        proofImageGroup.style.display = status === 'Fixed' ? 'block' : 'none';
    }
}

/**
 * Handle update report
 */
async function handleUpdateReport(e) {
    e.preventDefault();

    const reportId = document.getElementById('updateReportId').value;
    const status = document.getElementById('updateStatus').value;
    const remarks = document.getElementById('updateRemarks').value.trim();

    const report = allReports.find(r => r.id === reportId);
    if (!report) return;

    // Validate proof image for "Fixed" status
    if (status === 'Fixed') {
        const proofImageInput = document.getElementById('proofImage');
        if (!proofImageInput.files.length) {
            showError('Please upload a proof of fix image');
            return;
        }
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);

    try {
        // Update report
        report.status = status;
        report.remarks = remarks;
        report.updated_at = new Date().toISOString();

        if (status === 'Fixed') {
            report.fixed_at = new Date().toISOString();
            // Handle proof image upload
            const proofFile = document.getElementById('proofImage').files[0];
            if (proofFile) {
                const compressedFile = await compressImage(proofFile);
                report.image_after = URL.createObjectURL(compressedFile);
            }
        }

        // In production, save to Supabase
        // await supabase.patch('reports', reportId, { status, remarks });

        showSuccess('Report updated successfully!');
        closeModal('updateReportModal');
        updateAdminStats();
        displayRecentReports();
        loadReports('manage');
    } catch (error) {
        console.error('Error updating report:', error);
        showError('Failed to update report');
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

/**
 * Load users
 */
async function loadUsers() {
    try {
        const tbody = document.getElementById('usersTable');
        if (!tbody) return;

        if (allUsers.length === 0) {
            tbody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="8" class="empty-state">No users found</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = allUsers.map(user => `
            <tr>
                <td><strong>${user.full_name}</strong></td>
                <td>${user.email}</td>
                <td>${user.barangay}</td>
                <td>${user.contact_number}</td>
                <td>${user.role}</td>
                <td>${user.report_count || 0}</td>
                <td>${formatDate(user.created_at)}</td>
                <td>
                    <button class="btn btn-small" onclick="viewUserDetails('${user.id}')">
                        View
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading users:', error);
        showError('Failed to load users');
    }
}

/**
 * Filter users
 */
function filterUsers() {
    const roleFilter = document.getElementById('roleFilter')?.value || '';

    let filtered = allUsers;
    if (roleFilter) {
        filtered = filtered.filter(u => u.role === roleFilter);
    }

    const tbody = document.getElementById('usersTable');
    if (!tbody) return;

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="8" class="empty-state">No users found</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(user => `
        <tr>
            <td><strong>${user.full_name}</strong></td>
            <td>${user.email}</td>
            <td>${user.barangay}</td>
            <td>${user.contact_number}</td>
            <td>${user.role}</td>
            <td>${user.report_count || 0}</td>
            <td>${formatDate(user.created_at)}</td>
            <td>
                <button class="btn btn-small" onclick="viewUserDetails('${user.id}')">
                    View
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * Initialize charts
 */
function initializeCharts() {
    // Category chart
    const categoryCtx = document.getElementById('categoryChart');
    if (categoryCtx) {
        const categoryData = getCategoryData();
        charts.category = new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: categoryData.labels,
                datasets: [{
                    data: categoryData.values,
                    backgroundColor: [
                        '#0d7377',
                        '#14a085',
                        '#3498db',
                        '#f39c12',
                        '#e74c3c',
                        '#2ecc71',
                        '#9b59b6',
                        '#1abc9c'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // Status chart
    const statusCtx = document.getElementById('statusChart');
    if (statusCtx) {
        const statusData = getStatusData();
        charts.status = new Chart(statusCtx, {
            type: 'bar',
            data: {
                labels: statusData.labels,
                datasets: [{
                    label: 'Reports',
                    data: statusData.values,
                    backgroundColor: '#0d7377',
                    borderColor: '#0a5568',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Timeline chart
    const timelineCtx = document.getElementById('timelineChart');
    if (timelineCtx) {
        const timelineData = getTimelineData();
        charts.timeline = new Chart(timelineCtx, {
            type: 'line',
            data: {
                labels: timelineData.labels,
                datasets: [{
                    label: 'Reports',
                    data: timelineData.values,
                    borderColor: '#0d7377',
                    backgroundColor: 'rgba(13, 115, 119, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Resolution chart
    const resolutionCtx = document.getElementById('resolutionChart');
    if (resolutionCtx) {
        const total = allReports.length;
        const fixed = allReports.filter(r => r.status === 'Fixed').length;
        const rate = total > 0 ? Math.round((fixed / total) * 100) : 0;

        charts.resolution = new Chart(resolutionCtx, {
            type: 'doughnut',
            data: {
                labels: ['Resolved', 'Pending'],
                datasets: [{
                    data: [rate, 100 - rate],
                    backgroundColor: ['#2ecc71', '#ecf0f1']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

/**
 * Get category data for chart
 */
function getCategoryData() {
    const categories = ['Roads', 'Garbage', 'Drainage', 'Flooding', 'Street Lights', 'Public Safety', 'Infrastructure', 'Others'];
    const data = categories.map(cat => 
        allReports.filter(r => r.category === cat).length
    );

    return {
        labels: categories,
        values: data
    };
}

/**
 * Get status data for chart
 */
function getStatusData() {
    const statuses = ['Pending', 'Under Review', 'In Progress', 'Fixed', 'Rejected'];
    const data = statuses.map(status =>
        allReports.filter(r => r.status === status).length
    );

    return {
        labels: statuses,
        values: data
    };
}

/**
 * Get timeline data for chart
 */
function getTimelineData() {
    const days = 7;
    const labels = [];
    const values = [];

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(formatDate(date));

        const dayReports = allReports.filter(r => {
            const reportDate = new Date(r.created_at);
            return reportDate.toDateString() === date.toDateString();
        }).length;

        values.push(dayReports);
    }

    return { labels, values };
}

/**
 * Setup modal handlers
 */
function setupModalHandlers() {
    const modals = document.querySelectorAll('.modal');

    modals.forEach(modal => {
        // Close on X button
        modal.querySelector('.modal-close')?.addEventListener('click', () => {
            modal.classList.remove('active');
        });

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

/**
 * Setup sidebar toggle for mobile
 */
function setupSidebarToggle() {
    const toggle = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');

    if (toggle && sidebar) {
        toggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });

        sidebar.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                sidebar.classList.remove('active');
            });
        });
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            const q = e.target.value.trim().toLowerCase();
            if (q.length > 1) {
                const filtered = allReports.filter(r =>
                    r.title.toLowerCase().includes(q) ||
                    (r.reported_by_name || '').toLowerCase().includes(q) ||
                    r.location.toLowerCase().includes(q)
                );
                renderManageTable(filtered);
            } else {
                loadReports('manage');
            }
        }, 300));
    }

    // Proof image preview
    const proofImageInput = document.getElementById('proofImage');
    if (proofImageInput) {
        proofImageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const preview = document.getElementById('proofImagePreview');
                    if (preview) preview.innerHTML = `<img src="${ev.target.result}" alt="Proof preview">`;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await supabase.signOut();
                setCurrentUser(null);
                showSuccess('Logged out');
                setTimeout(() => { window.location.href = 'index.html'; }, 500);
            } catch (error) {
                showError('Logout failed');
            }
        });
    }
}

/**
 * Render manage reports table with provided data
 */
function renderManageTable(reports) {
    const tbody = document.getElementById('manageReportsTable');
    if (!tbody) return;

    if (!reports || reports.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="7" class="empty-state">No reports found</td></tr>`;
        return;
    }

    tbody.innerHTML = reports.map(report => `
        <tr onclick="viewReportDetails('${report.id}')">
            <td>${report.id.substring(0, 8)}</td>
            <td><strong>${escapeHtmlAdmin(report.title)}</strong></td>
            <td>${escapeHtmlAdmin(report.reported_by_name || 'Unknown')}</td>
            <td><span class="status-badge ${report.status.toLowerCase().replace(/ /g, '-')}">${report.status}</span></td>
            <td><span class="severity-badge ${report.severity.toLowerCase()}">${report.severity}</span></td>
            <td>${formatDate(report.created_at)}</td>
            <td>
                <button class="btn btn-small" onclick="event.stopPropagation(); editReport('${report.id}')">
                    Update
                </button>
            </td>
        </tr>
    `).join('');
}

function escapeHtmlAdmin(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text || '').replace(/[&<>"']/g, m => map[m]);
}

/**
 * Generate mock reports
 */
function generateMockReports() {
    const categories = ['Roads', 'Garbage', 'Drainage', 'Flooding', 'Street Lights', 'Public Safety', 'Infrastructure'];
    const severities = ['Low', 'Medium', 'High', 'Emergency'];
    const statuses = ['Pending', 'Under Review', 'In Progress', 'Fixed'];
    const reporters = ['Juan Dela Cruz', 'Maria Garcia', 'Carlos Santos', 'Ana Lopez'];

    const reports = [];
    for (let i = 0; i < 20; i++) {
        reports.push({
            id: generateUUID(),
            title: `Issue: ${categories[Math.floor(Math.random() * categories.length)]} problem`,
            description: 'Sample issue description',
            category: categories[Math.floor(Math.random() * categories.length)],
            severity: severities[Math.floor(Math.random() * severities.length)],
            status: statuses[Math.floor(Math.random() * statuses.length)],
            location: 'Sample Barangay',
            image_before: 'https://via.placeholder.com/400x300?text=Issue',
            image_after: null,
            reported_by_name: reporters[Math.floor(Math.random() * reporters.length)],
            created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
            remarks: ''
        });
    }

    return reports;
}

/**
 * Generate mock users
 */
function generateMockUsers() {
    const names = ['Juan Dela Cruz', 'Maria Garcia', 'Carlos Santos', 'Ana Lopez', 'Jose Martinez'];
    const barangays = ['Barangay 1', 'Barangay 2', 'Barangay 3', 'Barangay 4', 'Barangay 5'];

    const users = [];
    for (let i = 0; i < 10; i++) {
        users.push({
            id: generateUUID(),
            full_name: names[Math.floor(Math.random() * names.length)],
            email: `user${i}@example.com`,
            barangay: barangays[Math.floor(Math.random() * barangays.length)],
            contact_number: '+63912345678' + i,
            role: 'resident',
            report_count: Math.floor(Math.random() * 10),
            created_at: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString()
        });
    }

    return users;
}
