// Google Apps Script URL
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzdD0m9B1oIm6psHQEf7U_gcPFi-gHhBTHipKhW2LWLoX-a8-ogz5eL0Yu_1WKjrJkL/exec';

// DOM Elements
let leaveForm, fromDateInput, toDateInput, totalDaysDisplay, workingDaysSpan, totalDaysSpan;
let submitBtn, previewBtn, previewModal, closeModal, previewContent, statusMessage;

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    setupEventListeners();
    setupDateLimits();
    setupCurrentYear();
    debugLogo();
});

function initializeElements() {
    // Get all DOM elements
    leaveForm = document.getElementById('leaveForm');
    fromDateInput = document.getElementById('fromDate');
    toDateInput = document.getElementById('toDate');
    totalDaysDisplay = document.getElementById('totalDays');
    workingDaysSpan = document.getElementById('workingDays');
    totalDaysSpan = document.getElementById('totalDaysCount');
    submitBtn = document.getElementById('submitBtn');
    previewBtn = document.getElementById('previewBtn');
    previewModal = document.getElementById('previewModal');
    closeModal = document.querySelector('.close-modal');
    previewContent = document.getElementById('previewContent');
    statusMessage = document.getElementById('status-message');
}

function setupEventListeners() {
    // Calculate days when dates change
    if (fromDateInput) fromDateInput.addEventListener('change', updateDateMin);
    if (toDateInput) toDateInput.addEventListener('change', calculateTotalDays);
    
    // Preview functionality
    if (previewBtn) previewBtn.addEventListener('click', showPreview);
    
    // Form submission
    if (leaveForm) leaveForm.addEventListener('submit', handleFormSubmit);
    
    // Modal close
    if (closeModal) closeModal.addEventListener('click', () => {
        if (previewModal) previewModal.style.display = 'none';
    });
    
    // Window click to close modal
    window.addEventListener('click', (e) => {
        if (e.target === previewModal) {
            previewModal.style.display = 'none';
        }
    });
    
    // Print and Download buttons
    const printBtn = document.getElementById('printPreview');
    const downloadBtn = document.getElementById('downloadPDF');
    
    if (printBtn) printBtn.addEventListener('click', printPreview);
    if (downloadBtn) downloadBtn.addEventListener('click', downloadAsPDF);
    
    // Reset button
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) resetBtn.addEventListener('click', resetForm);
}

function setupDateLimits() {
    // Set today's date as minimum
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    if (fromDateInput) {
        fromDateInput.min = todayStr;
        fromDateInput.value = todayStr;
    }
    if (toDateInput) {
        toDateInput.min = todayStr;
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        toDateInput.value = tomorrow.toISOString().split('T')[0];
    }
    
    // Calculate initial total days
    calculateTotalDays();
}

function setupCurrentYear() {
    // Set academic year in form
    const academicYearSelect = document.getElementById('academicYear');
    if (academicYearSelect) {
        academicYearSelect.value = '2025-2026';
    }
}

function updateDateMin() {
    if (!fromDateInput || !toDateInput) return;
    
    toDateInput.min = fromDateInput.value;
    if (new Date(toDateInput.value) < new Date(fromDateInput.value)) {
        toDateInput.value = fromDateInput.value;
    }
    calculateTotalDays();
}

