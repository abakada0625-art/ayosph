/**
 * AyosPH - Resident Dashboard Module
 * Handles resident dashboard, report submission, and tracking
 */

let currentReports = [];
let filteredReports = [];

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    requireAuth();

    // Initialize dashboard
    initializeDashboard();
    setupEventListeners();
    loadDashboardData();
});

/**
 * Initialize dashboard
 */
function initializeDashboard() {
    // Setup navigation
    document.querySelectorAll('[data-view]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const view = e.currentTarget.getAttribute('data-view');
            switchView(view);
        });
    });

    // Setup form submission
    const reportForm = document.getElementById('reportForm');
    if (reportForm) {
        reportForm.addEventListener('submit', handleReportSubmit);
    }

    // Setup image upload (click and drag/drop)
    const imageInput = document.getElementById('reportImage');
    const uploadArea = document.querySelector('.upload-area');

    if (imageInput && uploadArea) {
        // Click to open file picker
        uploadArea.addEventListener('click', () => imageInput.click());

        imageInput.addEventListener('change', handleImageSelect);

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                imageInput.files = files;
                handleImageSelect({ target: { files } });
            }
        });
    }

    // Setup location button
    const locationBtn = document.getElementById('getLocationBtn');
    if (locationBtn) {
        locationBtn.addEventListener('click', getDeviceLocation);
    }

    // Setup search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            const q = e.target.value.trim();
            if (q.length > 1) {
                filteredReports = reportService.searchReports(q);
                displayReports();
            } else {
                filteredReports = [...currentReports];
                displayReports();
            }
        }, 300));
    }

    // Setup filters
    document.getElementById('statusFilter')?.addEventListener('change', filterReports);
    document.getElementById('categoryFilter')?.addEventListener('change', filterReports);

    // Setup modal close
    setupModalHandlers();

    // Setup sidebar toggle for mobile
    setupSidebarToggle();

    // Populate user info in header
    populateUserHeader();
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
    if (viewName === 'my-reports') {
        loadReports();
    }
}

/**
 * Populate user info in header
 */
function populateUserHeader() {
    const user = getCurrentUser();
    if (!user) return;

    const profileHeader = document.querySelector('#profileDropdown .dropdown-header');
    if (profileHeader) {
        profileHeader.innerHTML = `
            <div class="profile-info">
                <div class="profile-name">${user.full_name || user.email || 'Resident'}</div>
                <div class="profile-role">${user.barangay || user.role || 'Resident'}</div>
            </div>
        `;
    }
}

/**
 * Load dashboard data
 */
async function loadDashboardData() {
    try {
        const user = getCurrentUser();
        const userId = user?.id || generateUUID();

        // Use reportService mock data
        currentReports = reportService.getMockReports(userId);
        reportService.reports = currentReports;

        updateDashboardStats();
        displayRecentReports();
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showError('Failed to load dashboard data');
    }
}

/**
 * Update dashboard statistics
 */
function updateDashboardStats() {
    const total = currentReports.length;
    const pending = currentReports.filter(r => r.status === 'Pending').length;
    const inProgress = currentReports.filter(r => r.status === 'In Progress').length;
    const resolved = currentReports.filter(r => r.status === 'Fixed').length;

    document.getElementById('totalReports').textContent = total;
    document.getElementById('pendingReports').textContent = pending;
    document.getElementById('inProgressReports').textContent = inProgress;
    document.getElementById('resolvedReports').textContent = resolved;
}

/**
 * Display recent reports on dashboard
 */
