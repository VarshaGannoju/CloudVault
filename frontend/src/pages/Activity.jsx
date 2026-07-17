import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FiActivity, FiRefreshCw } from 'react-icons/fi';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const actionLabels = {
  // New uppercase actions
  UPLOAD: 'uploaded',
  DOWNLOAD: 'downloaded',
  RENAME: 'renamed',
  DELETE: 'deleted',
  RESTORE: 'restored',
  SHARE: 'shared',
  COPY: 'created a copy of',
  STAR: 'starred',
  UNSTAR: 'unstarred',
  // Legacy dot-notation actions from existing logs
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

export default function Activity() {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchActivity = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/activities');
      setActivities(data.data?.activities || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load activity log.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, []);

  const formatMessage = (activity) => {
    const name = user?.name || 'You';
    const actionKey = activity.action?.toString().trim() || '';
    const action = actionLabels[actionKey] || actionKey?.toLowerCase() || 'performed an action on';
    const targetName = activity.target_name || activity.metadata?.name || activity.metadata?.newName || 'a file';

    // Derive target type from target_type field or legacy action prefix.
    let targetType = activity.target_type;
    if (!targetType && actionKey.toLowerCase().startsWith('folder.')) targetType = 'folder';
    if (!targetType && actionKey.toLowerCase().startsWith('file.')) targetType = 'file';
    targetType = (targetType || 'file').toLowerCase();

    return `${name} ${action} ${targetType} ${targetName}`;
  };

  return (
    <div className="container-fluid p-0 max-w-7xl mx-auto h-100 d-flex flex-column">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h3 className="fw-bold mb-1"><FiActivity className="text-primary me-2" />Activity</h3>
          <p className="text-muted-custom m-0">Track what&apos;s happening in your CloudVault</p>
        </div>
        <button className="btn btn-light d-flex align-items-center gap-2" onClick={fetchActivity} disabled={loading}>
          <FiRefreshCw className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      <div className="flex-grow-1">
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorMessage message={error} onRetry={fetchActivity} />
        ) : activities.length === 0 ? (
          <div className="text-center p-5 bg-light rounded-3 border mt-4">
            <FiActivity size={48} className="text-muted mb-3" />
            <h5 className="fw-medium">No activity yet</h5>
            <p className="text-muted-custom mb-0">Your recent actions will appear here.</p>
          </div>
        ) : (
          <div className="bg-white rounded-4 shadow-sm border p-0">
            {activities.map((activity, index) => (
              <div
                key={activity.id}
                className={`d-flex justify-content-between align-items-start gap-3 p-3 ${index !== activities.length - 1 ? 'border-bottom' : ''}`}
              >
                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                  <p className="mb-1 fw-medium text-break">{formatMessage(activity)}</p>
                  <small className="text-muted text-uppercase" style={{ fontSize: '0.7rem' }}>{activity.action}</small>
                </div>
                <small className="text-muted-custom text-nowrap mt-1">
                  {activity.created_at && formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                </small>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
