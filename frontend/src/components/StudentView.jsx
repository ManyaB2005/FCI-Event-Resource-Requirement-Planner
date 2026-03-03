import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, CheckCircle, Bell, Upload, Clock } from 'lucide-react';
import { fetchWithAuth } from '../api';

const StudentView = ({ user }) => {
  const [classes, setClasses] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState({});

  useEffect(() => { loadDashboardData(); }, []);

  const loadDashboardData = async () => {
    try {
      const [classesData, registrationsData, notificationsData] = await Promise.all([
        fetchWithAuth("/student/classes"),
        fetchWithAuth("/student/my-registrations"),
        fetchWithAuth("/student/notifications")
      ]);
      setClasses(classesData); 
      setMyRegistrations(registrationsData); 
      setNotifications(notificationsData);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const handleRegister = async (classId) => {
    try {
      await fetchWithAuth(`/student/classes/${classId}/register`, { method: "POST" });
      setMessage("Successfully registered for class!");
      setTimeout(() => setMessage(''), 3000);
      loadDashboardData(); 
    } catch (err) { alert(err.message); }
  };

  const handleFileUpload = async (classId) => {
    const file = selectedFiles[classId];
    if (!file) return alert("Please select a file to upload.");
    const formData = new FormData();
    formData.append("presentation", file);
    
    setMessage("Uploading file... Please wait.");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/student/classes/${classId}/ppt-email`, {
        method: "POST", headers: { "Authorization": `Bearer ${token}` }, body: formData
      });
      if (!response.ok) throw new Error("Upload failed");
      setMessage("Presentation submitted successfully!");
      setTimeout(() => setMessage(''), 3000);
      loadDashboardData(); 
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div style={{ padding: '30px' }}>Loading Portal...</div>;

  return (
    <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto" }}>
      
      {/* Notifications Banner */}
      {notifications.length > 0 && (
        <div style={{ background: "#eff6ff", borderLeft: "4px solid #3b82f6", padding: "20px", borderRadius: "8px", marginBottom: "30px" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "8px", color: "#1e40af", fontSize: "16px", margin: "0 0 10px 0" }}><Bell size={20} /> Announcements</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {notifications.map(note => (
              <li key={note.notification_id} style={{ color: "#1e3a8a", fontSize: "14px", marginBottom: "6px" }}>• {note.message}</li>
            ))}
          </ul>
        </div>
      )}

      {message && <div style={{ padding: "15px", background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0", borderRadius: "8px", marginBottom: "20px", textAlign: "center", fontWeight: "600" }}>{message}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
        
        {/* Available Classes */}
        <div>
          <h2 style={{ fontSize: "20px", color: "#0f172a", marginBottom: "20px" }}>Open for Registration</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {classes.filter(c => !myRegistrations.find(r => r.class_id === c.class_id)).map(cls => {
              const isFull = cls.seat_limit > 0 && cls.current_enrollment >= cls.seat_limit;
              return (
                <div key={cls.class_id} style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "#2563eb", textTransform: "uppercase" }}>{cls.event_name}</span>
                  <h3 style={{ margin: "5px 0 15px 0", color: "#0f172a" }}>{cls.class_name}</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", color: "#64748b", fontSize: "14px", marginBottom: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><Calendar size={16} /> {cls.date ? cls.date.split('T')[0] : 'TBA'}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><Clock size={16} /> {cls.time || 'TBA'}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><MapPin size={16} /> {cls.venue || 'TBA'}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><Users size={16} /> {cls.current_enrollment} / {cls.seat_limit === 0 ? '∞' : cls.seat_limit} Seats</div>
                  </div>
                  <button onClick={() => handleRegister(cls.class_id)} disabled={isFull} style={{ width: "100%", padding: "10px", background: isFull ? "#cbd5e1" : "#2563eb", color: "white", border: "none", borderRadius: "6px", fontWeight: "600", cursor: isFull ? "not-allowed" : "pointer" }}>
                    {isFull ? "Class Full" : "Register Now"}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* My Registrations */}
        <div>
          <h2 style={{ fontSize: "20px", color: "#0f172a", marginBottom: "20px" }}>My Schedule & Tasks</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {myRegistrations.map(reg => (
              <div key={reg.class_id} style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", borderLeft: "4px solid #2563eb" }}>
                <h3 style={{ margin: "0 0 10px 0", color: "#0f172a" }}>{reg.class_name}</h3>
                <div style={{ color: "#64748b", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px", marginBottom: "15px" }}>
                  <Calendar size={16} /> {reg.date ? reg.date.split('T')[0] : ''} • {reg.venue}
                </div>
                
                {reg.requires_ppt ? (
                  reg.presentation_link ? (
                    <div style={{ background: "#f0fdf4", padding: "12px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "10px", color: "#15803d", fontSize: "14px", fontWeight: "500" }}>
                      <CheckCircle size={20} /> Presentation Submitted
                    </div>
                  ) : (
                    <div style={{ background: "#f8fafc", padding: "15px", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>Action Required: Upload PPT</label>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <input type="file" accept=".ppt,.pptx,.pdf" onChange={(e) => setSelectedFiles({...selectedFiles, [reg.class_id]: e.target.files[0]})} style={{ flex: 1, padding: "6px", fontSize: "13px", background: "white", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
                        <button onClick={() => handleFileUpload(reg.class_id)} style={{ background: "#2563eb", color: "white", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "600" }}>
                          <Upload size={14} /> Send
                        </button>
                      </div>
                    </div>
                  )
                ) : null}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentView;