/**
 * AyosPH - Reports Module
 * Handles report CRUD, image upload, filtering, and detail views
 */

class ReportService {
    constructor() {
        this.reports = [];
        this.currentPage = 1;
        this.pageSize = 10;
        this.totalPages = 1;
        this.activeFilters = {};
        this.searchQuery = '';
    }

    /**
     * Fetch reports for a user
     */
    async fetchUserReports(userId, filters = {}) {
        try {
            // Build query
            let queryParts = [`reported_by=eq.${userId}`];
            if (filters.status) queryParts.push(`status=eq.${filters.status}`);
            if (filters.category) queryParts.push(`category=eq.${filters.category}`);
            if (filters.severity) queryParts.push(`severity=eq.${filters.severity}`);

            const query = queryParts.join('&') + '&order=created_at.desc';

            // In production:
            // const data = await supabase.get('reports', query);
            // return data;

            // Demo: return mock data
            return this.getMockReports(userId);
        } catch (error) {
            console.error('Error fetching reports:', error);
            throw error;
        }
    }

    /**
     * Fetch all reports (admin)
     */
    async fetchAllReports(filters = {}) {
        try {
            // In production: fetch all from Supabase
            return this.getMockReports();
        } catch (error) {
            console.error('Error fetching all reports:', error);
            throw error;
        }
    }

    /**
     * Fetch single report by ID
     */
    async fetchReport(reportId) {
        try {
            // In production:
            // const [report] = await supabase.get('reports', `id=eq.${reportId}`);
            // return report;

            return this.reports.find(r => r.id === reportId);
        } catch (error) {
            console.error('Error fetching report:', error);
            throw error;
        }
    }