function displayRecentReports() {
    const container = document.getElementById('recentReportsList');
    if (!container) return;

    if (currentReports.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No reports yet. <a href="#" onclick="switchView('new-report'); return false;">Create your first report</a></p>
            </div>
        `;
        return;
    }

    const recent = currentReports.slice(0, 5);
    container.innerHTML = recent.map(report => `
        <div class="report-item" onclick="viewReportDetails('${report.id}')">
            <div class="report-header">
                <div>
                    <div class="report-title">${report.title}</div>
                    <div class="report-category">${report.category}</div>
                </div>
                <span class="status-badge ${report.status.toLowerCase().replace(' ', '-')}">${report.status}</span>
            </div>
            <div class="report-meta">
                <div class="report-meta-item">📍 ${report.location}</div>
                <div class="report-meta-item">📅 ${formatDate(report.created_at)}</div>
                <div class="report-meta-item severity-badge ${report.severity.toLowerCase()}">${report.severity}</div>
            </div>
        </div>
    `).join('');
}

/**
 * Load all reports for the resident
 */
async function loadReports() {
    try {
        // In production, fetch from Supabase
        filteredReports = [...currentReports];
        displayReports();
    } catch (error) {
        console.error('Error loading reports:', error);
        showError('Failed to load reports');
    }
}

/**
 * Display reports in table
 */
function displayReports() {
    const tbody = document.getElementById('reportsList');
    if (!tbody) return;

    if (filteredReports.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="6" class="empty-state">No reports found</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filteredReports.map(report => `
        <tr onclick="viewReportDetails('${report.id}')">
            <td><strong>${report.title}</strong></td>
            <td>${report.category}</td>
            <td><span class="severity-badge ${report.severity.toLowerCase()}">${report.severity}</span></td>
            <td><span class="status-badge ${report.status.toLowerCase().replace(' ', '-')}">${report.status}</span></td>
            <td>${formatDate(report.created_at)}</td>
            <td><button class="btn btn-small" onclick="event.stopPropagation(); viewReportDetails('${report.id}')">View</button></td>
        </tr>
    `).join('');
}

/**
 * Filter reports
 */
function filterReports() {
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';

    filteredReports = currentReports.filter(report => {
        const statusMatch = !statusFilter || report.status === statusFilter;
        const categoryMatch = !categoryFilter || report.category === categoryFilter;
        return statusMatch && categoryMatch;
    });

    displayReports();
}

/**
 * View report details
 */
function viewReportDetails(reportId) {
    const report = currentReports.find(r => r.id === reportId);
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
                    <span class="detail-label">Location:</span>
                    <span>${report.location}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date:</span>
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
                    <h4>Before/After Photo</h4>
                    <img src="${report.image_after}" alt="After photo" style="max-width: 100%; max-height: 300px; border-radius: var(--radius-lg);">
                </div>
            ` : ''}

            ${report.remarks ? `
                <div class="detail-section">
                    <h4>Admin Remarks</h4>
                    <p>${report.remarks}</p>
                </div>
            ` : ''}
        </div>
    `;

    modal.classList.add('active');
}

/**
 * Handle report form submission
 */
async function handleReportSubmit(e) {
    e.preventDefault();

    const title = document.getElementById('reportTitle').value.trim();
    const description = document.getElementById('reportDescription').value.trim();
    const category = document.getElementById('reportCategory').value;
    const severity = document.getElementById('reportSeverity').value;
    const location = document.getElementById('reportLocation').value.trim();
    const imageInput = document.getElementById('reportImage');

    // Validation
    if (!title || !description || !category || !severity || !location) {
        showError('Please fill in all required fields');
        return;
    }

    if (!imageInput.files.length) {
        showError('Please upload an issue photo');
        return;
    }

    const file = imageInput.files[0];
    if (!isValidImageFile(file)) {
        showError('Please upload a valid image file');
        return;
    }

    if (!isValidFileSize(file, 10)) {
        showError('Image size must be less than 10MB');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);

    try {
        // Compress image
        const compressedFile = await compressImage(file);

        // Create report object
        const user = getCurrentUser();
        const report = {
            id: generateUUID(),
            title: title,
            description: description,
            category: category,
            severity: severity,
            status: 'Pending',
            location: location,
            image_before: URL.createObjectURL(compressedFile),
            reported_by: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            remarks: ''
        };

        // In production, save to Supabase
        // const { error } = await supabase.post('reports', report);
        // if (error) throw error;

        currentReports.push(report);
        updateDashboardStats();

        showSuccess('Report submitted successfully!');

        // Reset form
        e.target.reset();
        document.getElementById('imagePreview').innerHTML = '';

        // Switch back to dashboard
        setTimeout(() => {
            switchView('dashboard');
        }, 500);
    } catch (error) {
        console.error('Error submitting report:', error);
        showError('Failed to submit report. Please try again.');
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

/**
 * Handle image selection
 */
function handleImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (event) => {
        const preview = document.getElementById('imagePreview');
        preview.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
    };
    reader.readAsDataURL(file);
}

/**
 * Get device location
 */
function getDeviceLocation() {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by your browser');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            // In production, reverse geocode to get address
            document.getElementById('reportLocation').value = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            showSuccess('Location detected');
        },
        (error) => {
            console.error('Geolocation error:', error);
            showError('Unable to get your location. Please enter it manually.');
        }
    );
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

        // Close sidebar when navigation item is clicked
        sidebar.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                sidebar.classList.remove('active');
            });
        });
    }
}

/**
 * Generate mock reports for demo
 */
function generateMockReports(userId) {
    const categories = ['Roads', 'Garbage', 'Drainage', 'Flooding', 'Street Lights', 'Public Safety', 'Infrastructure', 'Others'];
    const severities = ['Low', 'Medium', 'High', 'Emergency'];
    const statuses = ['Pending', 'Under Review', 'In Progress', 'Fixed', 'Rejected'];

    const mockReports = [];
    for (let i = 0; i < 5; i++) {
        mockReports.push({
            id: generateUUID(),
            title: `Issue ${i + 1}: Sample community problem`,
            description: `This is a sample description for issue ${i + 1}. The issue requires attention from barangay officials.`,
            category: categories[Math.floor(Math.random() * categories.length)],
            severity: severities[Math.floor(Math.random() * severities.length)],
            status: statuses[Math.floor(Math.random() * statuses.length)],
            location: 'Sample Barangay, Sample City',
            image_before: 'https://via.placeholder.com/400x300?text=Issue+Photo',
            image_after: null,
            reported_by: userId,
            created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
            remarks: ''
        });
    }

    return mockReports;
}
