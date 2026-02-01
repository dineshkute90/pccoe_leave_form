// Google Sheets Configuration
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE';
const API_KEY = 'YOUR_GOOGLE_API_KEY_HERE';
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzdD0m9B1oIm6psHQEf7U_gcPFi-gHhBTHipKhW2LWLoX-a8-ogz5eL0Yu_1WKjrJkL/exec';

// DOM Elements
const leaveForm = document.getElementById('leaveForm');
const fromDateInput = document.getElementById('fromDate');
const toDateInput = document.getElementById('toDate');
const totalDaysDisplay = document.getElementById('totalDays');
const workingDaysSpan = document.getElementById('workingDays');
const totalDaysSpan = document.getElementById('totalDaysCount');
const submitBtn = document.getElementById('submitBtn');
const previewBtn = document.getElementById('previewBtn');
const previewModal = document.getElementById('previewModal');
const closeModal = document.querySelector('.close-modal');
const previewContent = document.getElementById('previewContent');
const statusMessage = document.getElementById('status-message');
const fileUploadArea = document.getElementById('fileUploadArea');
const fileInput = document.getElementById('supportingDocs');
const fileList = document.getElementById('fileList');

// Initialize current year
document.getElementById('current-year').textContent = 
document.getElementById('current-year-footer').textContent = 
    new Date().getFullYear() + '-' + (new Date().getFullYear() + 1);

// Set date limits (can't select past dates)
const today = new Date().toISOString().split('T')[0];
fromDateInput.min = today;
toDateInput.min = today;