    /**
     * Create a new report
     */
    async createReport(reportData, imageFile) {
        try {
            const user = getCurrentUser();
            if (!user) throw new Error('User not authenticated');

            let imageUrl = null;

            // Upload image
            if (imageFile) {
                imageUrl = await this.uploadImage(imageFile, 'before');
            }

            const report = {
                id: generateUUID(),
                title: reportData.title,
                description: reportData.description,
                category: reportData.category,
                severity: reportData.severity,
                status: 'Pending',
                location: reportData.location,
                latitude: reportData.latitude || null,
                longitude: reportData.longitude || null,
                image_before: imageUrl,
                image_after: null,
                remarks: '',
                reported_by: user.id,
                assigned_to: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // In production:
            // const [created] = await supabase.post('reports', report);
            // return created;

            this.reports.unshift(report);
            return report;
        } catch (error) {
            console.error('Error creating report:', error);
            throw error;
        }
    }

    /**
     * Update a report's status (admin)
     */
    async updateReportStatus(reportId, updateData, proofImageFile) {
        try {
            let proofImageUrl = null;

            // Upload proof image for "Fixed" status
            if (updateData.status === 'Fixed' && proofImageFile) {
                proofImageUrl = await this.uploadImage(proofImageFile, 'after');
            }

            const update = {
                status: updateData.status,
                remarks: updateData.remarks || '',
                updated_at: new Date().toISOString()
            };

            if (proofImageUrl) {
                update.image_after = proofImageUrl;
            }

            if (updateData.status === 'Fixed') {
                update.fixed_at = new Date().toISOString();
            }

            if (updateData.assigned_to) {
                update.assigned_to = updateData.assigned_to;
            }

            // In production:
            // await supabase.patch('reports', reportId, update);

            const report = this.reports.find(r => r.id === reportId);
            if (report) Object.assign(report, update);

            return { ...report, ...update };
        } catch (error) {
            console.error('Error updating report:', error);
            throw error;
        }
    }

    /**
     * Delete a report
     */
    async deleteReport(reportId) {
        try {
            // In production:
            // await supabase.delete('reports', reportId);

            const index = this.reports.findIndex(r => r.id === reportId);
            if (index !== -1) this.reports.splice(index, 1);

            return { success: true };
        } catch (error) {
            console.error('Error deleting report:', error);
            throw error;
        }
    }

    /**
     * Upload image to Supabase Storage
     */
    async uploadImage(file, type = 'before') {
        try {
            // Validate file
            if (!isValidImageFile(file)) {
                throw new Error('Invalid image file type');
            }

            if (!isValidFileSize(file, 10)) {
                throw new Error('Image must be smaller than 10MB');
            }

            // Compress image
            const compressedFile = await compressImage(file);

            // Generate filename
            const ext = file.name.split('.').pop();
            const filename = `${generateUUID()}-${type}.${ext}`;

            // In production: upload to Supabase
            // const result = await supabase.uploadFile('reports', filename, compressedFile);
            // return supabase.getPublicUrl('reports', filename);

            // Demo: return object URL
            return URL.createObjectURL(compressedFile);
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    }

    /**
     * Search reports
     */
    searchReports(query) {
        const q = query.toLowerCase();
        return this.reports.filter(report =>
            report.title.toLowerCase().includes(q) ||
            report.description.toLowerCase().includes(q) ||
            report.location.toLowerCase().includes(q) ||
            report.category.toLowerCase().includes(q)
        );
    }

    /**
     * Filter reports with multiple criteria
     */
    filterReports(filters = {}) {
        return this.reports.filter(report => {
            if (filters.status && report.status !== filters.status) return false;
            if (filters.category && report.category !== filters.category) return false;
            if (filters.severity && report.severity !== filters.severity) return false;
            if (filters.dateFrom && new Date(report.created_at) < new Date(filters.dateFrom)) return false;
            if (filters.dateTo && new Date(report.created_at) > new Date(filters.dateTo)) return false;
            return true;
        });
    }

    /**
     * Get report statistics
     */
    getStats() {
        return {
            total: this.reports.length,
            byStatus: {
                pending: this.reports.filter(r => r.status === 'Pending').length,
                underReview: this.reports.filter(r => r.status === 'Under Review').length,
                inProgress: this.reports.filter(r => r.status === 'In Progress').length,
                fixed: this.reports.filter(r => r.status === 'Fixed').length,
                rejected: this.reports.filter(r => r.status === 'Rejected').length
            },
            byCategory: this.getByCategory(),
            bySeverity: {
                low: this.reports.filter(r => r.severity === 'Low').length,
                medium: this.reports.filter(r => r.severity === 'Medium').length,
                high: this.reports.filter(r => r.severity === 'High').length,
                emergency: this.reports.filter(r => r.severity === 'Emergency').length
            },
            resolutionRate: this.reports.length > 0
                ? Math.round((this.reports.filter(r => r.status === 'Fixed').length / this.reports.length) * 100)
                : 0
        };
    }

    /**
     * Group reports by category
     */
    getByCategory() {
        const categories = ['Roads', 'Garbage', 'Drainage', 'Flooding', 'Street Lights', 'Public Safety', 'Infrastructure', 'Others'];
        const result = {};
        categories.forEach(cat => {
            result[cat] = this.reports.filter(r => r.category === cat).length;
        });
        return result;
    }

    /**
     * Get reports grouped by month
     */
    getByMonth(months = 6) {
        const result = [];
        const now = new Date();

        for (let i = months - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

            const count = this.reports.filter(r => {
                const reportDate = new Date(r.created_at);
                return reportDate >= date && reportDate < nextDate;
            }).length;

            result.push({
                month: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
                count
            });
        }

        return result;
    }

    /**
     * Generate mock reports for demo
     */
    getMockReports(userId = null) {
        const categories = ['Roads', 'Garbage', 'Drainage', 'Flooding', 'Street Lights', 'Public Safety', 'Infrastructure'];
        const severities = ['Low', 'Medium', 'High', 'Emergency'];
        const statuses = ['Pending', 'Under Review', 'In Progress', 'Fixed', 'Rejected'];
        const locations = ['Maharlika St., Barangay 1', 'Rizal Ave., Barangay 2', 'Bonifacio Rd., Barangay 3'];
        const reporters = [
            { id: generateUUID(), name: 'Juan Dela Cruz' },
            { id: generateUUID(), name: 'Maria Garcia' },
            { id: generateUUID(), name: 'Carlos Santos' }
        ];

        const titles = [
            'Pothole on main road causing accidents',
            'Overflowing garbage bins near market',
            'Blocked drainage causing flooding',
            'Street light not working for 2 weeks',
            'Damaged bridge railing near school',
            'Illegal dumping in vacant lot',
            'Deep flood during rain season',
            'Broken sidewalk tiles'
        ];

        const descriptions = [
            'Large pothole on the main road has been causing accidents. Vehicles swerve to avoid it, creating dangerous conditions especially at night.',
            'Garbage bins near the market have been overflowing for several days. The smell is unbearable and attracts pests.',
            'The main drainage canal is blocked with debris, causing flooding during heavy rains. Several homes are affected.',
            'The street light at the corner of Maharlika and Rizal has not been working for weeks. The area is very dark at night.',
            'The bridge railing near the elementary school is damaged and poses serious safety risk to pedestrians, especially children.'
        ];

        const reports = [];
        for (let i = 0; i < 15; i++) {
            const reporter = reporters[Math.floor(Math.random() * reporters.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];

            reports.push({
                id: generateUUID(),
                title: titles[Math.floor(Math.random() * titles.length)],
                description: descriptions[Math.floor(Math.random() * descriptions.length)],
                category: categories[Math.floor(Math.random() * categories.length)],
                severity: severities[Math.floor(Math.random() * severities.length)],
                status,
                location: locations[Math.floor(Math.random() * locations.length)],
                latitude: 14.5995 + (Math.random() - 0.5) * 0.1,
                longitude: 120.9842 + (Math.random() - 0.5) * 0.1,
                image_before: `https://picsum.photos/seed/${i}/400/300`,
                image_after: status === 'Fixed' ? `https://picsum.photos/seed/${i + 100}/400/300` : null,
                remarks: status !== 'Pending' ? 'Reviewed by Barangay team. Action is being taken.' : '',
                reported_by: userId || reporter.id,
                reported_by_name: reporter.name,
                assigned_to: null,
                created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date().toISOString(),
                fixed_at: status === 'Fixed' ? new Date().toISOString() : null
            });
        }

        // Sort by date descending
        reports.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return reports;
    }
}

/**
 * Comments Service
 */
class CommentsService {
    /**
     * Fetch comments for a report
     */
    async fetchComments(reportId) {
        try {
            // In production:
            // return await supabase.get('comments', `report_id=eq.${reportId}&order=created_at.asc`);

            return this.getMockComments(reportId);
        } catch (error) {
            console.error('Error fetching comments:', error);
            throw error;
        }
    }

    /**
     * Add a comment
     */
    async addComment(reportId, message) {
        try {
            const user = getCurrentUser();
            if (!user) throw new Error('User not authenticated');
            if (!message.trim()) throw new Error('Comment cannot be empty');

            const comment = {
                id: generateUUID(),
                report_id: reportId,
                user_id: user.id,
                user_name: user.full_name || user.email,
                user_role: user.role,
                message: message.trim(),
                created_at: new Date().toISOString()
            };

            // In production:
            // const [created] = await supabase.post('comments', comment);
            // return created;

            return comment;
        } catch (error) {
            console.error('Error adding comment:', error);
            throw error;
        }
    }

    /**
     * Delete a comment
     */
    async deleteComment(commentId) {
        try {
            // In production:
            // await supabase.delete('comments', commentId);
            return { success: true };
        } catch (error) {
            console.error('Error deleting comment:', error);
            throw error;
        }
    }

    /**
     * Mock comments for demo
     */
    getMockComments(reportId) {
        return [
            {
                id: generateUUID(),
                report_id: reportId,
                user_id: generateUUID(),
                user_name: 'Brgy. Official Santos',
                user_role: 'admin',
                message: 'Thank you for reporting this issue. We have received your report and will assess the situation within 24 hours.',
                created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
            },
            {
                id: generateUUID(),
                report_id: reportId,
                user_id: generateUUID(),
                user_name: 'Juan Dela Cruz',
                user_role: 'resident',
                message: 'Thank you for the quick response. The issue has been affecting many residents in the area.',
                created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
            }
        ];
    }
}

/**
 * Render comments in a container element
 */
function renderComments(comments, container, reportId) {
    if (!container) return;

    container.innerHTML = '';

    if (comments.length === 0) {
        container.innerHTML = '<p class="empty-state">No comments yet. Be the first to comment.</p>';
    } else {
        comments.forEach(comment => {
            const div = document.createElement('div');
            div.className = `comment-item ${comment.user_role === 'admin' ? 'admin-comment' : ''}`;
            div.innerHTML = `
                <div class="comment-header">
                    <span class="comment-author">${escapeHtml(comment.user_name)}</span>
                    ${comment.user_role === 'admin' ? '<span class="comment-role-badge">Official</span>' : ''}
                    <span class="comment-time">${formatTimeAgo(comment.created_at)}</span>
                </div>
                <div class="comment-body">${escapeHtml(comment.message)}</div>
            `;
            container.appendChild(div);
        });
    }

    // Add comment form
    const form = document.createElement('div');
    form.className = 'comment-form';
    form.innerHTML = `
        <textarea id="commentInput-${reportId}" placeholder="Add a comment..." rows="3"></textarea>
        <button class="btn btn-primary btn-small" onclick="submitComment('${reportId}')">
            Submit Comment
        </button>
    `;
    container.appendChild(form);
}

/**
 * Submit a comment
 */
async function submitComment(reportId) {
    const input = document.getElementById(`commentInput-${reportId}`);
    if (!input) return;

    const message = input.value.trim();
    if (!message) {
        showError('Please enter a comment');
        return;
    }

    try {
        const comment = await commentsService.addComment(reportId, message);
        input.value = '';
        showSuccess('Comment added!');

        // Reload comments
        const container = document.getElementById(`comments-${reportId}`);
        if (container) {
            const comments = await commentsService.fetchComments(reportId);
            renderComments(comments, container, reportId);
        }
    } catch (error) {
        showError(error.message || 'Failed to add comment');
    }
}

/**
 * Escape HTML helper
 */
function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text || '').replace(/[&<>"']/g, m => map[m]);
}

/**
 * Render report detail HTML
 */
function renderReportDetail(report, isAdmin = false) {
    return `
        <div class="report-detail-wrapper">
            <div class="report-detail-header">
                <div class="report-detail-meta">
                    <span class="status-badge ${report.status.toLowerCase().replace(/ /g, '-')}">${report.status}</span>
                    <span class="severity-badge ${report.severity.toLowerCase()}">${report.severity}</span>
                    <span class="category-tag">${report.category}</span>
                </div>
                <h2 class="report-detail-title">${escapeHtml(report.title)}</h2>
                <div class="report-detail-info">
                    <span>📍 ${escapeHtml(report.location)}</span>
                    <span>📅 ${formatDateTime(report.created_at)}</span>
                    ${report.reported_by_name ? `<span>👤 ${escapeHtml(report.reported_by_name)}</span>` : ''}
                </div>
            </div>

            <div class="report-detail-body">
                <div class="detail-section">
                    <h4>Description</h4>
                    <p>${escapeHtml(report.description)}</p>
                </div>

                <div class="detail-photos">
                    ${report.image_before ? `
                        <div class="detail-photo">
                            <h4>Issue Photo</h4>
                            <img src="${report.image_before}" alt="Issue" loading="lazy">
                        </div>
                    ` : ''}
                    ${report.image_after ? `
                        <div class="detail-photo resolved">
                            <h4>✅ After Resolution</h4>
                            <img src="${report.image_after}" alt="After" loading="lazy">
                        </div>
                    ` : ''}
                </div>

                ${report.remarks ? `
                    <div class="detail-section">
                        <h4>Official Remarks</h4>
                        <blockquote class="official-remark">${escapeHtml(report.remarks)}</blockquote>
                    </div>
                ` : ''}

                <div class="detail-section">
                    <h4>Comments</h4>
                    <div id="comments-${report.id}" class="comments-container">
                        <div class="loading-state">Loading comments...</div>
                    </div>
                </div>
            </div>

            ${isAdmin ? `
                <div class="report-detail-actions">
                    <button class="btn btn-primary" onclick="editReport('${report.id}'); closeModal('reportModal')">
                        ✏️ Update Status
                    </button>
                </div>
            ` : ''}
        </div>
    `;
}

// Instantiate services
const reportService = new ReportService();
const commentsService = new CommentsService();
