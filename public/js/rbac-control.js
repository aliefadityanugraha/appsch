// RBAC Control JavaScript - TUKIN SMATAJAYA

// Global state
let permissionChanges = new Map();
let currentRoles = [];

// Initialize on page load
$(document).ready(function() {
    initializePermissionMatrix();
    initializeUserSearch();
    initializeAuditLog();
    loadRoleDistribution();
});

// ========================================
// PERMISSION MATRIX FUNCTIONS
// ========================================

function initializePermissionMatrix() {
    $('.permission-switch').on('change', function() {
        const roleId = $(this).data('role');
        const permission = $(this).data('permission');
        const isChecked = $(this).is(':checked');
        
        // Track changes
        const key = `${roleId}-${permission}`;
        permissionChanges.set(key, {
            roleId,
            permission,
            enabled: isChecked
        });
        
        // Visual feedback
        $(this).closest('.permission-cell').addClass('changed');
        updateSaveButton();
    });
}

function selectAllPermissions() {
    $('.permission-switch').prop('checked', true).each(function() {
        $(this).trigger('change');
    });
}

function clearAllPermissions() {
    $('.permission-switch').prop('checked', false).each(function() {
        $(this).trigger('change');
    });
}

function copyPermissions() {
    const sourceRole = prompt('Enter source role ID to copy from:');
    if (!sourceRole) return;
    
    const targetRoles = prompt('Enter target role IDs (comma-separated):');
    if (!targetRoles) return;
    
    // Get source permissions
    const sourcePermissions = [];
    $(`.permission-switch[data-role="${sourceRole}"]`).each(function() {
        if ($(this).is(':checked')) {
            sourcePermissions.push($(this).data('permission'));
        }
    });
    
    // Apply to target roles
    targetRoles.split(',').forEach(targetRole => {
        targetRole = targetRole.trim();
        $(`.permission-switch[data-role="${targetRole}"]`).each(function() {
            const permission = $(this).data('permission');
            const shouldCheck = sourcePermissions.includes(permission);
            $(this).prop('checked', shouldCheck).trigger('change');
        });
    });
    
    showNotification('Permissions copied successfully!', 'success');
}

async function savePermissionMatrix() {
    if (permissionChanges.size === 0) {
        showNotification('No changes to save', 'info');
        return;
    }
    
    const changes = Array.from(permissionChanges.values());
    
    try {
        const response = await fetch('/api/rbac/permission-matrix', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': document.querySelector('input[name="_token"]').value
            },
            body: JSON.stringify({ changes })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Permission matrix saved successfully!', 'success');
            $('.permission-cell').removeClass('changed');
            permissionChanges.clear();
            updateSaveButton();
        } else {
            showNotification('Failed to save: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Save error:', error);
        showNotification('Error saving permissions', 'error');
    }
}

function updateSaveButton() {
    const saveBtn = $('#savePermissionsBtn');
    if (permissionChanges.size > 0) {
        saveBtn.removeClass('btn-success').addClass('btn-warning');
        saveBtn.html(`💾 Save Changes (${permissionChanges.size})`);
    } else {
        saveBtn.removeClass('btn-warning').addClass('btn-success');
        saveBtn.html('💾 Save Changes');
    }
}

// ========================================
// USER ASSIGNMENT FUNCTIONS
// ========================================

function initializeUserSearch() {
    let searchTimeout;
    
    $('#userSearch').on('input', function() {
        clearTimeout(searchTimeout);
        const searchTerm = $(this).val().trim();
        
        if (searchTerm.length < 2) {
            $('#userList').html(getEmptySearchState());
            return;
        }
        
        searchTimeout = setTimeout(() => searchUsers(searchTerm), 300);
    });
}

async function searchUsers(query) {
    $('#userList').html('<div class="text-center py-3"><div class="spinner-border spinner-border-sm"></div> Searching...</div>');
    
    try {
        const response = await fetch(`/api/rbac/search-users?query=${encodeURIComponent(query)}`);
        const result = await response.json();
        
        if (result.success && result.users.length > 0) {
            renderUserList(result.users);
        } else {
            $('#userList').html('<div class="text-center text-muted py-3">No users found</div>');
        }
    } catch (error) {
        console.error('Search error:', error);
        $('#userList').html('<div class="text-center text-danger py-3">Error searching users</div>');
    }
}

function renderUserList(users) {
    const html = users.map(user => `
        <div class="list-group-item">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>${escapeHtml(user.name)}</strong>
                    <br><small class="text-muted">${escapeHtml(user.email)}</small>
                    ${user.currentRole ? `<br><span class="badge bg-info">${escapeHtml(user.currentRole.name)}</span>` : ''}
                </div>
                <select class="form-select form-select-sm" style="width: 200px;" 
                        onchange="assignRole('${user.id}', this.value)">
                    <option value="">Select Role</option>
                    ${window.availableRoles.map(role => `
                        <option value="${role.id}" ${user.currentRole && user.currentRole.id === role.id ? 'selected' : ''}>
                            ${escapeHtml(role.role)}
                        </option>
                    `).join('')}
                </select>
            </div>
        </div>
    `).join('');
    
    $('#userList').html(`<div class="list-group">${html}</div>`);
}

async function assignRole(userId, roleId) {
    if (!roleId) return;
    
    try {
        const response = await fetch('/api/rbac/assign-role', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': document.querySelector('input[name="_token"]').value
            },
            body: JSON.stringify({ userId, roleId })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(result.message, 'success');
            loadRoleDistribution();
        } else {
            showNotification('Failed to assign role: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Assign error:', error);
        showNotification('Error assigning role', 'error');
    }
}

