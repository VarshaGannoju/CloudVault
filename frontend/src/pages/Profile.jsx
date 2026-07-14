import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { FiUser, FiMail, FiLock, FiCamera } from 'react-icons/fi';
import { Form, Button, Alert } from 'react-bootstrap';

export default function Profile() {
  const { user, setUser } = useAuth();
  
  // Profile Update State
  const [profileData, setProfileData] = useState({ name: user?.name || '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileAlert, setProfileAlert] = useState({ type: '', msg: '' });

  // Password Change State
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordAlert, setPasswordAlert] = useState({ type: '', msg: '' });

  // Avatar Upload State
  const fileInputRef = useRef(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!profileData.name.trim()) return;
    
    setProfileLoading(true);
    setProfileAlert({ type: '', msg: '' });
    
    try {
      const { data } = await api.put('/profile', { name: profileData.name });
      setUser(data.user);
      setProfileAlert({ type: 'success', msg: 'Profile updated successfully' });
    } catch (err) {
      setProfileAlert({ type: 'danger', msg: err.response?.data?.message || 'Failed to update profile' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordAlert({ type: '', msg: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return setPasswordAlert({ type: 'danger', msg: 'New passwords do not match' });
    }
    if (passwordData.newPassword.length < 6) {
      return setPasswordAlert({ type: 'danger', msg: 'Password must be at least 6 characters' });
    }

    setPasswordLoading(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordAlert({ type: 'success', msg: 'Password changed successfully' });
    } catch (err) {
      setPasswordAlert({ type: 'danger', msg: err.response?.data?.message || 'Failed to change password' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setAvatarLoading(true);
    setProfileAlert({ type: '', msg: '' });
    
    try {
      const { data } = await api.post('/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUser(data.user);
      setProfileAlert({ type: 'success', msg: 'Avatar updated successfully' });
    } catch (err) {
      setProfileAlert({ type: 'danger', msg: err.response?.data?.message || 'Failed to upload avatar' });
    } finally {
      setAvatarLoading(false);
    }
  };

  return (
    <div className="container-fluid p-0 max-w-7xl mx-auto">
      <div className="mb-4">
        <h3 className="fw-bold mb-1">Profile Settings</h3>
        <p className="text-muted-custom">Manage your account details and security</p>
      </div>

      {profileAlert.msg && (
        <Alert variant={profileAlert.type} dismissible onClose={() => setProfileAlert({ type: '', msg: '' })}>
          {profileAlert.msg}
        </Alert>
      )}

      <div className="row g-4">
        {/* Profile Info Card */}
        <div className="col-12 col-lg-6">
          <div className="cloud-card">
            <h5 className="fw-bold mb-4">Personal Information</h5>
            
            <div className="d-flex align-items-center gap-4 mb-4 pb-4 border-bottom">
              <div className="position-relative">
                <div 
                  className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center overflow-hidden shadow-sm"
                  style={{ width: '80px', height: '80px', fontSize: '2rem' }}
                >
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="Avatar" className="w-100 h-100" style={{ objectFit: 'cover' }} />
                  ) : (
                    <span className="fw-bold">{user?.name?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <button 
                  className="btn btn-sm btn-primary position-absolute bottom-0 end-0 rounded-circle p-1 shadow"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarLoading}
                >
                  <FiCamera size={14} />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleAvatarUpload} 
                  accept="image/*" 
                  className="d-none" 
                />
              </div>
              <div>
                <h5 className="fw-bold mb-1">{user?.name}</h5>
                <p className="text-muted-custom mb-0 text-capitalize">{user?.role}</p>
              </div>
            </div>

            <Form onSubmit={handleProfileUpdate}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-medium">Full Name</Form.Label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <FiUser className="text-muted" />
                  </span>
                  <Form.Control 
                    type="text" 
                    value={profileData.name} 
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    className="bg-light border-start-0 ps-0"
                    disabled={profileLoading}
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fw-medium">Email Address</Form.Label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <FiMail className="text-muted" />
                  </span>
                  <Form.Control 
                    type="email" 
                    value={user?.email} 
                    disabled 
                    className="bg-light border-start-0 ps-0 text-muted"
                  />
                </div>
                <Form.Text className="text-muted">Email cannot be changed.</Form.Text>
              </Form.Group>

              <Button variant="primary" type="submit" disabled={profileLoading || !profileData.name.trim()}>
                {profileLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </Form>
          </div>
        </div>

        {/* Security Card */}
        <div className="col-12 col-lg-6">
          <div className="cloud-card">
            <h5 className="fw-bold mb-4">Security</h5>
            
            {passwordAlert.msg && (
              <Alert variant={passwordAlert.type} dismissible onClose={() => setPasswordAlert({ type: '', msg: '' })}>
                {passwordAlert.msg}
              </Alert>
            )}

            <Form onSubmit={handlePasswordChange}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-medium">Current Password</Form.Label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <FiLock className="text-muted" />
                  </span>
                  <Form.Control 
                    type="password" 
                    placeholder="Enter current password"
                    value={passwordData.currentPassword} 
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    className="bg-light border-start-0 ps-0"
                    required
                    disabled={passwordLoading}
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-medium">New Password</Form.Label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <FiLock className="text-muted" />
                  </span>
                  <Form.Control 
                    type="password" 
                    placeholder="Enter new password"
                    value={passwordData.newPassword} 
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className="bg-light border-start-0 ps-0"
                    required
                    disabled={passwordLoading}
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fw-medium">Confirm New Password</Form.Label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <FiLock className="text-muted" />
                  </span>
                  <Form.Control 
                    type="password" 
                    placeholder="Confirm new password"
                    value={passwordData.confirmPassword} 
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    className="bg-light border-start-0 ps-0"
                    required
                    disabled={passwordLoading}
                  />
                </div>
              </Form.Group>

              <Button variant="danger" type="submit" disabled={passwordLoading || !passwordData.currentPassword || !passwordData.newPassword}>
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </Button>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
