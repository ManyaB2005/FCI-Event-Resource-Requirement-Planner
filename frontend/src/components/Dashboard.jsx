import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Calendar as CalendarIcon, ArrowRight, Bell, Plus, Megaphone, AlertTriangle } from 'lucide-react';
import { fetchWithAuth } from '../api';
import './Dashboard.css';

const getInitials = (name) => {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

const Dashboard = ({ user }) => {
  const navigate = useNavigate();
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [pendingEventsCount, setPendingEventsCount] = useState(0);
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role) {
      // Both Admin and Student will now load the calendar data the exact same way
      user.role === 'admin' ? loadAdminData() : loadStudentData();
      loadRecentUpdates();
    }
  }, [user]);

  // Fetches ALL events for Admin
  const loadAdminData = async () => {
    try {
      const data = await fetchWithAuth('/events');
      processEventsForCalendar(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  // Fetches ALL events for Students (Now matches the Admin calendar!)
  const loadStudentData = async () => {
    try {
      const data = await fetchWithAuth('/events');
      processEventsForCalendar(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  // Shared function to map the database events onto the Calendar dots
  const processEventsForCalendar = (data) => {
    let allClasses = [];
    let pendingCount = 0;
    const today = new Date().setHours(0,0,0,0);

    if (Array.isArray(data)) {
      data.forEach(event => {
        event.folders?.forEach(folder => {
          folder.classes?.forEach(cls => {
            if (cls.date) {
              const classDate = new Date(cls.date).setHours(0,0,0,0);
              if (classDate >= today) pendingCount++;
              
              allClasses.push({
                date: cls.date,
                title: `${event.name} - ${cls.name}`,
                time: cls.time,
                venue: cls.venue
              });
            }
          });
        });
      });
    }

    setCalendarEvents(allClasses);
    setPendingEventsCount(pendingCount);
  };

  const loadRecentUpdates = async () => {
    try {
      const updates = await fetchWithAuth('/updates');
      setRecentUpdates(updates.slice(0, 5)); 
    } catch (e) { console.error(e); }
  };

  const renderCalendarTileContent = ({ date, view }) => {
    if (view === 'month') {
      // 1. Get the exact year, month, and day of the calendar tile being rendered
      const tileYear = date.getFullYear();
      const tileMonth = date.getMonth();
      const tileDate = date.getDate();
      
      // 2. Filter events by forcing the database timestamp into a local Date object
      const dayEvents = calendarEvents.filter(e => {
        if (!e.date) return false;
        
        // This converts the UTC database string back into your local timezone (IST)
        const eventLocal = new Date(e.date);
        
        return (
          eventLocal.getFullYear() === tileYear &&
          eventLocal.getMonth() === tileMonth &&
          eventLocal.getDate() === tileDate
        );
      });

      if (dayEvents.length > 0) {
        return (
          <div className="calendar-event-marker">
            <div className="event-dot"></div>
            <div className="calendar-tooltip">
              {dayEvents.map((ev, i) => (
                <div key={i} className="tooltip-item">
                  <strong>{ev.title}</strong>
                  <span>⏰ {ev.time || 'TBA'}</span>
                  <span>📍 {ev.venue || 'TBA'}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }
    }
    return null;
  };

  if (loading) return (
    <div className="dashboard-light" style={{ animation: "pulse 1.5s infinite ease-in-out" }}>
      <header className="dash-header">
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#e2e8f0" }}></div>
          <div>
            <div style={{ width: "200px", height: "24px", background: "#e2e8f0", borderRadius: "6px", marginBottom: "8px" }}></div>
            <div style={{ width: "300px", height: "14px", background: "#f1f5f9", borderRadius: "4px" }}></div>
          </div>
        </div>
      </header>
      <div className="stats-container-light">
        <div style={{ height: "100px", background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", width: "100%", maxWidth: "350px" }}></div>
      </div>
    </div>
  );

  return (
    <div className="dashboard-light">
      
      {/* HEADER WITH DYNAMIC AVATAR */}
      <header className="dash-header">
        <div className="header-info" style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div className="user-avatar">
            {getInitials(user?.name)}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "24px", color: "#1e293b" }}>Good day, {user?.name?.split(' ')[0]}</h1>
            <p className="subtitle" style={{ margin: "4px 0 0 0" }}>Here is your schedule and workspace overview.</p>
          </div>
        </div>
        <div className="header-tools">
          {user.role === 'admin' ? (
            <>
              <button onClick={() => navigate('/events')} className="btn-secondary"><Plus size={16}/> Create Event</button>
              <button onClick={() => navigate('/updates')} className="btn-primary"><Megaphone size={16}/> Broadcast</button>
            </>
          ) : (
            <button onClick={() => navigate('/events')} className="btn-primary">View Classes <ArrowRight size={16}/></button>
          )}
        </div>
      </header>

      {/* STAT TILES */}
      <div className="stats-container-light">
        <StatTile 
          icon={<CalendarIcon size={22} />} 
          label="Total Upcoming Events" 
          value={pendingEventsCount}
          color="blue"
        />
      </div>

      {/* DASHBOARD GRID */}
      <div className="dashboard-grid">
        
        {/* LEFT COLUMN: The Interactive Calendar */}
        <div className="grid-col-left" style={{ flex: 2 }}>
          <section className="glass-card widget-card" style={{ height: "100%" }}>
            <h3 className="widget-title"><CalendarIcon size={18}/> Event Schedule</h3>
            <div className="calendar-wrapper">
              <Calendar 
                value={new Date()} 
                tileContent={renderCalendarTileContent}
                className="custom-calendar premium-calendar"
              />
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Recent Updates */}
        <div className="grid-col-right" style={{ flex: 1 }}>
          <section className="glass-card widget-card" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <div className="widget-header-row">
              <h3 className="widget-title"><Bell size={18}/> Recent Updates</h3>
              <Link to="/updates" className="view-all-link">View All</Link>
            </div>
            
            <div className="mini-feed" style={{ flex: 1 }}>
              {recentUpdates.length > 0 ? (
                recentUpdates.map(update => (
                  <div key={update.id} className="feed-item">
                    <div className="feed-icon">
                      {update.type === 'urgent' ? <AlertTriangle size={14} color="#e53e3e"/> : <Megaphone size={14} color="#4f46e5"/>}
                    </div>
                    <div className="feed-content">
                      <span className="feed-type">{update.type}</span>
                      <p className="feed-text">{update.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="action-empty">
                  <Bell size={32} color="#cbd5e1" strokeWidth={1.5} />
                  <span>You're all caught up!<br/><span style={{fontSize: "13px", fontWeight: "normal"}}>No new announcements to show.</span></span>
                </div>
              )}
            </div>
          </section>
        </div>

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