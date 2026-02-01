// Teacher Dashboard JavaScript
const SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
let currentTeacher = 'Prof. Dinesh Kute';
let leavesData = [];
let currentLeaves = [];
let currentRowIndex = null;

// DOM Elements
const menuItems = document.querySelectorAll('.menu-item');
const contentSections = document.querySelectorAll('.content-section');
const teacherNameElement = document.getElementById('teacherName');
const pendingBadge = document.getElementById('pendingBadge');
const approvedBadge = document.getElementById('approvedBadge');
const rejectedBadge = document.getElementById('rejectedBadge');
const searchInput = document.getElementById('searchInput');
const refreshBtn = document.getElementById('refreshBtn');
const logoutBtn = document.getElementById('logoutBtn');
const actionModal = document.getElementById('actionModal');
const closeModal = document.querySelector('.close-modal');
const cancelAction = document.getElementById('cancelAction');
const submitAction = document.getElementById('submitAction');

// Chart instances
let leaveTypeChart = null;
let monthlyTrendChart = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Set current date
    document.getElementById('currentDate').textContent = 
        new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    
    // Set teacher name (in real app, get from login)
    teacherNameElement.textContent = currentTeacher;
    
    // Load data
    loadDashboardData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Setup charts
    setupCharts();
});

// Setup event listeners
function setupEventListeners() {
    // Menu navigation
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.getAttribute('data-section');
            
            // Update active menu item
            menuItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            // Show corresponding section
            contentSections.forEach(s => s.classList.remove('active'));
            document.getElementById(`${section}Section`).classList.add('active');
            
            // Load section data
            if (section !== 'overview') {
                loadSectionData(section);
            }
        });
    });
    
    // Search
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    
    // Refresh
    refreshBtn.addEventListener('click', loadDashboardData);
    
    // Logout
    logoutBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            window.location.href = 'index.html';
        }
    });
    
    // Modal
    closeModal.addEventListener('click', () => {
        actionModal.style.display = 'none';
    });
    
    cancelAction.addEventListener('click', () => {
        actionModal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === actionModal) {
            actionModal.style.display = 'none';
        }
    });
    
    // Submit action
    submitAction.addEventListener('click', handleSubmitAction);
    
    // Filters
    document.getElementById('filterStatus').addEventListener('change', filterRecentLeaves);
    document.getElementById('filterDays').addEventListener('change', filterRecentLeaves);
}

// Load dashboard data
async function loadDashboardData() {
    try {
        showLoading();
        
        // Get all leaves for current teacher
        const response = await fetch(`${SCRIPT_URL}?action=getLeaves&teacher=${encodeURIComponent(currentTeacher)}`);
        leavesData = await response.json();
        currentLeaves = leavesData;
        
        // Update counts
        updateDashboardCounts();
        
        // Load recent leaves
        loadRecentLeaves();
        
        // Update charts
        updateCharts();
        
        // Update badges
        updateBadges();
        
        hideLoading();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        alert('Failed to load dashboard data. Please try again.');
        hideLoading();
    }
}

// Update dashboard counts
function updateDashboardCounts() {
    const pending = leavesData.filter(leave => leave.Status === 'Pending').length;
    const approved = leavesData.filter(leave => leave.Status === 'Approved').length;
    const rejected = leavesData.filter(leave => leave.Status === 'Rejected').length;
    
    document.getElementById('pendingCount').textContent = pending;
    document.getElementById('approvedCount').textContent = approved;
    document.getElementById('rejectedCount').textContent = rejected;
    document.getElementById('totalCount').textContent = leavesData.length;
}

// Update badges
function updateBadges() {
    const pending = leavesData.filter(leave => leave.Status === 'Pending').length;
    const approved = leavesData.filter(leave => leave.Status === 'Approved').length;
    const rejected = leavesData.filter(leave => leave.Status === 'Rejected').length;
    
    pendingBadge.textContent = pending;
    approvedBadge.textContent = approved;
    rejectedBadge.textContent = rejected;
}

// Load recent leaves
function loadRecentLeaves() {
    const tbody = document.getElementById('recentLeavesBody');
    tbody.innerHTML = '';
    
    // Sort by date (newest first) and take top 10
    const recentLeaves = [...leavesData]
        .sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp))
        .slice(0, 10);
    
    recentLeaves.forEach(leave => {
        const row = createLeaveTableRow(leave, true);
        tbody.appendChild(row);
    });
}

