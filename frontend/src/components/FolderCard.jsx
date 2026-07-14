import React from 'react';
import { Dropdown } from 'react-bootstrap';
import { FiFolder, FiMoreVertical, FiEdit2, FiTrash2, FiShare2 } from 'react-icons/fi';

export default function FolderCard({ folder, onNavigate, onRename, onDelete, onShare }) {
  return (
    <div 
      className="cloud-card interactive d-flex flex-column h-100 p-3 cursor-pointer"
      onDoubleClick={() => onNavigate(folder.id)}
    >
      <div className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-3 overflow-hidden">
          <div className="p-2 bg-primary bg-opacity-10 rounded d-inline-flex">
            <FiFolder className="text-primary" size={24} />
          </div>
          <h6 className="fw-semibold text-truncate mb-0" title={folder.name}>
            {folder.name}
          </h6>
        </div>
        
        <Dropdown align="end" onClick={(e) => e.stopPropagation()}>
          <Dropdown.Toggle variant="light" size="sm" className="border-0 bg-transparent shadow-none p-1">
            <FiMoreVertical size={18} />
          </Dropdown.Toggle>

          <Dropdown.Menu className="shadow-sm border-0">
            <Dropdown.Item onClick={() => onRename(folder)} className="d-flex align-items-center gap-2">
              <FiEdit2 /> Rename
            </Dropdown.Item>
            {onShare && (
              <Dropdown.Item onClick={() => onShare(folder)} className="d-flex align-items-center gap-2">
                <FiShare2 /> Share
              </Dropdown.Item>
            )}
            <Dropdown.Divider />
            <Dropdown.Item onClick={() => onDelete(folder)} className="d-flex align-items-center gap-2 text-danger">
              <FiTrash2 /> Delete
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </div>
  );
}
