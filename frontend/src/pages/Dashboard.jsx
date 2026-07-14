import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { FiHardDrive, FiFileText, FiImage, FiFolder } from 'react-icons/fi';
import FileCard from '../components/FileCard';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { formatBytes } from '../utils/format';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function Dashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const [dashRes, chartsRes] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/analytics/charts')
      ]);
      setDashboardData(dashRes.data.data);
      setChartData(chartsRes.data.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDownload = async (file) => {
    window.open(file.cloudinary_url, '_blank');
  };

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} onRetry={fetchDashboardData} />;
  if (!dashboardData) return null;

  const storageUsed = dashboardData.storage?.used || 0;
  const storageLimit = dashboardData.storage?.limit || 5000000000;
  const storagePercent = Math.min(100, Math.round((storageUsed / storageLimit) * 100));

  const docsStat = dashboardData.fileTypes.find(t => t.mime_type.includes('pdf') || t.mime_type.includes('document') || t.mime_type.includes('text'))?.count || 0;
  const imgStat = dashboardData.fileTypes.find(t => t.mime_type.includes('image'))?.count || 0;

  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Uploads Over Time' },
    },
  };

  const lineChartData = {
    labels: chartData?.uploadsOverTime?.map(d => d.date.split('T')[0]) || [],
    datasets: [
      {
        label: 'Uploads',
        data: chartData?.uploadsOverTime?.map(d => parseInt(d.upload_count, 10)) || [],
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };

  return (
    <div className="container-fluid p-0 max-w-7xl mx-auto">
      <div className="mb-4">
        <h3 className="fw-bold mb-1">Welcome back, {user?.name}!</h3>
        <p className="text-muted-custom">Here&apos;s an overview of your CloudVault</p>
      </div>

      <div className="row g-4 mb-5">
        <div className="col-12 col-md-6 col-lg-3">
          <div className="cloud-card bg-primary text-white border-0">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="m-0 fw-medium">Total Storage</h6>
              <FiHardDrive size={24} className="opacity-75" />
            </div>
            <h3 className="fw-bold m-0">{formatBytes(storageUsed)}</h3>
            <div className="progress mt-3 bg-white bg-opacity-25" style={{ height: '6px' }}>
              <div className="progress-bar bg-white" style={{ width: `${storagePercent}%` }}></div>
            </div>
            <small className="mt-2 d-block opacity-75">{storagePercent}% used of {formatBytes(storageLimit)}</small>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-3">
          <div className="cloud-card d-flex align-items-center gap-3">
            <div className="p-3 bg-success bg-opacity-10 text-success rounded">
              <FiFileText size={24} />
            </div>
            <div>
              <h6 className="m-0 text-muted-custom fw-medium">Documents</h6>
              <h4 className="m-0 fw-bold mt-1">{docsStat}</h4>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-3">
          <div className="cloud-card d-flex align-items-center gap-3">
            <div className="p-3 bg-info bg-opacity-10 text-info rounded">
              <FiImage size={24} />
            </div>
            <div>
              <h6 className="m-0 text-muted-custom fw-medium">Images</h6>
              <h4 className="m-0 fw-bold mt-1">{imgStat}</h4>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-3">
          <div className="cloud-card d-flex align-items-center gap-3">
            <div className="p-3 bg-warning bg-opacity-10 text-warning rounded">
              <FiFolder size={24} />
            </div>
            <div>
              <h6 className="m-0 text-muted-custom fw-medium">Folders</h6>
              <h4 className="m-0 fw-bold mt-1">{dashboardData.counts?.folders || 0}</h4>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-5 bg-white p-4 rounded-4 shadow-sm border">
        <Line options={lineChartOptions} data={lineChartData} />
      </div>

      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold m-0">Recent Files</h5>
        </div>

        {dashboardData.recentUploads.length === 0 ? (
          <div className="text-center p-5 bg-light rounded-3 border">
            <FiFileText size={48} className="text-muted mb-3" />
            <h5 className="fw-medium">No recent files</h5>
            <p className="text-muted-custom mb-0">Upload some files to see them here.</p>
          </div>
        ) : (
          <div className="item-grid">
            {dashboardData.recentUploads.map(file => (
              <FileCard 
                key={file.id} 
                file={file} 
                onDownload={handleDownload}
                onRename={() => {}}
                onDelete={() => {}}
                onPreview={() => {}}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