async function loadRoleDistribution() {
    try {
        const response = await fetch('/api/rbac/role-stats');
        const result = await response.json();
        
        if (result.success) {
            renderRoleDistribution(result.distribution);
        }
    } catch (error) {
        console.error('Load distribution error:', error);
    }
}

function renderRoleDistribution(distribution) {
    const html = distribution.map(item => `
        <div class="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded">
            <span><strong>${escapeHtml(item.roleName)}</strong></span>
            <span class="badge bg-primary">${item.userCount} users</span>
        </div>
    `).join('');
    
    $('#roleDistribution').html(html);
}

// ========================================
// AUDIT LOG FUNCTIONS
// ========================================

function initializeAuditLog() {
    $('#auditFilter, #auditDate').on('change', loadAuditLog);
    loadAuditLog();
}

async function loadAuditLog() {
    const filter = $('#auditFilter').val();
    const date = $('#auditDate').val();
    
    $('#auditEntries').html('<div class="text-center py-3"><div class="spinner-border spinner-border-sm"></div> Loading...</div>');
    
    try {
        const params = new URLSearchParams();
        if (filter && filter !== 'all') params.append('filter', filter);
        if (date) params.append('date', date);
        
        const response = await fetch(`/api/rbac/audit-trail?${params}`);
        const result = await response.json();
        
        if (result.success) {
            renderAuditLog(result.entries);
        } else {
            $('#auditEntries').html('<div class="text-center text-danger py-3">Failed to load audit log</div>');
        }
    } catch (error) {
        console.error('Audit log error:', error);
        $('#auditEntries').html('<div class="text-center text-danger py-3">Error loading audit log</div>');
    }
}

function renderAuditLog(entries) {
    if (entries.length === 0) {
        $('#auditEntries').html('<div class="text-center text-muted py-4"><i class="bi bi-inbox"></i><p>No audit entries found</p></div>');
        return;
    }
    
    const html = entries.map(entry => `
        <div class="log-entry">
            <div class="d-flex justify-content-between">
                <strong>${getActionIcon(entry.action)} ${escapeHtml(entry.description)}</strong>
                <small class="text-muted">${formatDateTime(entry.timestamp)}</small>
            </div>
            <div class="text-muted mt-1">
                User: ${escapeHtml(entry.userId)} | IP: ${escapeHtml(entry.ip)}
            </div>
            ${entry.details ? `<div class="mt-1 small">${formatDetails(entry.details)}</div>` : ''}
        </div>
    `).join('');
    
    $('#auditEntries').html(html);
}

// ========================================
// ROLE MANAGEMENT FUNCTIONS
// ========================================

function edit(target) {
    const roles = document.querySelectorAll(".roles");
    const role = roles[target];
    
    document.querySelector(".idInput").value = role.querySelector(".id").textContent;
    document.querySelector(".roleInput").value = role.querySelector(".role").textContent;
    document.querySelector(".roleIdInput").value = role.querySelector(".roleId").textContent;
    document.querySelector(".descriptionInput").value = role.querySelector(".description").textContent;
    document.querySelector(".editModeInput").value = "true";
    
    const permissions = role.querySelector(".permission").textContent.split("");
    document.querySelector(".postRadio").checked = permissions.includes("1");
    document.querySelector(".categoryRadio").checked = permissions.includes("2");
    document.querySelector(".roleRadio").checked = permissions.includes("3");
    document.querySelector(".userRadio").checked = permissions.includes("4");
    
    document.querySelector(".form-edit").action = "/administrator/edit-role";
    
    // Scroll to form
    document.querySelector(".form-edit").scrollIntoView({ behavior: 'smooth' });
}

function clearInput() {
    document.querySelector(".idInput").value = "";
    document.querySelector(".roleInput").value = "";
    document.querySelector(".roleIdInput").value = "";
    document.querySelector(".descriptionInput").value = "";
    document.querySelector(".postRadio").checked = false;
    document.querySelector(".categoryRadio").checked = false;
    document.querySelector(".roleRadio").checked = false;
    document.querySelector(".userRadio").checked = false;
    document.querySelector(".form-edit").action = "/administrator/insert-role";
    document.querySelector(".editModeInput").value = "false";
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function showNotification(message, type = 'info') {
    const alertClass = {
        success: 'alert-success',
        error: 'alert-danger',
        warning: 'alert-warning',
        info: 'alert-info'
    }[type] || 'alert-info';
    
    const alert = $(`
        <div class="alert ${alertClass} alert-dismissible fade show position-fixed top-0 end-0 m-3" 
             style="z-index: 9999; min-width: 300px;" role="alert">
            ${escapeHtml(message)}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `);
    
    $('body').append(alert);
    
    setTimeout(() => {
        alert.alert('close');
    }, 5000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getActionIcon(action) {
    const icons = {
        role_created: '➕',
        role_updated: '✏️',
        role_deleted: '🗑️',
        permission_changed: '🔐',
        user_assigned: '👤'
    };
    return icons[action] || '📝';
}

function formatDetails(details) {
    return Object.entries(details)
        .map(([key, value]) => `<strong>${key}:</strong> ${escapeHtml(String(value))}`)
        .join(' | ');
}

function getEmptySearchState() {
    return `
        <div class="text-center text-muted py-4">
            <i class="bi bi-search" style="font-size: 2rem;"></i>
            <p class="mt-2">Search for users to assign roles</p>
            <small>Type at least 2 characters</small>
        </div>
    `;
}

// Export functions to global scope
window.selectAllPermissions = selectAllPermissions;
window.clearAllPermissions = clearAllPermissions;
window.copyPermissions = copyPermissions;
window.savePermissionMatrix = savePermissionMatrix;
window.assignRole = assignRole;
window.edit = edit;
window.clearInput = clearInput;
