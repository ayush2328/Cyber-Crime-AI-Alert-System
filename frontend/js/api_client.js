// API Client for backend communication

class APIClient {
    constructor() {
        this.baseURL = 'http://localhost:5000/api';
        this.token = localStorage.getItem('token');
    }

    // Set auth token
    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    // Clear auth token
    clearToken() {
        this.token = null;
        localStorage.removeItem('token');
    }

    // Make HTTP request
    async request(endpoint, method = 'GET', data = null) {
        const url = `${this.baseURL}${endpoint}`;
        
        const headers = {
            'Content-Type': 'application/json',
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const options = {
            method,
            headers,
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            showLoader();
            const response = await fetch(url, options);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Something went wrong');
            }

            return result;
        } catch (error) {
            showToast(error.message, 'error');
            throw error;
        } finally {
            hideLoader();
        }
    }

    // Auth APIs
    async login(email, password) {
        const data = await this.request('/auth/login', 'POST', { email, password });
        if (data.token) {
            this.setToken(data.token);
        }
        return data;
    }

    async register(userData) {
        return await this.request('/auth/register', 'POST', userData);
    }

    async logout() {
        this.clearToken();
        return { success: true };
    }

    // Complaint APIs
    async fileComplaint(complaintData) {
        return await this.request('/complaints', 'POST', complaintData);
    }

    async getMyComplaints() {
        return await this.request('/complaints/my');
    }

    async getComplaintById(id) {
        return await this.request(`/complaints/${id}`);
    }

    // Case APIs
    async trackCase(caseId) {
        return await this.request(`/cases/${caseId}/track`);
    }

    async getCaseDetails(caseId) {
        return await this.request(`/cases/${caseId}`);
    }

    // Evidence APIs
    async uploadEvidence(complaintId, files) {
        const formData = new FormData();
        files.forEach(file => {
            formData.append('evidence', file);
        });

        const url = `${this.baseURL}/complaints/${complaintId}/evidence`;
        
        try {
            showLoader();
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                },
                body: formData,
            });
            return await response.json();
        } catch (error) {
            showToast(error.message, 'error');
            throw error;
        } finally {
            hideLoader();
        }
    }

    // AI Analysis API
    async analyzeComplaint(text) {
        return await this.request('/ai/analyze', 'POST', { text });
    }

    async getCrimePrediction(text) {
        return await this.request('/ai/predict', 'POST', { text });
    }

    // User Profile APIs
    async getProfile() {
        return await this.request('/user/profile');
    }

    async updateProfile(profileData) {
        return await this.request('/user/profile', 'PUT', profileData);
    }

    // Dashboard APIs
    async getDashboardStats() {
        return await this.request('/dashboard/stats');
    }

    async getRecentComplaints() {
        return await this.request('/dashboard/recent');
    }

    // Admin APIs
    async getAllComplaints() {
        return await this.request('/admin/complaints');
    }

    async assignOfficer(caseId, officerId) {
        return await this.request(`/admin/cases/${caseId}/assign`, 'POST', { officerId });
    }

    async getMonthlyReport(month, year) {
        return await this.request(`/admin/reports/monthly?month=${month}&year=${year}`);
    }

    async getCrimeTrends() {
        return await this.request('/admin/reports/trends');
    }
}

// Initialize API client
const api = new APIClient();