function calculateTotalDays() {
    if (!fromDateInput || !toDateInput || !totalDaysDisplay || !workingDaysSpan || !totalDaysSpan) return;
    
    const fromDate = new Date(fromDateInput.value);
    const toDate = new Date(toDateInput.value);
    
    if (fromDate && toDate && fromDate <= toDate) {
        const timeDiff = toDate.getTime() - fromDate.getTime();
        const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
        
        // Calculate working days (exclude weekends)
        let workingDays = 0;
        let currentDate = new Date(fromDate);
        
        for (let i = 0; i < totalDays; i++) {
            const dayOfWeek = currentDate.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                workingDays++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Update displays
        if (totalDaysDisplay) {
            totalDaysDisplay.value = `${totalDays} day${totalDays !== 1 ? 's' : ''}`;
        }
        if (workingDaysSpan) workingDaysSpan.textContent = `Working days: ${workingDays}`;
        if (totalDaysSpan) totalDaysSpan.textContent = `Total days: ${totalDays}`;
        
        return { totalDays, workingDays };
    } else {
        if (totalDaysDisplay) totalDaysDisplay.value = '0 days';
        if (workingDaysSpan) workingDaysSpan.textContent = 'Working days: 0';
        if (totalDaysSpan) totalDaysSpan.textContent = 'Total days: 0';
        return { totalDays: 0, workingDays: 0 };
    }
}

function showPreview() {
    if (!leaveForm || !leaveForm.checkValidity()) {
        showMessage('Please fill all required fields correctly', 'error');
        leaveForm.reportValidity();
        return;
    }
    
    const formData = new FormData(leaveForm);
    const previewHTML = generatePreviewHTML(formData);
    
    if (previewContent) {
        previewContent.innerHTML = previewHTML;
    }
    
    if (previewModal) {
        previewModal.style.display = 'flex';
    }
}

function generatePreviewHTML(formData) {
    const days = calculateTotalDays();
    
    return `
        <div class="preview-document">
            <div class="preview-header" style="text-align: center; margin-bottom: 30px; padding: 20px; background: #f5f5f5; border-radius: 10px;">
                <h2 style="color: #1a237e; margin-bottom: 10px;">Leave Application Preview</h2>
                <p style="color: #666;">Generated on ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="preview-section" style="margin-bottom: 20px;">
                <h3 style="color: #3949ab; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px;">
                    Student Information
                </h3>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 15px;">
                    <div><strong>Academic Year:</strong> ${formData.get('academicYear')}</div>
                    <div><strong>Semester:</strong> ${formData.get('semester')}</div>
                    <div><strong>PRN:</strong> ${formData.get('prn')}</div>
                    <div><strong>Full Name:</strong> ${formData.get('fullName')}</div>
                    <div><strong>Division:</strong> ${formData.get('division')}</div>
                    <div><strong>Branch:</strong> ${formData.get('branch')}</div>
                    <div><strong>Email:</strong> ${formData.get('email')}</div>
                    <div><strong>Contact:</strong> ${formData.get('contact')}</div>
                </div>
            </div>
            
            <div class="preview-section" style="margin-bottom: 20px;">
                <h3 style="color: #3949ab; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px;">
                    Teacher Information
                </h3>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 15px;">
                    <div><strong>Class Teacher:</strong> ${formData.get('classTeacher')}</div>
                    <div><strong>Associate Teacher:</strong> ${formData.get('associateTeacher') || 'N/A'}</div>
                </div>
            </div>
            
            <div class="preview-section" style="margin-bottom: 20px;">
                <h3 style="color: #3949ab; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px;">
                    Leave Details
                </h3>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 15px;">
                    <div><strong>Leave Type:</strong> ${formData.get('leaveType')}</div>
                    <div><strong>From Date:</strong> ${formData.get('fromDate')}</div>
                    <div><strong>To Date:</strong> ${formData.get('toDate')}</div>
                    <div><strong>Total Days:</strong> ${days.totalDays} (${days.workingDays} working days)</div>
                </div>
                <div style="margin-top: 15px;">
                    <strong>Reason:</strong>
                    <p style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 5px;">
                        ${formData.get('reason')}
                    </p>
                </div>
            </div>
            
            <div class="preview-footer" style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e0e0e0;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <p><strong>Student Signature:</strong> ________________</p>
                        <p style="margin-top: 30px;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                    </div>
                    <div style="text-align: right;">
                        <p><strong>Class Teacher Signature:</strong> ________________</p>
                        <p><strong>Status:</strong> <span style="color: #ff9800; font-weight: bold;">Pending</span></p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!leaveForm || !leaveForm.checkValidity()) {
        showMessage('Please fill all required fields correctly', 'error');
        leaveForm.reportValidity();
        return;
    }
    
    if (!submitBtn) return;
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    
    try {
        const formData = new FormData(leaveForm);
        const days = calculateTotalDays();
        
        // Prepare data for Google Sheets
        const rowData = {
            timestamp: new Date().toISOString(),
            academicYear: formData.get('academicYear'),
            semester: formData.get('semester'),
            prn: formData.get('prn'),
            fullName: formData.get('fullName'),
            division: formData.get('division'),
            branch: formData.get('branch'),
            email: formData.get('email'),
            contact: formData.get('contact'),
            classTeacher: formData.get('classTeacher'),
            associateTeacher: formData.get('associateTeacher') || '',
            leaveType: formData.get('leaveType'),
            fromDate: formData.get('fromDate'),
            toDate: formData.get('toDate'),
            totalDays: days.totalDays,
            workingDays: days.workingDays,
            reason: formData.get('reason'),
            status: 'Pending'
        };
        
        console.log('Submitting data:', rowData);
        
        // Send to Google Sheets via Apps Script
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(rowData)
        });
        
        showMessage('Leave application submitted successfully! You will receive an email confirmation shortly.', 'success');
        
        // Reset form
        resetForm();
        
        // Auto-hide message after 5 seconds
        setTimeout(() => {
            if (statusMessage) statusMessage.style.display = 'none';
        }, 5000);
        
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error submitting form. Please try again.', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Leave Application';
        }
    }
}

function printPreview() {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Leave Application - ${document.getElementById('fullName').value}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
                    .preview-section { margin-bottom: 30px; }
                    h3 { color: #1a237e; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                    strong { color: #333; }
                    p { margin: 5px 0; }
                    .preview-header { text-align: center; margin-bottom: 30px; }
                </style>
            </head>
            <body>
                ${previewContent.innerHTML}
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

function downloadAsPDF() {
    showMessage('PDF download feature requires additional setup. For now, please use Print Preview and save as PDF.', 'info');
}

function resetForm() {
    if (leaveForm) leaveForm.reset();
    setupDateLimits();
    calculateTotalDays();
    showMessage('Form has been reset', 'info');
    
    setTimeout(() => {
        if (statusMessage) statusMessage.style.display = 'none';
    }, 3000);
}

function showMessage(message, type = 'info') {
    if (!statusMessage) return;
    
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    statusMessage.style.display = 'block';
    
    // Auto-hide success/info messages after 5 seconds
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 5000);
    }
}

// Logo debug function
function debugLogo() {
    const logo = document.querySelector('.college-logo');
    if (logo) {
        console.log('Logo element found:', logo);
        console.log('Logo src:', logo.src);
        console.log('Logo complete:', logo.complete);
        console.log('Logo natural dimensions:', logo.naturalWidth, 'x', logo.naturalHeight);
        
        logo.onload = function() {
            console.log('Logo loaded successfully!');
            console.log('Actual dimensions:', this.width, 'x', this.height);
        };
        
        logo.onerror = function() {
            console.error('Logo failed to load from:', this.src);
            
            // Try alternative paths
            const fallbackPaths = [
                'https://raw.githubusercontent.com/dineshkute90/pccoe_fy_contact_details/main/pccoe_logo.png',
                './pccoe_logo.png',
                'pccoe_logo.png',
                'https://via.placeholder.com/95x95/1a237e/ffffff?text=PCCOE'
            ];
            
            let currentSrc = this.src;
            let triedPaths = [currentSrc];
            
            for (let path of fallbackPaths) {
                if (!triedPaths.includes(path)) {
                    console.log('Trying alternative path:', path);
                    this.src = path;
                    break;
                }
            }
        };
        
        // Check if already loaded
        if (logo.complete) {
            if (logo.naturalHeight === 0) {
                console.error('Logo appears to be broken');
                logo.onerror();
            } else {
                console.log('Logo already loaded');
            }
        }
    } else {
        console.error('Logo element not found in DOM');
    }
}

// Add form validation improvements
if (leaveForm) {
    const inputs = leaveForm.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('invalid', function(e) {
            e.preventDefault();
            this.style.borderColor = '#c62828';
            showMessage(`Please fill in "${this.previousElementSibling?.textContent || 'this field'}" correctly.`, 'error');
        });
        
        input.addEventListener('input', function() {
            this.style.borderColor = '#ddd';
        });
    });
}
