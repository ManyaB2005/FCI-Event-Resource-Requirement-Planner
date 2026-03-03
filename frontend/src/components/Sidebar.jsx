import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Calendar, Menu, X, LogOut, 
  Settings, UserCircle, Bell, Briefcase, Users // Added Users icon
} from "lucide-react";
import "./Sidebar.css";

const Sidebar = ({ isOpen, toggleSidebar, user, onLogout }) => {
  const location = useLocation();

  // Updated menu logic to include the "Registrations" tab
  const menuItems = [
    { 
      section: "Main",
      items: [
        { path: "/", icon: LayoutDashboard, label: "Dashboard" },
        { path: "/events", icon: Calendar, label: user?.role === "admin" ? "Event Management" : "My Classes" },
      ]
    },
    {
      section: "Management",
      items: user?.role === "admin" ? [
        { path: "/registrations", icon: Users, label: "Student Enrollments" }, // This is your new tab!
        { path: "/resources", icon: Briefcase, label: "Resources" },
        { path: "/students", icon: UserCircle, label: "Student Directory" },
      ] : [
        { path: "/notifications", icon: Bell, label: "Updates" },
      ]
    }
  ];

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : "U";

  return (
    <>
      <aside className={`sidebar-container ${isOpen ? "is-open" : "is-collapsed"}`}>
        
        {/* Branding Section */}
        <div className="sidebar-brand">
          <div className="brand-logo">
            <div className="logo-square">E</div>
            {isOpen && <span className="brand-name">Event<span>Ops</span></span>}
          </div>
          <button className="toggle-control" onClick={toggleSidebar}>
            {isOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* User Identity */}
        <div className={`sidebar-user ${!isOpen ? 'centered' : ''}`}>
          <div className="avatar-ring">
            <div className="avatar-main">{getInitials(user?.name)}</div>
            <div className="status-dot"></div>
          </div>
          {isOpen && (
            <div className="user-meta">
              <span className="name">{user?.name}</span>
              <span className="role-tag">{user?.role}</span>
            </div>
          )}
        </div>

        {/* Navigation Area */}
        <nav className="sidebar-navigation">
          {menuItems.map((group, idx) => (
            <div key={idx} className="nav-group">
              {isOpen && <p className="group-label">{group.section}</p>}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link 
                    key={item.path} 
                    to={item.path} 
                    className={`nav-link ${isActive ? "active" : ""}`}
                    title={!isOpen ? item.label : ""}
                  >
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                    {isOpen && <span>{item.label}</span>}
                    {isActive && isOpen && <div className="active-indicator" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="sidebar-actions">
          <Link to="/settings" className={`nav-link ${location.pathname === '/settings' ? 'active' : ''}`}>
            <Settings size={20} />
            {isOpen && <span>Settings</span>}
          </Link>
          <button className="logout-trigger" onClick={onLogout}>
            <LogOut size={20} />
            {isOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {isOpen && <div className="mobile-blur-overlay" onClick={toggleSidebar} />}
    </>
  );
};

export default Sidebar;