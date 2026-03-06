import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, Settings as SettingsIcon, LogOut, Bell, ClipboardList, Menu } from 'lucide-react';
import './Sidebar.css'; // Relies on your original CSS

const Sidebar = ({ isOpen, toggleSidebar, user, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Helper to change the route
  const handleNavigation = (path) => {
    navigate(path);
  };

  // Helper to check if a tab is active
  const isActive = (path) => location.pathname === path;

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      
      {/* Sidebar Header */}
      <div className="sidebar-header">
        {isOpen && <h2>FCI Planner</h2>}
        <button className="toggle-btn" onClick={toggleSidebar}>
          <Menu size={24} />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        
        {/* Dashboard */}
        <div className={`sidebar-item ${isActive('/') ? 'active' : ''}`} onClick={() => handleNavigation('/')}>
          <LayoutDashboard size={20} className="icon" />
          {isOpen && <span>Dashboard</span>}
        </div>

        {/* Updates */}
        <div className={`sidebar-item ${isActive('/updates') ? 'active' : ''}`} onClick={() => handleNavigation('/updates')}>
          <Bell size={20} className="icon" />
          {isOpen && <span>Updates</span>}
        </div>

        {/* --- ADMIN ONLY LINKS --- */}
        {user?.role === 'admin' && (
          <>
            <div className={`sidebar-item ${isActive('/events') ? 'active' : ''}`} onClick={() => handleNavigation('/events')}>
              <Calendar size={20} className="icon" />
              {isOpen && <span>Manage Events</span>}
            </div>
            <div className={`sidebar-item ${isActive('/registrations') ? 'active' : ''}`} onClick={() => handleNavigation('/registrations')}>
              <Users size={20} className="icon" />
              {isOpen && <span>Registrations</span>}
            </div>
            <div className={`sidebar-item ${isActive('/resources') ? 'active' : ''}`} onClick={() => handleNavigation('/resources')}>
              <ClipboardList size={20} className="icon" />
              {isOpen && <span>Resources</span>}
            </div>
          </>
        )}

        {/* --- STUDENT ONLY LINKS --- */}
        {user?.role === 'student' && (
          <div className={`sidebar-item ${isActive('/events') ? 'active' : ''}`} onClick={() => handleNavigation('/events')}>
            <Calendar size={20} className="icon" />
            {isOpen && <span>My Classes</span>}
          </div>
        )}

        {/* Settings */}
        <div className={`sidebar-item ${isActive('/settings') ? 'active' : ''}`} onClick={() => handleNavigation('/settings')}>
          <SettingsIcon size={20} className="icon" />
          {isOpen && <span>Settings</span>}
        </div>
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-item logout" onClick={onLogout}>
          <LogOut size={20} className="icon" />
          {isOpen && <span>Logout</span>}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;