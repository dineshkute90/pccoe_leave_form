// Google Apps Script URL
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzdD0m9B1oIm6psHQEf7U_gcPFi-gHhBTHipKhW2LWLoX-a8-ogz5eL0Yu_1WKjrJkL/exec';

// DOM Elements
let leaveForm, fromDateInput, toDateInput, totalDaysDisplay, workingDaysSpan, totalDaysSpan;
let submitBtn, previewBtn, previewModal, closeModal, previewContent, statusMessage;

// Initialize jsPDF
window.jsPDF = window.jspdf.jsPDF;

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    setupEventListeners();
    setupDateLimits();
    setupCurrentYear();
    debugLogo();
    
    // Clear leave details on page load
    clearLeaveDetails();
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
    
    // Real-time validation for email and PRN
    const emailField = document.getElementById('email');
    const prnField = document.getElementById('prn');
    const contactField = document.getElementById('contact');
    
    if (emailField) {
        emailField.addEventListener('input', validateEmail);
        emailField.addEventListener('blur', validateEmail);
    }
    
    if (prnField) {
        prnField.addEventListener('input', validatePRN);
        prnField.addEventListener('blur', validatePRN);
    }
    
    if (contactField) {
        contactField.addEventListener('input', validateContact);
        contactField.addEventListener('blur', validateContact);
    }
}

