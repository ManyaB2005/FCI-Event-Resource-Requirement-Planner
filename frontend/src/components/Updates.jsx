import React, { useState, useEffect } from 'react';
import { Bell, Megaphone, CalendarClock, AlertTriangle, Send } from 'lucide-react';
import { fetchWithAuth } from '../api';

const Updates = ({ user }) => {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Admin form state
  const [newMessage, setNewMessage] = useState('');
  const [newType, setNewType] = useState('announcement');
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => { loadUpdates(); }, []);

  const loadUpdates = async () => {
    try {
      const data = await fetchWithAuth('/updates');
      setUpdates(data);
    } catch (err) {
      console.error("Failed to load updates:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setIsPosting(true);

    try {
      await fetchWithAuth('/updates', {
        method: 'POST',
        body: JSON.stringify({ message: newMessage, type: newType })
      });
      setNewMessage('');
      loadUpdates(); // Refresh the feed
    } catch (err) {
      alert("Failed to post announcement.");
    } finally {
      setIsPosting(false);
    }
  };

  // Helper function to pick the right icon based on the update type
  const getIcon = (type) => {
    switch(type) {
      case 'urgent': return <AlertTriangle size={20} color="#e53e3e" />;
      case 'reschedule': return <CalendarClock size={20} color="#d97706" />;
      default: return <Megaphone size={20} color="#4f46e5" />;
    }
  };

  if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading Updates...</div>;

  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      <h2 style={{ color: "#1e293b", marginBottom: "30px", fontSize: "28px", display: "flex", alignItems: "center", gap: "10px" }}>
        <Bell size={28} color="#4f46e5" /> Notification Center
      </h2>

      {/* ADMIN BROADCAST FORM */}
      {user?.role === 'admin' && (
        <div style={{ background: "white", padding: "25px", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", marginBottom: "30px", border: "1px solid #e2e8f0", borderTop: "4px solid #4f46e5" }}>
          <h3 style={{ marginTop: 0, marginBottom: "15px", fontSize: "16px", color: "#334155" }}>Broadcast New Announcement</h3>
          <form onSubmit={handlePostAnnouncement}>
            <textarea 
              placeholder="What do you want to tell the students?" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              style={{ width: "100%", padding: "15px", borderRadius: "8px", border: "1px solid #cbd5e1", minHeight: "80px", marginBottom: "15px", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
              required
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <select 
                value={newType} 
                onChange={(e) => setNewType(e.target.value)}
                style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none", background: "white" }}
              >
                <option value="announcement">General Announcement</option>
                <option value="reschedule">Class Rescheduled</option>
                <option value="urgent">Urgent Notice</option>
              </select>

              <button type="submit" disabled={isPosting} style={{ display: "flex", alignItems: "center", gap: "8px", background: "#4f46e5", color: "white", border: "none", padding: "10px 20px", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}>
                <Send size={16} /> {isPosting ? "Sending..." : "Post Update"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* UPDATES FEED */}
      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        {updates.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", background: "#f8fafc", borderRadius: "12px", color: "#64748b" }}>
            No recent announcements.
          </div>
        ) : (
          updates.map((update) => (
            <div key={update.id} style={{ display: "flex", gap: "15px", background: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", border: "1px solid #e2e8f0" }}>
              <div style={{ background: "#f1f5f9", padding: "12px", borderRadius: "50%", height: "fit-content" }}>
                {getIcon(update.type)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <strong style={{ textTransform: "capitalize", color: "#334155", fontSize: "14px" }}>
                    {update.type === 'reschedule' ? 'Schedule Update' : update.type}
                  </strong>
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                    {new Date(update.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
                <p style={{ margin: 0, color: "#475569", lineHeight: "1.5", fontSize: "15px", whiteSpace: "pre-wrap" }}>
                  {update.message}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Updates;