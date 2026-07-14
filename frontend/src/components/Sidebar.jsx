import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiFileText, FiFolder, FiUser } from 'react-icons/fi';

export default function Sidebar({ isOpen, onClose: _onClose }) {
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
        <NavLink to="/profile" className="nav-link">
          <FiUser /> Profile
        </NavLink>
      </div>

      <div className="p-4 mt-auto border-top border-light text-center">
        <small className="text-muted-custom fw-medium">CloudVault &copy; 2026</small>
      </div>
    </div>
  );
}
