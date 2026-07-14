import React, { useState } from 'react';
import { Dropdown, Form, InputGroup } from 'react-bootstrap';
import { FiSearch, FiMenu, FiLogOut, FiUser } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/files?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="app-navbar d-flex justify-content-between align-items-center">
      <div className="d-flex align-items-center gap-3 w-50">
        <button 
          className="btn btn-light d-md-none border-0" 
          onClick={onMenuClick}
        >
          <FiMenu size={20} />
        </button>

        <Form onSubmit={handleSearch} className="w-100 max-w-md d-none d-sm-block">
          <InputGroup>
            <InputGroup.Text className="bg-light border-0 text-muted">
              <FiSearch />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search files..."
              className="bg-light border-0 shadow-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>
        </Form>
      </div>

      <div className="d-flex align-items-center gap-3">
        <Dropdown align="end">
          <Dropdown.Toggle variant="light" className="border-0 bg-transparent shadow-none d-flex align-items-center gap-2 p-1">
            <div 
              className="rounded-circle overflow-hidden bg-primary text-white d-flex align-items-center justify-content-center"
              style={{ width: '36px', height: '36px', objectFit: 'cover' }}
            >
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Profile" className="w-100 h-100" />
              ) : (
                <span className="fw-bold">{user?.name?.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="d-none d-md-block text-start">
              <div className="fw-semibold text-dark text-truncate" style={{ maxWidth: '120px', fontSize: '0.875rem' }}>{user?.name}</div>
              <div className="text-muted-custom text-truncate" style={{ maxWidth: '120px', fontSize: '0.75rem' }}>{user?.role}</div>
            </div>
          </Dropdown.Toggle>

          <Dropdown.Menu className="shadow-lg border-0 mt-2 rounded-3">
            <Dropdown.Item as={Link} to="/profile" className="d-flex align-items-center gap-2 py-2">
              <FiUser /> Profile Settings
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item onClick={handleLogout} className="d-flex align-items-center gap-2 py-2 text-danger">
              <FiLogOut /> Logout
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </header>
  );
}