// Filter recent leaves
function filterRecentLeaves() {
    const statusFilter = document.getElementById('filterStatus').value;
    const daysFilter = parseInt(document.getElementById('filterDays').value);
    
    const filteredLeaves = leavesData.filter(leave => {
        // Status filter
        if (statusFilter !== 'all' && leave.Status !== statusFilter) {
            return false;
        }
        
        // Days filter
        const leaveDate = new Date(leave.Timestamp);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysFilter);
        
        if (leaveDate < cutoffDate) {
            return false;
        }
        
        return true;
    });
    
    const tbody = document.getElementById('recentLeavesBody');
    tbody.innerHTML = '';
    
    filteredLeaves.slice(0, 10).forEach(leave => {
        const row = createLeaveTableRow(leave, true);
        tbody.appendChild(row);
    });
}

// Create leave table row
function createLeaveTableRow(leave, isOverview = false) {
    const row = document.createElement('tr');
    
    if (!isOverview) {
        row.innerHTML = `
            <td>${formatDate(leave.Timestamp)}</td>
            <td>${leave['Full Name']}</td>
            <td>${leave.PRN}</td>
            <td>${leave.Division}</td>
            <td>${leave['Type of Leave']}</td>
            <td>${formatDate(leave['From Date'])} - ${formatDate(leave['To Date'])}</td>
            <td>${leave['Total Days']}</td>
            <td>${leave['Reason for Leave'] || 'N/A'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-view" onclick="viewLeaveDetails('${leave.PRN}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    ${leave.Status === 'Pending' ? `
                        <button class="btn-action btn-approve" onclick="openActionModal('${leave.PRN}', 'approve')">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="btn-action btn-reject" onclick="openActionModal('${leave.PRN}', 'reject')">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    ` : ''}
                </div>
            </td>
        `;
    } else {
        row.innerHTML = `
            <td>${leave['Full Name']}</td>
            <td>${leave.PRN}</td>
            <td>${leave['Type of Leave']}</td>
            <td>${formatDate(leave['From Date'])} - ${formatDate(leave['To Date'])}</td>
            <td>${leave['Total Days']}</td>
            <td><span class="status-badge status-${leave.Status.toLowerCase()}">${leave.Status}</span></td>
            <td>
                <button class="btn-action btn-view" onclick="viewLeaveDetails('${leave.PRN}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
    }
    
    return row;
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
}

// View leave details
function viewLeaveDetails(prn) {
    const leave = leavesData.find(l => l.PRN === prn);
    if (!leave) return;
    
    const details = `
        <div class="leave-details">
            <h3>Leave Application Details</h3>
            <div class="details-grid">
                <div class="detail-item">
                    <strong>Student Name:</strong> ${leave['Full Name']}
                </div>
                <div class="detail-item">
                    <strong>PRN:</strong> ${leave.PRN}
                </div>
                <div class="detail-item">
                    <strong>Branch:</strong> ${leave.Branch}
                </div>
                <div class="detail-item">
                    <strong>Division:</strong> ${leave.Division}
                </div>
                <div class="detail-item">
                    <strong>Leave Type:</strong> ${leave['Type of Leave']}
                </div>
                <div class="detail-item">
                    <strong>Period:</strong> ${formatDate(leave['From Date'])} to ${formatDate(leave['To Date'])}
                </div>
                <div class="detail-item">
                    <strong>Total Days:</strong> ${leave['Total Days']}
                </div>
                <div class="detail-item">
                    <strong>Status:</strong> ${leave.Status}
                </div>
                <div class="detail-item full-width">
                    <strong>Reason:</strong>
                    <p>${leave['Reason for Leave'] || 'No reason provided'}</p>
                </div>
                ${leave.Remarks ? `
                    <div class="detail-item full-width">
                        <strong>Remarks:</strong>
                        <p>${leave.Remarks}</p>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    // Show in modal or alert
    alert(`Leave Details:\n\nStudent: ${leave['Full Name']}\nPRN: ${leave.PRN}\nLeave Type: ${leave['Type of Leave']}\nStatus: ${leave.Status}\nPeriod: ${formatDate(leave['From Date'])} to ${formatDate(leave['To Date'])}\nReason: ${leave['Reason for Leave'] || 'N/A'}`);
}

// Open action modal
function openActionModal(prn, action) {
    const leave = leavesData.find(l => l.PRN === prn);
    if (!leave) return;
    
    // Find the row index in Google Sheet
    // In a real implementation, you would need to track row indices
    currentRowIndex = leavesData.indexOf(leave) + 2; // +2 for header row
    
    const studentDetails = document.getElementById('studentDetails');
    studentDetails.innerHTML = `
        <h3>Processing Leave for ${leave['Full Name']}</h3>
        <p><strong>PRN:</strong> ${leave.PRN}</p>
        <p><strong>Leave Type:</strong> ${leave['Type of Leave']}</p>
        <p><strong>Period:</strong> ${formatDate(leave['From Date'])} to ${formatDate(leave['To Date'])}</p>
        <p><strong>Total Days:</strong> ${leave['Total Days']}</p>
        <p><strong>Reason:</strong> ${leave['Reason for Leave'] || 'No reason provided'}</p>
    `;
    
    // Set default action
    document.getElementById('actionStatus').value = 
        action === 'approve' ? 'Approved' : action === 'reject' ? 'Rejected' : 'Pending';
    
    actionModal.style.display = 'flex';
}

// Handle submit action
async function handleSubmitAction() {
    const status = document.getElementById('actionStatus').value;
    const remarks = document.getElementById('remarks').value;
    const notifyStudent = document.getElementById('notifyStudent').checked;
    
    try {
        const response = await fetch(
            `${SCRIPT_URL}?action=updateStatus&row=${currentRowIndex}&status=${encodeURIComponent(status)}&remark=${encodeURIComponent(remarks)}`
        );
        
        if (response.ok) {
            alert('Leave status updated successfully!');
            
            // Send email notification if requested
            if (notifyStudent) {
                // Email will be sent by the Google Apps Script
                console.log('Student notification email sent');
            }
            
            // Close modal
            actionModal.style.display = 'none';
            
            // Reload data
            loadDashboardData();
            
            // Clear form
            document.getElementById('remarks').value = '';
        } else {
            throw new Error('Failed to update status');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        alert('Failed to update leave status. Please try again.');
    }
}

// Load section data
function loadSectionData(section) {
    let filteredLeaves = [];
    
    switch(section) {
        case 'pending':
            filteredLeaves = leavesData.filter(leave => leave.Status === 'Pending');
            break;
        case 'approved':
            filteredLeaves = leavesData.filter(leave => leave.Status === 'Approved');
            break;
        case 'rejected':
            filteredLeaves = leavesData.filter(leave => leave.Status === 'Rejected');
            break;
        default:
            filteredLeaves = leavesData;
    }
    
    currentLeaves = filteredLeaves;
    renderSectionTable(section, filteredLeaves);
}

// Render section table
function renderSectionTable(section, leaves) {
    const tbody = document.getElementById(`${section}LeavesBody`);
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    leaves.forEach(leave => {
        const row = createLeaveTableRow(leave, false);
        tbody.appendChild(row);
    });
}

// Handle search
function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (!searchTerm) {
        currentLeaves = leavesData;
    } else {
        currentLeaves = leavesData.filter(leave => 
            leave['Full Name'].toLowerCase().includes(searchTerm) ||
            leave.PRN.toLowerCase().includes(searchTerm) ||
            leave.Branch.toLowerCase().includes(searchTerm) ||
            leave.Division.toLowerCase().includes(searchTerm)
        );
    }
    
    // Update current section table
    const activeSection = document.querySelector('.content-section.active').id.replace('Section', '');
    renderSectionTable(activeSection, currentLeaves);
}

// Setup charts
function setupCharts() {
    // Leave Type Chart
    const leaveTypeCtx = document.getElementById('leaveTypeChart').getContext('2d');
    leaveTypeChart = new Chart(leaveTypeCtx, {
        type: 'pie',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#3949ab',
                    '#ff9800',
                    '#4caf50',
                    '#f44336',
                    '#9c27b0'
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
    
    // Monthly Trend Chart
    const monthlyTrendCtx = document.getElementById('monthlyTrendChart').getContext('2d');
    monthlyTrendChart = new Chart(monthlyTrendCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Leaves',
                data: [],
                borderColor: '#3949ab',
                backgroundColor: 'rgba(57, 73, 171, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Update charts
function updateCharts() {
    // Leave Type Chart
    const leaveTypes = {};
    leavesData.forEach(leave => {
        const type = leave['Type of Leave'] || 'Other';
        leaveTypes[type] = (leaveTypes[type] || 0) + 1;
    });
    
    leaveTypeChart.data.labels = Object.keys(leaveTypes);
    leaveTypeChart.data.datasets[0].data = Object.values(leaveTypes);
    leaveTypeChart.update();
    
    // Monthly Trend Chart
    const monthlyData = {};
    const months = [];
    
    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        months.push(monthKey);
        monthlyData[monthKey] = 0;
    }
    
    // Count leaves per month
    leavesData.forEach(leave => {
        const leaveDate = new Date(leave.Timestamp);
        const monthKey = leaveDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        if (monthlyData.hasOwnProperty(monthKey)) {
            monthlyData[monthKey]++;
        }
    });
    
    monthlyTrendChart.data.labels = months;
    monthlyTrendChart.data.datasets[0].data = months.map(month => monthlyData[month] || 0);
    monthlyTrendChart.update();
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showLoading() {
    // Show loading indicator
    const loading = document.createElement('div');
    loading.id = 'loading';
    loading.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    loading.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px 40px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 1000;
    `;
    document.body.appendChild(loading);
}

function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.remove();
    }
}

// Global functions for onclick handlers
window.viewLeaveDetails = viewLeaveDetails;
window.openActionModal = openActionModal;
