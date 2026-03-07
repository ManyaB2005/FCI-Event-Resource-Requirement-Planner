import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, Settings as SettingsIcon, LogOut, Bell, ClipboardList, Menu } from 'lucide-react';
import './Sidebar.css';
import logo from './logo.jpeg'; 

const Sidebar = ({ isOpen, toggleSidebar, user, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      
      {/* Sidebar Header */}
      <div 
        className="sidebar-header"
        style={{ 
          display: 'flex', 
          flexDirection: isOpen ? 'row' : 'column', 
          alignItems: 'center', 
          justifyContent: isOpen ? 'space-between' : 'flex-start', // Align to top when column
          gap: isOpen ? '0' : '15px',
          paddingTop: '20px',    // MOVED DOWN: Adds space from the top of the browser
          paddingBottom: '20px', // Balanced spacing
          paddingLeft: isOpen ? '20px' : '0',
          paddingRight: isOpen ? '20px' : '0',
          minHeight: '120px'     // Ensures enough room for logo + menu button when closed
        }}
      >
        
        {/* LOGO AND TITLE */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          justifyContent: 'center' 
        }}>
          <img 
            src={logo} 
            alt="FCI Logo" 
            style={{ 
              width: '42px', 
              height: '42px', 
              objectFit: 'cover', 
              borderRadius: '50%', 
              border: '2px solid #eef2ff',
              transition: 'all 0.3s ease' // Smooth transition when sidebar toggles
            }} 
          />
          {isOpen && (
            <h2 style={{ 
              margin: 0, 
              whiteSpace: 'nowrap', 
              fontSize: '1.2rem',
              fontWeight: '600'
            }}>
              FCI Planner
            </h2>
          )}
        </div>

        {/* HAMBURGER BUTTON */}
        <button 
          className="toggle-btn" 
          onClick={toggleSidebar}
          style={{ 
            background: 'transparent', 
            border: 'none', 
            cursor: 'pointer', 
            display: 'flex', 
            padding: '8px',
            borderRadius: '8px',
            color: 'inherit'
          }}
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        <div className={`sidebar-item ${isActive('/') ? 'active' : ''}`} onClick={() => handleNavigation('/')}>
          <LayoutDashboard size={20} className="icon" />
          {isOpen && <span>Dashboard</span>}
        </div>

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
          </>
        )}

        <div className={`sidebar-item ${isActive('/updates') ? 'active' : ''}`} onClick={() => handleNavigation('/updates')}>
          <Bell size={20} className="icon" />
          {isOpen && <span>Updates</span>}
        </div>

        {user?.role === 'student' && (
          <div className={`sidebar-item ${isActive('/events') ? 'active' : ''}`} onClick={() => handleNavigation('/events')}>
            <Calendar size={20} className="icon" />
            {isOpen && <span>My Classes</span>}
          </div>
        )}

        <div className={`sidebar-item ${isActive('/settings') ? 'active' : ''}`} onClick={() => handleNavigation('/settings')}>
          <SettingsIcon size={20} className="icon" />
          {isOpen && <span>Settings</span>}
        </div>
      </nav>

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