// Calculate total days function
function calculateTotalDays() {
    const fromDate = new Date(fromDateInput.value);
    const toDate = new Date(toDateInput.value);
    
    if (fromDate && toDate && fromDate <= toDate) {
        // Calculate total days including start and end
        const timeDiff = toDate.getTime() - fromDate.getTime();
        const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
        
        // Calculate working days (exclude weekends)
        let workingDays = 0;
        let currentDate = new Date(fromDate);
        
        for (let i = 0; i < totalDays; i++) {
            const dayOfWeek = currentDate.getDay();
            // 0 = Sunday, 6 = Saturday
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                workingDays++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Update displays
        totalDaysDisplay.value = `${totalDays} day${totalDays !== 1 ? 's' : ''}`;
        workingDaysSpan.textContent = `Working days: ${workingDays}`;
        totalDaysSpan.textContent = `Total days: ${totalDays}`;
        
        return { totalDays, workingDays };
    } else {
        totalDaysDisplay.value = '0 days';
        workingDaysSpan.textContent = 'Working days: 0';
        totalDaysSpan.textContent = 'Total days: 0';
        return { totalDays: 0, workingDays: 0 };
    }
}

// Calculate days when dates change
fromDateInput.addEventListener('change', () => {
    toDateInput.min = fromDateInput.value;
    calculateTotalDays();
});

toDateInput.addEventListener('change', calculateTotalDays);

// File upload handling
fileUploadArea.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', () => {
    fileList.innerHTML = '';
    const files = Array.from(fileInput.files);
    
    if (files.length > 5) {
        showMessage('Maximum 5 files allowed', 'error');
        fileInput.value = '';
        return;
    }
    
    files.forEach((file, index) => {
        if (file.size > 5 * 1024 * 1024) {
            showMessage(`File "${file.name}" exceeds 5MB limit`, 'error');
            return;
        }
        
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <i class="fas fa-file"></i>
            <span>${file.name} (${formatFileSize(file.size)})</span>
            <button class="remove-file" data-index="${index}">
                <i class="fas fa-times"></i>
            </button>
        `;
        fileList.appendChild(fileItem);
    });
    
    // Add remove functionality
    document.querySelectorAll('.remove-file').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            const files = Array.from(fileInput.files);
            files.splice(index, 1);
            
            // Create new FileList (requires workaround)
            const dataTransfer = new DataTransfer();
            files.forEach(file => dataTransfer.items.add(file));
            fileInput.files = dataTransfer.files;
            
            // Re-render file list
            fileInput.dispatchEvent(new Event('change'));
        });
    });
});

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Preview functionality
previewBtn.addEventListener('click', () => {
    if (!leaveForm.checkValidity()) {
        leaveForm.reportValidity();
        return;
    }
    
    const formData = new FormData(leaveForm);
    const previewHTML = generatePreviewHTML(formData);
    previewContent.innerHTML = previewHTML;
    previewModal.style.display = 'flex';
});

// Generate preview HTML
function generatePreviewHTML(formData) {
    const days = calculateTotalDays();
    
    return `
        <div class="preview-document">
            <div class="preview-header" style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #1a237e;">Leave Application Preview</h2>
                <p style="color: #666;">Generated on ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="preview-section">
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
            
            <div class="preview-section" style="margin-top: 25px;">
                <h3 style="color: #3949ab; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px;">
                    Teacher Information
                </h3>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 15px;">
                    <div><strong>Class Teacher:</strong> ${formData.get('classTeacher')}</div>
                    <div><strong>Associate Teacher:</strong> ${formData.get('associateTeacher') || 'N/A'}</div>
                </div>
            </div>
            
            <div class="preview-section" style="margin-top: 25px;">
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
                <div style="margin-top: 15px;">
                    <strong>Supporting Documents:</strong>
                    <p>${fileInput.files.length} file(s) attached</p>
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
                        <p><strong>Status:</strong> <span style="color: #ff9800;">Pending</span></p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Close modal
closeModal.addEventListener('click', () => {
    previewModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === previewModal) {
        previewModal.style.display = 'none';
    }
});

// Print and Download buttons
document.getElementById('printPreview').addEventListener('click', () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Leave Application - ${document.getElementById('fullName').value}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .preview-section { margin-bottom: 30px; }
                    h3 { color: #1a237e; }
                    strong { color: #333; }
                </style>
            </head>
            <body>
                ${previewContent.innerHTML}
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
});

document.getElementById('downloadPDF').addEventListener('click', () => {
    showMessage('PDF download feature requires additional setup with a PDF generation library.', 'info');
});

// Form submission
leaveForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!leaveForm.checkValidity()) {
        leaveForm.reportValidity();
        return;
    }
    
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
            supportingDocs: fileInput.files.length,
            status: 'Pending'
        };
        
        // Send to Google Sheets via Apps Script
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(rowData)
        });
        
        if (response.ok) {
            showMessage('Leave application submitted successfully! You will receive an email confirmation.', 'success');
            
            // Send confirmation email (via Apps Script)
            await sendEmailConfirmation(rowData);
            
            // Reset form
            leaveForm.reset();
            fileList.innerHTML = '';
            calculateTotalDays();
            
            // Auto-refresh after 5 seconds
            setTimeout(() => {
                statusMessage.style.display = 'none';
            }, 5000);
        } else {
            throw new Error('Failed to submit form');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error submitting form. Please try again.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Leave Application';
    }
});

// Send email confirmation
async function sendEmailConfirmation(data) {
    try {
        const emailResponse = await fetch(`${SCRIPT_URL}?action=sendEmail`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to: data.email,
                subject: `Leave Application Submitted - ${data.fullName}`,
                body: `
Dear ${data.fullName},

Your leave application has been successfully submitted with the following details:

- Leave Type: ${data.leaveType}
- Period: ${data.fromDate} to ${data.toDate}
- Total Days: ${data.totalDays} (${data.workingDays} working days)
- Submitted on: ${new Date().toLocaleDateString()}

Your application is now pending approval from ${data.classTeacher}.

You will receive another email once your application is reviewed.

Thank you,
PCCOE Leave Management System
Department of Applied Sciences & Humanities
                `
            })
        });
        
        if (!emailResponse.ok) {
            console.warn('Email sending failed, but form was saved');
        }
    } catch (error) {
        console.warn('Email error:', error);
    }
}

// Show status messages
function showMessage(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    statusMessage.style.display = 'block';
    
    if (type !== 'info') {
        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 5000);
    }
}

// Form validation improvements
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

// Initialize
calculateTotalDays();
