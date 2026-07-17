import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { API_BASE_URL } from '../services/api';
import { FiHardDrive, FiFileText, FiImage, FiFolder, FiShare2, FiStar, FiActivity, FiTrendingUp, FiUploadCloud, FiBarChart2, FiCalendar } from 'react-icons/fi';
import FileCard from '../components/FileCard';
import { downloadFileProxy } from '../utils/downloadHelper';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import PreviewModal from '../components/PreviewModal';
import ShareModal from '../components/ShareModal';
import { formatBytes, calculateStorageStats } from '../utils/format';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function Dashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chartLoading, setChartLoading] = useState(true);
  const [chartError, setChartError] = useState('');

  // Rename File State
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [fileToRename, setFileToRename] = useState(null);
  const [newName, setNewName] = useState('');

  // Delete File State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);

  // Preview / Share
  const [previewFile, setPreviewFile] = useState(null);
  const [shareFile, setShareFile] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      setChartLoading(true);
      setChartError('');

      // Load dashboard stats and charts independently so one failure doesn't blank the whole page.
      const [dashRes, chartsRes] = await Promise.allSettled([
        api.get('/analytics/dashboard'),
        api.get('/analytics/charts')
      ]);

      if (dashRes.status === 'fulfilled') {
        setDashboardData(dashRes.value.data.data);
      } else {
        console.error('Dashboard stats error:', dashRes.reason);
        setError('Failed to load dashboard stats.');
      }

      if (chartsRes.status === 'fulfilled') {
        setChartData(chartsRes.value.data.data);
      } else {
        console.error('Dashboard charts error:', chartsRes.reason);
        setChartError('Failed to load analytics chart.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
      setChartLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDownload = async (file) => {
    await downloadFileProxy(`/files/${file.id}/download`, file.original_name);
  };

  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !fileToRename) return;
    try {
      await api.put(`/files/${fileToRename.id}`, { name: newName.trim() });
      setShowRenameModal(false);
      toast.success('File renamed successfully');
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to rename file');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;
    try {
      await api.delete(`/files/${fileToDelete.id}`);
      setShowDeleteModal(false);
      toast.success('File moved to trash');
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to delete file');
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} onRetry={fetchDashboardData} />;
  if (!dashboardData) return null;

  const storageUsed = dashboardData.storage?.used || 0;
  const storageLimit = dashboardData.storage?.limit || 5000000000;
  const storageStats = calculateStorageStats(storageUsed, storageLimit);

  const docsStat = dashboardData.fileTypes.find(t => t.mime_type?.includes('pdf') || t.mime_type?.includes('document') || t.mime_type?.includes('text'))?.count || 0;
  const imgStat = dashboardData.fileTypes.find(t => t.mime_type?.includes('image'))?.count || 0;

  const hasUploadData = chartData?.uploadsOverTime && chartData.uploadsOverTime.length > 0;
  const uploadsOverTime = chartData?.uploadsOverTime || [];

  const uploadMetrics = (() => {
    if (!uploadsOverTime.length) return null;
    const total = uploadsOverTime.reduce((sum, w) => sum + parseInt(w.upload_count, 10), 0);
    const thisWeek = parseInt(uploadsOverTime[uploadsOverTime.length - 1].upload_count, 10);
    const avg = uploadsOverTime.length ? parseFloat((total / uploadsOverTime.length).toFixed(1)) : 0;
    const mostActive = uploadsOverTime.reduce((max, w) =>
      parseInt(w.upload_count, 10) > parseInt(max.upload_count, 10) ? w : max,
      uploadsOverTime[0]
    );
    return { total, thisWeek, avg, mostActive };
  })();

  const formatWeekRange = (weekStart, weekEnd) => {
    const start = new Date(weekStart);
    const end = new Date(weekEnd || weekStart);
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${startStr}–${endStr}`;
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 900,
      easing: 'easeOutQuart',
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          title: (items) => {
            const idx = items[0].dataIndex;
            const point = chartData.uploadsOverTime[idx];
            return formatWeekRange(point.week_start, point.week_end);
          },
          label: (item) => `${item.raw} file${item.raw === 1 ? '' : 's'} uploaded`,
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Week', font: { weight: 'bold' } },
        grid: { display: false },
        ticks: { maxRotation: 45, minRotation: 0 },
      },
      y: {
        title: { display: true, text: 'Uploaded Files', font: { weight: 'bold' } },
        beginAtZero: true,
        ticks: { stepSize: 1, precision: 0 },
        grid: { color: 'rgba(0,0,0,0.05)' },
      },
    },
  };

  const lineChartData = {
    labels: chartData?.uploadsOverTime?.map(d => formatWeekRange(d.week_start, d.week_end)) || [],
    datasets: [
      {
        label: 'Uploads',
        data: chartData?.uploadsOverTime?.map(d => parseInt(d.upload_count, 10)) || [],
        borderColor: 'rgb(37, 99, 235)',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 360);
          gradient.addColorStop(0, 'rgba(37, 99, 235, 0.25)');
          gradient.addColorStop(1, 'rgba(37, 99, 235, 0.0)');
          return gradient;
        },
        borderWidth: 3,
        pointBackgroundColor: 'rgb(37, 99, 235)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const renderRecentActivity = () => {
    const activities = dashboardData.recentActivity || [];
    if (activities.length === 0) return <p className="text-muted mb-0">No recent activity.</p>;

    const labels = {
      UPLOAD: 'uploaded',
      DOWNLOAD: 'downloaded',
      RENAME: 'renamed',
      DELETE: 'deleted',
      RESTORE: 'restored',
      SHARE: 'shared',
      COPY: 'created a copy of',
      STAR: 'starred',
      UNSTAR: 'unstarred',
      'file.upload': 'uploaded',
      'file.download': 'downloaded',
      'file.rename': 'renamed',
      'file.delete': 'deleted',
      'file.restore': 'restored',
      'file.share': 'shared',
      'file.copy': 'created a copy of',
      'file.star': 'starred',
      'file.unstar': 'unstarred',
      'folder.create': 'created',
      'folder.delete': 'deleted',
      'folder.rename': 'renamed',
      'folder.share': 'shared',
    };

    const getTargetType = (a) => {
      if (a.target_type) return a.target_type.toLowerCase();
      const actionKey = a.action?.toString().trim().toLowerCase() || '';
      if (actionKey.startsWith('folder.')) return 'folder';
      if (actionKey.startsWith('file.')) return 'file';
      return 'file';
    };

    return (
      <ul className="list-unstyled mb-0">
        {activities.slice(0, 5).map((a) => {
          const targetType = getTargetType(a);
          return (
            <li key={a.id} className="mb-2">
              <small className="text-muted">{labels[a.action] || a.action?.toLowerCase()}</small>
              <div className="fw-medium text-break" style={{ fontSize: '0.85rem' }}>
                {targetType} {a.target_name || a.metadata?.name || 'a file'}
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="container-fluid p-0 max-w-7xl mx-auto">
      <div className="mb-4">
        <h3 className="fw-bold mb-1">Welcome back, {user?.name}!</h3>
        <p className="text-muted-custom"></p>
      </div>

      <div className="row g-4 mb-5">
        <div className="col-12 col-md-6 col-lg-3">
          <div className="cloud-card bg-primary text-white border-0">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="m-0 fw-medium">Total Storage</h6>
              <FiHardDrive size={24} className="opacity-75" />
            </div>
            <h3 className="fw-bold m-0">{storageStats.usedFormatted}</h3>
            <div className="progress mt-3 bg-white bg-opacity-25" style={{ height: '6px' }}>
              <div className="progress-bar bg-white" style={{ width: `${storageStats.visualPercentage}%` }}></div>
            </div>
            <small className="mt-2 d-block opacity-75">
              {storageUsed === 0
                ? `0% used of ${storageStats.totalFormatted}`
                : `${storageStats.usedFormatted} of ${storageStats.totalFormatted} used (${storageStats.percentageString})`}
            </small>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-3">
          <div className="cloud-card d-flex align-items-center gap-3">
            <div className="p-3 bg-success bg-opacity-10 text-success rounded">
              <FiFileText size={24} />
            </div>
            <div>
              <h6 className="m-0 text-muted-custom fw-medium">Files</h6>
              <h4 className="m-0 fw-bold mt-1">{dashboardData.counts?.files || 0}</h4>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-3">
          <div className="cloud-card d-flex align-items-center gap-3">
            <div className="p-3 bg-info bg-opacity-10 text-info rounded">
              <FiFolder size={24} />
            </div>
            <div>
              <h6 className="m-0 text-muted-custom fw-medium">Folders</h6>
              <h4 className="m-0 fw-bold mt-1">{dashboardData.counts?.folders || 0}</h4>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-3">
          <div className="cloud-card d-flex align-items-center gap-3">
            <div className="p-3 bg-warning bg-opacity-10 text-warning rounded">
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
            <div className="p-3 bg-primary bg-opacity-10 text-primary rounded">
              <FiShare2 size={24} />
            </div>
            <div>
              <h6 className="m-0 text-muted-custom fw-medium">Shared Files</h6>
              <h4 className="m-0 fw-bold mt-1">{dashboardData.counts?.shared || 0}</h4>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-3">
          <div className="cloud-card d-flex align-items-center gap-3">
            <div className="p-3 bg-warning bg-opacity-10 text-warning rounded">
              <FiStar size={24} />
            </div>
            <div>
              <h6 className="m-0 text-muted-custom fw-medium">Starred Files</h6>
              <h4 className="m-0 fw-bold mt-1">{dashboardData.counts?.starred || 0}</h4>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-3">
          <div className="cloud-card d-flex align-items-center gap-3">
            <div className="p-3 bg-secondary bg-opacity-10 text-secondary rounded">
              <FiFileText size={24} />
            </div>
            <div>
              <h6 className="m-0 text-muted-custom fw-medium">Documents</h6>
              <h4 className="m-0 fw-bold mt-1">{docsStat}</h4>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-3">
          <div className="cloud-card d-flex align-items-center gap-3 overflow-hidden">
            <div className="p-3 bg-danger bg-opacity-10 text-danger rounded">
              <FiActivity size={24} />
            </div>
            <div>
              <h6 className="m-0 text-muted-custom fw-medium">Recent Activity</h6>
              <div style={{ fontSize: '0.85rem' }}>
                {renderRecentActivity()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="mb-5">
        <div className="d-flex align-items-center gap-2 mb-4">
          <FiTrendingUp className="text-primary" size={22} />
          <h4 className="fw-bold m-0">Analytics</h4>
        </div>

        {/* Analytics Summary Cards — upload-specific metrics, not duplicates of top overview */}
        <div className="row g-4 mb-4">
          <div className="col-6 col-md-3">
            <div className="cloud-card d-flex align-items-center gap-3 h-100">
              <div className="p-3 bg-primary bg-opacity-10 text-primary rounded">
                <FiUploadCloud size={22} />
              </div>
              <div>
                <h6 className="m-0 text-muted-custom fw-medium">Total Uploads</h6>
                <h4 className="m-0 fw-bold mt-1">{uploadMetrics?.total ?? 0}</h4>
              </div>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div className="cloud-card d-flex align-items-center gap-3 h-100">
              <div className="p-3 bg-info bg-opacity-10 text-info rounded">
                <FiCalendar size={22} />
              </div>
              <div>
                <h6 className="m-0 text-muted-custom fw-medium">Uploads This Week</h6>
                <h4 className="m-0 fw-bold mt-1">{uploadMetrics?.thisWeek ?? 0}</h4>
              </div>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div className="cloud-card d-flex align-items-center gap-3 h-100">
              <div className="p-3 bg-success bg-opacity-10 text-success rounded">
                <FiBarChart2 size={22} />
              </div>
              <div>
                <h6 className="m-0 text-muted-custom fw-medium">Avg Uploads/Week</h6>
                <h4 className="m-0 fw-bold mt-1">{uploadMetrics?.avg ?? 0}</h4>
              </div>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div className="cloud-card d-flex align-items-center gap-3 h-100">
              <div className="p-3 bg-warning bg-opacity-10 text-warning rounded">
                <FiTrendingUp size={22} />
              </div>
              <div>
                <h6 className="m-0 text-muted-custom fw-medium">Most Active Week</h6>
                <h4 className="m-0 fw-bold mt-1">
                  {uploadMetrics?.mostActive ? parseInt(uploadMetrics.mostActive.upload_count, 10) : 0}
                </h4>
                <small className="text-muted-custom">
                  {uploadMetrics?.mostActive ? formatWeekRange(uploadMetrics.mostActive.week_start, uploadMetrics.mostActive.week_end) : ''}
                </small>
              </div>
            </div>
          </div>
        </div>

        {/* Uploads Over Time Chart */}
        <div className="bg-white p-4 rounded-4 shadow-sm border">
          <div className="mb-4">
            <h5 className="fw-bold m-0">Upload Activity</h5>
            <p className="text-muted-custom m-0 mt-1">Track file upload trends over time.</p>
          </div>

          {chartLoading ? (
            <div className="text-center py-5">
              <Loading />
            </div>
          ) : chartError ? (
            <div className="text-center py-5 text-danger">
              <FiTrendingUp size={48} className="mb-3 opacity-25" />
              <h5 className="fw-medium">{chartError}</h5>
            </div>
          ) : !hasUploadData ? (
            <div className="text-center py-5">
              <FiUploadCloud size={56} className="text-muted mb-3 opacity-50" />
              <h5 className="fw-medium">Upload files to see analytics</h5>
              <p className="text-muted-custom mb-0">Your weekly upload trends will appear here once you start uploading.</p>
            </div>
          ) : (
            <div style={{ height: '360px' }}>
              <Line options={lineChartOptions} data={lineChartData} />
            </div>
          )}
        </div>
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
                onRename={(f) => { setFileToRename(f); setNewName(f.original_name); setShowRenameModal(true); }}
                onDelete={(f) => { setFileToDelete(f); setShowDeleteModal(true); }}
                onPreview={(f) => setPreviewFile(f)}
                onShare={(f) => setShareFile(f)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Rename Modal */}
      {showRenameModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <form onSubmit={handleRenameSubmit}>
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title fw-bold">Rename File</h5>
                  <button type="button" className="btn-close" onClick={() => setShowRenameModal(false)}></button>
                </div>
                <div className="modal-body">
                  <label className="fw-medium mb-1">New Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-light" onClick={() => setShowRenameModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Rename</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-danger">Move to Trash</h5>
                <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
              </div>
              <div className="modal-body">
                Are you sure you want to move <span className="fw-bold">{fileToDelete?.original_name}</span> to trash?
              </div>
              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-light" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button type="button" className="btn btn-danger" onClick={handleDeleteConfirm}>Move to Trash</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <PreviewModal
        show={!!previewFile}
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        previewUrl={previewFile ? `${API_BASE_URL}/files/${previewFile.id}/stream` : null}
      />

      {shareFile && (
        <ShareModal
          show={!!shareFile}
          onHide={() => setShareFile(null)}
          item={shareFile}
          itemType="files"
        />
      )}
    </div>
  );
}
