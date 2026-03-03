import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, Package, CheckCircle, Clock, BookOpen, 
  AlertCircle, ArrowRight, Shield, Activity, Bell, Zap, MoreVertical
} from 'lucide-react';
import { fetchWithAuth } from '../api';
import './Dashboard.css';

const Dashboard = ({ user }) => {
  const [adminStats, setAdminStats] = useState({
    totalEvents: 0, upcomingEvents: 0, resourcesPlanned: 0, resourcesCompleted: 0, completionRate: 0
  });
  const [studentData, setStudentData] = useState({ registrations: [], pendingPpts: 0, nextClass: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role) {
      user.role === 'admin' ? loadAdminDashboard() : loadStudentDashboard();
    }
  }, [user]);

  const loadAdminDashboard = async () => {
    try {
      const data = await fetchWithAuth('/events/dashboard');
      setAdminStats(data || adminStats);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const loadStudentDashboard = async () => {
    try {
      const regs = await fetchWithAuth('/student/my-registrations') || [];
      const pending = regs.filter(r => r.requires_ppt && !r.presentation_link).length;
      const next = regs.filter(r => new Date(r.date) >= new Date()).sort((a,b) => new Date(a.date) - new Date(b.date))[0];
      setStudentData({ registrations: regs, pendingPpts: pending, nextClass: next });
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  if (loading) return (
    <div className="dashboard-loader-light">
      <div className="spinner-indigo"></div>
      <p>Loading Workspace...</p>
    </div>
  );

  return (
    <div className="dashboard-light">
      {/* Header */}
      <header className="dash-header">
        <div className="header-info">
          <h1>Good day, {user.name.split(' ')[0]}</h1>
          <p className="subtitle">Overview of your {user.role} workspace</p>
        </div>
        <div className="header-tools">
          <button className="notif-pill"><Bell size={18} /><span>3</span></button>
          <Link to="/events" className="btn-indigo-light">
            {user.role === 'admin' ? 'Manage Events' : 'Join Class'} <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      {/* Stats Section */}
      
      <div className="stats-container-light">
        <StatTile 
          icon={<Activity size={22} />} 
          label={user.role === 'admin' ? "Total Events" : "Enrolled"} 
          value={user.role === 'admin' ? adminStats.totalEvents : studentData.registrations.length}
          color="blue"
        />
        <StatTile 
          icon={<Clock size={22} />} 
          label="Pending Items" 
          value={user.role === 'admin' ? adminStats.upcomingEvents : studentData.pendingPpts}
          color={studentData.pendingPpts > 0 ? "red" : "green"}
        />
        <StatTile 
          icon={<Shield size={22} />} 
          label="Readiness Score" 
          value={`${adminStats.completionRate || 0}%`}
          color="indigo"
        />
      </div>

      {/* Main Grid */}
      <div className="content-grid-light">
        {/* Progress Card */}
        <section className="card-white main-area">
          <div className="card-header-row">
            <h3>Logistics Readiness</h3>
            <span className="badge-light">In Progress</span>
          </div>
          <div className="progress-content">
            <div className="progress-text">
              <span className="big-num">{adminStats.completionRate || 0}%</span>
              <p>Of resources have been successfully verified and allocated.</p>
            </div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${adminStats.completionRate || 0}%` }}></div>
            </div>
          </div>
        </section>

        {/* Sidebar Card */}
        <section className="card-white side-area">
          <h3>Upcoming Schedule</h3>
          {studentData.nextClass ? (
            <div className="schedule-item">
              <div className="date-icon">
                <span className="d">{new Date(studentData.nextClass.date).getDate()}</span>
                <span className="m">{new Date(studentData.nextClass.date).toLocaleString('default', { month: 'short' })}</span>
              </div>
              <div className="item-meta">
                <h4>{studentData.nextClass.class_name}</h4>
                <p>{studentData.nextClass.venue}</p>
              </div>
            </div>
          ) : (
            <div className="empty-light">No upcoming events.</div>
          )}
        </section>
      </div>
    </div>
  );
};

const StatTile = ({ icon, label, value, color }) => (
  <div className={`stat-tile-light ${color}`}>
    <div className="tile-icon-light">{icon}</div>
    <div className="tile-text">
      <span className="label">{label}</span>
      <span className="value">{value}</span>
    </div>
  </div>
);

export default Dashboard;