function setupDateLimits() {
    // Only set minimum date (today), don't set default values
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    if (fromDateInput) {
        fromDateInput.min = todayStr;
    }
    
    if (toDateInput) {
        toDateInput.min = todayStr;
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

function clearLeaveDetails() {
    // Clear leave details section
    const leaveTypeSelect = document.getElementById('leaveType');
    if (leaveTypeSelect) {
        leaveTypeSelect.value = '';
    }
    
    if (fromDateInput) {
        fromDateInput.value = '';
    }
    
    if (toDateInput) {
        toDateInput.value = '';
    }
    
    // Reset days display
    if (totalDaysDisplay) {
        totalDaysDisplay.value = '0 days';
    }
    
    if (workingDaysSpan) {
        workingDaysSpan.textContent = 'Working days: 0';
    }
    
    if (totalDaysSpan) {
        totalDaysSpan.textContent = 'Total days: 0';
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
    
    if (fromDateInput.value && toDateInput.value && fromDate <= toDate) {
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

function validateEmail() {
    const emailField = document.getElementById('email');
    const emailError = document.getElementById('emailError');
    
    if (!emailField || !emailError) return;
    
    const email = emailField.value.trim();
    const pccoeDomainRegex = /^[a-zA-Z0-9._%+-]+@pccoepune\.org$/i;
    
    // Clear previous error
    emailField.classList.remove('input-error', 'input-success');
    emailError.textContent = '';
    emailError.style.display = 'none';
    
    if (!email) {
        emailField.classList.add('input-error');
        emailError.textContent = 'Email is required';
        emailError.style.display = 'block';
        return false;
    }
    
    if (!pccoeDomainRegex.test(email)) {
        emailField.classList.add('input-error');
        emailError.textContent = 'Only @pccoepune.org email addresses are allowed';
        emailError.style.display = 'block';
        return false;
    }
    
    // Email is valid
    emailField.classList.add('input-success');
    return true;
}

function validatePRN() {
    const prnField = document.getElementById('prn');
    const prnError = document.getElementById('prnError');
    
    if (!prnField || !prnError) return;
    
    const prn = prnField.value.trim().toUpperCase();
    const prnRegex = /^[0-9]{3}[A-Z]{1}[0-9]{1}[A-Z]{1}[0-9]{3}$/;
    
    // Clear previous error
    prnField.classList.remove('input-error', 'input-success');
    prnError.textContent = '';
    prnError.style.display = 'none';
    
    if (!prn) {
        prnField.classList.add('input-error');
        prnError.textContent = 'PRN is required';
        prnError.style.display = 'block';
        return false;
    }
    
    if (!prnRegex.test(prn)) {
        prnField.classList.add('input-error');
        prnError.textContent = 'PRN must be 9 characters in format: 124B1F048';
        prnError.style.display = 'block';
        return false;
    }
    
    // PRN is valid
    prnField.classList.add('input-success');
    return true;
}

function validateContact() {
    const contactField = document.getElementById('contact');
    const contactError = document.getElementById('contactError');
    
    if (!contactField || !contactError) return;
    
    const contact = contactField.value.trim();
    const contactRegex = /^[0-9]{10}$/;
    
    // Clear previous error
    contactField.classList.remove('input-error', 'input-success');
    contactError.textContent = '';
    contactError.style.display = 'none';
    
    if (!contact) {
        contactField.classList.add('input-error');
        contactError.textContent = 'Contact number is required';
        contactError.style.display = 'block';
        return false;
    }
    
    if (!contactRegex.test(contact)) {
        contactField.classList.add('input-error');
        contactError.textContent = 'Contact must be exactly 10 digits';
        contactError.style.display = 'block';
        return false;
    }
    
    // Contact is valid
    contactField.classList.add('input-success');
    return true;
}

function validateAllFields() {
    const isEmailValid = validateEmail();
    const isPRNValid = validatePRN();
    const isContactValid = validateContact();
    
    return isEmailValid && isPRNValid && isContactValid;
}

function showPreview() {
    if (!leaveForm || !leaveForm.checkValidity()) {
        showMessage('Please fill all required fields correctly', 'error');
        leaveForm.reportValidity();
        return;
    }
    
    // Validate specific fields
    if (!validateAllFields()) {
        showMessage('Please correct the highlighted fields', 'error');
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
    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    
    // Extract teacher name without division
    const classTeacherFull = formData.get('classTeacher') || '';
    const classTeacherName = classTeacherFull.split(' (')[0] || classTeacherFull;
    
    // Extract student name
    const studentName = formData.get('fullName') || '';
    
    return `
        <div class="preview-document">
            <!-- College Header -->
            <div class="preview-college-header" style="text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #1a237e 0%, #283593 100%); color: white; border-radius: 10px; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15); border-left: 6px solid #ff9800; border-right: 6px solid #ff9800;">
                <h1 style="font-size: 18px; margin-bottom: 3px; font-weight: 500; color: #ffffff; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);">Pimpri Chinchwad Education Trust's</h1>
                <h2 style="font-size: 24px; margin-top: 3px; margin-bottom: 3px; font-weight: 700; color: white !important; text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3); letter-spacing: 0.5px;">Pimpri Chinchwad College of Engineering</h2>
                <p style="font-size: 16px; margin-top: 3px; font-weight: 500; color: #f0f0f0; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);">Department of Applied Sciences & Humanities</p>
                <div style="margin-top: 15px; font-size: 22px; font-weight: 700; background: linear-gradient(135deg, rgba(255, 152, 0, 0.95) 0%, rgba(255, 167, 38, 0.95) 100%); color: #1a237e; padding: 10px 20px; border-radius: 25px; border: 2px solid rgba(255, 255, 255, 0.4); box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2); text-shadow: 1px 1px 1px rgba(255, 255, 255, 0.3); display: inline-block;">
                    2025–26
                </div>
            </div>
            
            <!-- Form Title -->
            <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e8eaf6;">
                <h1 style="color: #1a237e; font-size: 2.2rem; margin-bottom: 10px;">
                    <i class="fas fa-file-alt"></i> Leave Application Form
                </h1>
                <p style="color: #666; font-size: 1.1rem;">
                    Fill all details accurately. Leave will be processed by your Class Teacher.
                </p>
            </div>
            
            <!-- Generated Date -->
            <div style="text-align: right; margin-bottom: 20px; color: #666; font-size: 0.9rem;">
                Generated on: ${currentDate}
            </div>
            
            <div class="preview-section" style="margin-bottom: 20px; padding: 20px; background: #f8f9fa; border-radius: 10px; border: 1px solid #e0e0e0;">
                <h3 style="color: #3949ab; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 15px;">
                    <i class="fas fa-user-graduate"></i> Student Information
                </h3>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 15px;">
                    <div><strong>Academic Year:</strong> ${formData.get('academicYear')}</div>
                    <div><strong>Semester:</strong> ${formData.get('semester')}</div>
                    <div><strong>PRN:</strong> ${formData.get('prn')}</div>
                    <div><strong>Full Name:</strong> ${studentName}</div>
                    <div><strong>Division:</strong> ${formData.get('division')}</div>
                    <div><strong>Branch:</strong> ${formData.get('branch')}</div>
                    <div><strong>Email:</strong> ${formData.get('email')}</div>
                    <div><strong>Contact:</strong> ${formData.get('contact')}</div>
                </div>
            </div>
            
            <div class="preview-section" style="margin-bottom: 20px; padding: 20px; background: #f8f9fa; border-radius: 10px; border: 1px solid #e0e0e0;">
                <h3 style="color: #3949ab; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 15px;">
                    <i class="fas fa-chalkboard-teacher"></i> Teacher Information
                </h3>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 15px;">
                    <div><strong>Class Teacher:</strong> ${formData.get('classTeacher')}</div>
                    <div><strong>Associate Teacher:</strong> ${formData.get('associateTeacher') || 'N/A'}</div>
                </div>
            </div>
            
            <div class="preview-section" style="margin-bottom: 20px; padding: 20px; background: #f8f9fa; border-radius: 10px; border: 1px solid #e0e0e0;">
                <h3 style="color: #3949ab; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 15px;">
                    <i class="fas fa-calendar-alt"></i> Leave Details
                </h3>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 15px;">
                    <div><strong>Leave Type:</strong> ${formData.get('leaveType')}</div>
                    <div><strong>From Date:</strong> ${formData.get('fromDate')}</div>
                    <div><strong>To Date:</strong> ${formData.get('toDate')}</div>
                    <div><strong>Total Days:</strong> ${days.totalDays} (${days.workingDays} working days)</div>
                </div>
                <div style="margin-top: 15px;">
                    <strong>Reason:</strong>
                    <p style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 5px; white-space: pre-wrap;">
                        ${formData.get('reason')}
                    </p>
                </div>
            </div>
            
            <div class="preview-footer" style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e0e0e0;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="flex: 1;">
                        <p><strong>Student Signature:</strong></p>
                        <div style="margin-top: 60px; border-top: 1px solid #000; width: 200px; padding-top: 5px; text-align: center;">
                            ${studentName}
                        </div>
                        <p style="margin-top: 30px;"><strong>Date:</strong> ${currentDate}</p>
                    </div>
                    <div style="flex: 1; text-align: right;">
                        <p><strong>Class Teacher Signature:</strong></p>
                        <div style="margin-top: 60px; border-top: 1px solid #000; width: 200px; margin-left: auto; padding-top: 5px; text-align: center;">
                            ${classTeacherName}
                        </div>
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
    
    // Validate specific fields
    if (!validateAllFields()) {
        showMessage('Please correct the highlighted fields before submitting', 'error');
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
                    @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
                    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
                    body { font-family: 'Poppins', sans-serif; padding: 20px; line-height: 1.6; }
                    .preview-section { margin-bottom: 30px; }
                    h3 { color: #1a237e; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                    strong { color: #333; }
                    p { margin: 5px 0; }
                    .preview-college-header { text-align: center; margin-bottom: 30px; }
                    .preview-footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e0e0e0; }
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
    const element = document.getElementById('previewContent');
    
    if (!element) {
        showMessage('Preview content not found', 'error');
        return;
    }
    
    // Show loading message
    showMessage('Generating PDF...', 'info');
    
    // Use html2canvas to capture the content
    html2canvas(element, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        let heightLeft = imgHeight;
        let position = 0;
        
        // Add first page
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        // Add extra pages if content is too long
        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }
        
        // Save the PDF
        const fileName = `Leave_Application_${document.getElementById('fullName').value || 'Student'}.pdf`;
        pdf.save(fileName);
        
        showMessage('PDF downloaded successfully!', 'success');
        
        // Auto-hide message after 3 seconds
        setTimeout(() => {
            if (statusMessage) statusMessage.style.display = 'none';
        }, 3000);
        
    }).catch(error => {
        console.error('Error generating PDF:', error);
        showMessage('Error generating PDF. Please try Print Preview instead.', 'error');
    });
}

function resetForm() {
    if (leaveForm) {
        leaveForm.reset();
        
        // Clear all error states
        const errorFields = document.querySelectorAll('.input-error, .input-success');
        errorFields.forEach(field => {
            field.classList.remove('input-error', 'input-success');
        });
        
        // Clear error messages
        const errorMessages = document.querySelectorAll('.error-message');
        errorMessages.forEach(error => {
            error.textContent = '';
            error.style.display = 'none';
        });
    }
    
    // Clear leave details
    clearLeaveDetails();
    
    // Set current year
    setupCurrentYear();
    
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
