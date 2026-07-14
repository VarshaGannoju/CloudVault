import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiFileText, FiFolder, FiUser, FiShare2, FiSettings } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ isOpen, onClose: _onClose }) {
  const { user } = useAuth();
  return (
    <div className={`app-sidebar ${isOpen ? 'show' : ''} d-none d-md-flex`}>
      <div className="p-4 d-flex align-items-center gap-2 border-bottom border-light">
        <div className="bg-primary text-white rounded p-2 d-flex align-items-center justify-content-center">
          <FiFolder size={24} />
        </div>
        <h4 className="m-0 fw-bold text-primary">CloudVault</h4>
      </div>
      
      <div className="flex-grow-1 py-3 sidebar-nav">
        <NavLink to="/" end className="nav-link">
          <FiHome /> Dashboard
        </NavLink>
        <NavLink to="/files" className="nav-link">
          <FiFileText /> All Files
        </NavLink>
        <NavLink to="/folders" className="nav-link">
          <FiFolder /> Folders
        </NavLink>
        <NavLink to="/shared" className="nav-link">
          <FiShare2 /> Shared With Me
        </NavLink>
        <NavLink to="/profile" className="nav-link">
          <FiUser /> Profile
        </NavLink>
        {user?.role === 'admin' && (
          <NavLink to="/admin" className="nav-link text-warning mt-3 border-top pt-3 border-light">
            <FiSettings /> Admin Dashboard
          </NavLink>
        )}
      </div>

      <div className="p-4 mt-auto border-top border-light text-center">
        <small className="text-muted-custom fw-medium">CloudVault &copy; 2026</small>
      </div>
    </div>
  );
}
