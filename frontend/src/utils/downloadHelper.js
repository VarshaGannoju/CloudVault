import api from '../services/api';
import toast from 'react-hot-toast';

export const downloadFileProxy = async (endpoint, fallbackFilename) => {
  try {
    const response = await api.get(endpoint, { responseType: 'blob' });
    
    // Attempt to extract filename from Content-Disposition header
    let filename = fallbackFilename || 'download';
    const disposition = response.headers['content-disposition'];
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="(.+)"/);
      if (match && match[1]) {
        filename = match[1];
      }
    }

    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Download failed', err);
    toast.error('Download failed. Please try again.');
  }
};
