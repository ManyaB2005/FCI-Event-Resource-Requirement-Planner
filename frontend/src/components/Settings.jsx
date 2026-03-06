import React, { useState } from 'react';
import { User, Mail, Shield, Key, AlertCircle, CheckCircle, GraduationCap, X } from 'lucide-react';
import { fetchWithAuth } from '../api';

const Settings = ({ user }) => {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleApplyChanges = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    // 1. Verify Email matches the logged-in user
    if (formData.email !== user.email) {
      return setStatus({ type: 'error', message: 'The email you entered does not match your account.' });
    }

    // 2. Verify New Passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      return setStatus({ type: 'error', message: 'Your new passwords do not match.' });
    }

    setLoading(true);

    try {
      await fetchWithAuth('/auth/password', { 
        method: 'PUT', 
        body: JSON.stringify({ 
          currentPassword: formData.oldPassword, 
          newPassword: formData.newPassword 
        }) 
      });

      setStatus({ type: 'success', message: 'Password changed successfully!' });
      
      // Clear and close the form
      setFormData({ email: '', oldPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setShowPasswordForm(false);
        setStatus({ type: '', message: '' });
      }, 2000);

    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Failed to change password. Check your old password.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      <h2 style={{ color: "#1e293b", marginBottom: "30px", fontSize: "28px" }}>Account Settings</h2>

      {status.message && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 20px", marginBottom: "20px", borderRadius: "8px", fontWeight: "600", color: status.type === 'success' ? '#15803d' : '#b91c1c', background: status.type === 'success' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${status.type === 'success' ? '#bbf7d0' : '#fecaca'}` }}>
          {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {status.message}
        </div>
      )}

      {/* Account Details Section (Always Visible) */}
      <div style={{ background: "white", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", marginBottom: "30px", border: "1px solid #e2e8f0" }}>
        <h3 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: "8px", color: "#334155" }}>
          <User size={20} /> Account Details
        </h3>
        <hr style={{ border: "none", borderTop: "1px solid #f1f5f9", margin: "15px 0" }} />
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div style={detailBox}>
            <span style={detailLabel}>Full Name</span>
            <div style={detailValue}><User size={16} style={{ color: "#64748b" }}/> {user?.name}</div>
          </div>
          <div style={detailBox}>
            <span style={detailLabel}>Email Address</span>
            <div style={detailValue}><Mail size={16} style={{ color: "#64748b" }}/> {user?.email}</div>
          </div>
          <div style={detailBox}>
            <span style={detailLabel}>Account Role</span>
            <div style={detailValue}><Shield size={16} style={{ color: "#64748b" }}/> <span style={{ textTransform: "capitalize" }}>{user?.role}</span></div>
          </div>
          
          {user?.role === 'student' && (
            <div style={detailBox}>
              <span style={detailLabel}>Assigned Batch</span>
              <div style={detailValue}><GraduationCap size={16} style={{ color: "#64748b" }}/> {user?.batch || "No Batch Assigned"}</div>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Section */}
      {!showPasswordForm ? (
        <button 
          onClick={() => setShowPasswordForm(true)} 
          style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f8fafc", color: "#475569", border: "1px solid #cbd5e1", padding: "12px 24px", borderRadius: "8px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" }}
        >
          <Key size={18} /> Change Password
        </button>
      ) : (
        <div style={{ background: "white", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0", animation: "fadeIn 0.3s ease-in-out" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px", color: "#334155" }}>
              <Key size={20} /> Update Credentials
            </h3>
            <button onClick={() => setShowPasswordForm(false)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}>
              <X size={24} />
            </button>
          </div>
          
          <form onSubmit={handleApplyChanges} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <div>
                <label style={inputLabel}>Account Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Confirm your email" style={inputStyles} required />
              </div>
              <div>
                <label style={inputLabel}>Old Password</label>
                <input type="password" name="oldPassword" value={formData.oldPassword} onChange={handleChange} placeholder="Enter old password" style={inputStyles} required />
              </div>
              <div>
                <label style={inputLabel}>New Password</label>
                <input type="password" name="newPassword" value={formData.newPassword} onChange={handleChange} placeholder="Enter new password" style={inputStyles} required />
              </div>
              <div>
                <label style={inputLabel}>Confirm New Password</label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Retype new password" style={inputStyles} required />
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
              <button type="button" onClick={() => setShowPasswordForm(false)} style={cancelBtnStyles}>
                Cancel
              </button>
              <button type="submit" style={saveBtnStyles} disabled={loading}>
                {loading ? "Processing..." : "Apply Changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

// --- Styling Objects ---
const detailBox = { background: "#f8fafc", padding: "15px", borderRadius: "8px", border: "1px solid #e2e8f0" };
const detailLabel = { display: "block", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#64748b", fontWeight: "700", marginBottom: "8px" };
const detailValue = { display: "flex", alignItems: "center", gap: "8px", fontSize: "16px", color: "#0f172a", fontWeight: "500" };
const inputLabel = { display: "block", fontSize: "14px", fontWeight: "600", color: "#475569", marginBottom: "6px" };
const inputStyles = { width: "100%", padding: "10px 15px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" };
const saveBtnStyles = { background: "#4f46e5", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "600", fontSize: "14px", cursor: "pointer", transition: "background 0.2s" };
const cancelBtnStyles = { background: "white", color: "#64748b", border: "1px solid #cbd5e1", padding: "10px 20px", borderRadius: "8px", fontWeight: "600", fontSize: "14px", cursor: "pointer", transition: "background 0.2s" };

export default Settings;