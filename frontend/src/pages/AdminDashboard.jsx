import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiUsers, FiDatabase, FiFile, FiFolder } from 'react-icons/fi';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { formatBytes } from '../utils/format';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
      return;
    }

    const fetchAdminStats = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/analytics/admin');
        setStats(data.data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch admin stats');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminStats();
  }, [user, navigate]);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;
  if (!stats) return null;

  return (
    <div className="container-fluid p-0 max-w-7xl mx-auto">
      <div className="mb-4">
        <h3 className="fw-bold mb-1">Admin Dashboard</h3>
        <p className="text-muted-custom">System-wide overview and statistics</p>
      </div>

      <div className="row g-4 mb-5">
        <div className="col-12 col-md-6 col-lg-3">
          <div className="cloud-card d-flex align-items-center gap-3">
            <div className="p-3 bg-primary bg-opacity-10 text-primary rounded">
              <FiUsers size={24} />
            </div>
            <div>
              <h6 className="m-0 text-muted-custom fw-medium">Total Users</h6>
              <h4 className="m-0 fw-bold mt-1">{stats.totalUsers}</h4>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-3">
          <div className="cloud-card d-flex align-items-center gap-3">
            <div className="p-3 bg-success bg-opacity-10 text-success rounded">
              <FiDatabase size={24} />
            </div>
            <div>
              <h6 className="m-0 text-muted-custom fw-medium">Total Storage Used</h6>
              <h4 className="m-0 fw-bold mt-1">{formatBytes(stats.totalStorageUsed)}</h4>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-3">
          <div className="cloud-card d-flex align-items-center gap-3">
            <div className="p-3 bg-info bg-opacity-10 text-info rounded">
              <FiFile size={24} />
            </div>
            <div>
              <h6 className="m-0 text-muted-custom fw-medium">Total Files</h6>
              <h4 className="m-0 fw-bold mt-1">{stats.totalFiles}</h4>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-3">
          <div className="cloud-card d-flex align-items-center gap-3">
            <div className="p-3 bg-warning bg-opacity-10 text-warning rounded">
              <FiFolder size={24} />
            </div>
            <div>
              <h6 className="m-0 text-muted-custom fw-medium">Total Folders</h6>
              <h4 className="m-0 fw-bold mt-1">{stats.totalFolders}</h4>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