// Example usage for login form
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const result = await api.login(email, password);
                showToast('Login successful!', 'success');
                
                // Redirect based on role
                setTimeout(() => {
                    if (result.role === 'admin') {
                        window.location.href = 'admin_dashboard.html';
                    } else {
                        window.location.href = 'dashboard.html';
                    }
                }, 1500);
            } catch (error) {
                // Error handled in API client
            }
        });
    }

    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const userData = {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                aadhar: document.getElementById('aadhar').value,
                password: document.getElementById('password').value,
            };

            try {
                await api.register(userData);
                showToast('Registration successful! Please login.', 'success');
                
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
            } catch (error) {
                // Error handled in API client
            }
        });
    }

    // Complaint form
    const complaintForm = document.getElementById('complaintForm');
    if (complaintForm) {
        // AI analysis on description change
        const description = document.getElementById('description');
        let timeoutId;

        description.addEventListener('input', () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(async () => {
                if (description.value.length > 50) {
                    try {
                        const result = await api.analyzeComplaint(description.value);
                        // Update UI with AI prediction
                        document.getElementById('aiCrimeType').textContent = result.crimeType;
                        document.getElementById('aiPriority').textContent = result.priority;
                        document.getElementById('aiConfidence').textContent = result.confidence + '%';
                        
                        document.getElementById('aiPreview').style.display = 'block';
                    } catch (error) {
                        // Silent fail for demo
                    }
                }
            }, 1000);
        });

        complaintForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const complaintData = {
                type: document.getElementById('complaintType').value,
                description: document.getElementById('description').value,
                incidentDate: document.getElementById('incidentDate').value,
                lossAmount: document.getElementById('lossAmount').value,
                state: document.getElementById('state').value,
                city: document.getElementById('city').value,
                address: document.getElementById('address').value,
                pincode: document.getElementById('pincode').value,
                suspectName: document.getElementById('suspectName')?.value,
                suspectPhone: document.getElementById('suspectPhone')?.value,
                suspectEmail: document.getElementById('suspectEmail')?.value,
                suspectBank: document.getElementById('suspectBank')?.value,
            };

            try {
                const result = await api.fileComplaint(complaintData);
                showToast('Complaint filed successfully!', 'success');
                
                // Upload evidence if any
                const fileList = document.querySelectorAll('.file-item');
                if (fileList.length > 0) {
                    const files = []; // Get actual files
                    await api.uploadEvidence(result.complaintId, files);
                }
                
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 2000);
            } catch (error) {
                // Error handled in API client
            }
        });
    }

    // Dashboard data loading
    if (window.location.pathname.includes('dashboard.html')) {
        loadDashboardData();
    }
});

async function loadDashboardData() {
    try {
        // Load stats
        const stats = await api.getDashboardStats();
        updateStats(stats);

        // Load recent complaints
        const complaints = await api.getRecentComplaints();
        updateRecentComplaints(complaints);

        // Load AI insights
        const trends = await api.getCrimeTrends();
        updateInsights(trends);
    } catch (error) {
        showToast('Failed to load dashboard data', 'error');
    }
}

function updateStats(stats) {
    // Update stat cards with real data
    const statCards = document.querySelectorAll('.stat-number');
    if (statCards.length >= 4) {
        statCards[0].textContent = stats.totalComplaints || '0';
        statCards[1].textContent = stats.inProgress || '0';
        statCards[2].textContent = stats.resolved || '0';
        statCards[3].textContent = stats.highPriority || '0';
    }
}

function updateRecentComplaints(complaints) {
    const complaintsList = document.querySelector('.complaints-list');
    if (!complaintsList || !complaints.length) return;

    complaintsList.innerHTML = complaints.map(complaint => `
        <div class="complaint-item">
            <div class="complaint-status status-${complaint.priority.toLowerCase()}">${complaint.priority}</div>
            <div class="complaint-info">
                <h4>${complaint.title}</h4>
                <p>Complaint #${complaint.id} • Filed on ${complaint.date}</p>
            </div>
            <div class="complaint-actions">
                <span class="badge badge-${getStatusClass(complaint.status)}">${complaint.status}</span>
                <button class="btn-icon" onclick="viewComplaint('${complaint.id}')">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function getStatusClass(status) {
    switch(status.toLowerCase()) {
        case 'in progress': return 'warning';
        case 'resolved': return 'success';
        case 'escalated': return 'danger';
        case 'assigned': return 'info';
        default: return 'warning';
    }
}

function updateInsights(trends) {
    // Update AI insights panel
    const insights = document.querySelector('.insights');
    if (!insights || !trends) return;

    // Update with real data
    // This is mock data - replace with actual API response
}

// Track case function
window.trackCase = async function() {
    const caseId = document.querySelector('.tracking-form input').value;
    if (!caseId) {
        showToast('Please enter a Case ID', 'error');
        return;
    }

    try {
        const caseData = await api.trackCase(caseId);
        showToast(`Case Status: ${caseData.status}`, 'info');
    } catch (error) {
        showToast('Case not found', 'error');
    }
};

// View complaint details
window.viewComplaint = function(complaintId) {
    window.location.href = `complaint_details.html?id=${complaintId}`;
};

// Export API instance
window.api = api;