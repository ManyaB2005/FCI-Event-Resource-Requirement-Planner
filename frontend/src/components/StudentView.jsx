import React, { useState, useEffect } from "react";
import { Calendar, MapPin, CheckCircle, Clock, ExternalLink, Video, Lock, CalendarPlus } from "lucide-react";
import { fetchWithAuth } from "../api"; 

const StudentView = () => {
  const [activeTab, setActiveTab] = useState("available");
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // NEW: State to track which classes have been added to the calendar
  const [addedCalendars, setAddedCalendars] = useState([]);

  useEffect(() => { 
    loadData(); 
    
    // NEW: When the page loads, check the browser memory for clicked calendars
    const savedCalendars = localStorage.getItem("addedCalendars");
    if (savedCalendars) {
      setAddedCalendars(JSON.parse(savedCalendars));
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const enrolled = await fetchWithAuth("/student/my-registrations");
      const available = await fetchWithAuth("/student/classes");
      
      const safeEnrolled = Array.isArray(enrolled) ? enrolled : [];
      const safeAvailable = Array.isArray(available) ? available : [];
      
      setEnrolledClasses(safeEnrolled);

      const enrolledIds = new Set(safeEnrolled.map(c => c.class_id));
      setAvailableClasses(safeAvailable.filter(c => !enrolledIds.has(c.class_id)));
    } catch (err) {
      console.error("Data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (classId) => {
    try {
      await fetchWithAuth(`/student/classes/${classId}/register`, { method: "POST" });
      alert("Success! You are registered.");
      loadData();
      setActiveTab("enrolled");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleMarkUploaded = async (registrationId) => {
    try {
      await fetchWithAuth(`/student/registrations/${registrationId}/upload`, {
        method: "PUT",
        body: JSON.stringify({ presentation_link: "COMPLETED" })
      });
      loadData(); 
    } catch (err) {
      alert("Error updating status: " + err.message);
    }
  };

  // NEW: Function to handle clicking the calendar button
  const handleCalendarClick = (registrationId) => {
    // Add it to our React state
    const updatedList = [...addedCalendars, registrationId];
    setAddedCalendars(updatedList);
    
    // Save it to the browser's memory so it survives page refreshes
    localStorage.setItem("addedCalendars", JSON.stringify(updatedList));
  };

  const generateGoogleCalendarLink = (cls) => {
    const eventName = encodeURIComponent(`FCI Class: ${cls.name || cls.class_name}`);
    const details = encodeURIComponent(`You are registered for this class.\n\nEvent: ${cls.event_name || 'FCI Event'}`);
    const location = encodeURIComponent(cls.class_type === 'online' ? (cls.venue || 'Online Meeting') : (cls.venue || "TBA"));
    
    if (!cls.date) return "#"; 

    const d = new Date(cls.date);
    const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    const timeStr = cls.time ? cls.time.replace(/:/g, '') + '00' : '090000';
    
    const startDateTime = `${dateStr}T${timeStr}`;
    const endHour = Math.min(parseInt(timeStr.substring(0, 2)) + 2, 23);
    const endDateTime = `${dateStr}T${String(endHour).padStart(2, '0')}${timeStr.substring(2)}`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventName}&dates=${startDateTime}/${endDateTime}&details=${details}&location=${location}`;
  };

  if (loading) return <div style={{padding: "50px", textAlign: "center", color: "#4f46e5", fontWeight: "bold"}}>Loading Dashboard...</div>;

  return (
    <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h2 style={{ color: "#1e293b", margin: 0 }}>Student Portal</h2>
        <div style={{ display: "flex", background: "#f1f5f9", padding: "5px", borderRadius: "8px" }}>
          <button 
            onClick={() => setActiveTab("available")}
            style={{ padding: "10px 20px", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", background: activeTab === "available" ? "white" : "transparent", boxShadow: activeTab === "available" ? "0 2px 4px rgba(0,0,0,0.1)" : "none", color: activeTab === "available" ? "#4f46e5" : "#64748b" }}
          >
            Available Classes ({availableClasses.length})
          </button>
          <button 
            onClick={() => setActiveTab("enrolled")}
            style={{ padding: "10px 20px", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", background: activeTab === "enrolled" ? "white" : "transparent", boxShadow: activeTab === "enrolled" ? "0 2px 4px rgba(0,0,0,0.1)" : "none", color: activeTab === "enrolled" ? "#4f46e5" : "#64748b" }}
          >
            My Classes ({enrolledClasses.length})
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "25px" }}>
        
        {activeTab === "available" ? (
          availableClasses.map(cls => {
            const isOnline = cls.class_type === 'online' || (cls.venue && cls.venue.includes('http'));

            return (
              <div key={cls.class_id} style={{ background: "white", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
                <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", fontWeight: "bold" }}>{cls.event_name || "Event"}</span>
                <h3 style={{ margin: "8px 0 16px 0", color: "#1e293b", fontSize: "1.25rem" }}>{cls.name || cls.class_name}</h3>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                  <p style={{ margin: 0, fontSize: "14px", color: "#475569", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Calendar size={16} color="#6366f1"/> {new Date(cls.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <p style={{ margin: 0, fontSize: "14px", color: "#475569", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Clock size={16} color="#6366f1"/> {cls.time || "Time TBA"}
                  </p>
                  
                  {isOnline ? (
                    <span style={{ margin: "4px 0", padding: "8px 12px", background: "#f8fafc", borderRadius: "6px", fontSize: "13px", color: "#64748b", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "8px", border: "1px dashed #cbd5e1", width: "fit-content" }}>
                      <Lock size={14} /> Link revealed after registration
                    </span>
                  ) : (
                    <p style={{ margin: 0, fontSize: "14px", color: "#475569", display: "flex", alignItems: "center", gap: "8px" }}>
                      <MapPin size={16} color="#6366f1"/> {cls.venue || "Venue TBA"}
                    </p>
                  )}
                </div>

                <button 
                  onClick={() => handleRegister(cls.class_id)} 
                  style={{ width: "100%", padding: "12px", background: "#4f46e5", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", transition: "background 0.2s" }}
                >
                  Register Now
                </button>
              </div>
            );
          })
        ) : (
          
          enrolledClasses.map(cls => {
            const isOnline = cls.class_type === 'online' || (cls.venue && cls.venue.includes('http'));
            
            // NEW: Check if this specific class was added to the calendar
            const isAdded = addedCalendars.includes(cls.registration_id);

            return (
              <div key={cls.registration_id} style={{ background: "white", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0", borderLeft: "6px solid #10b981", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <h3 style={{ margin: "0 0 12px 0", color: "#1e293b" }}>{cls.class_name || cls.name}</h3>
                  <span style={{ background: "#dcfce7", color: "#166534", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "4px" }}>
                    <CheckCircle size={14}/> Enrolled
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "15px", borderBottom: "1px solid #f1f5f9", paddingBottom: "15px", flexGrow: 1 }}>
                  <p style={{ margin: 0, fontSize: "13px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Calendar size={14} /> {new Date(cls.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <p style={{ margin: 0, fontSize: "13px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Clock size={14} /> {cls.time || "Time TBA"}
                  </p>
                  
                  {isOnline ? (
                    <a 
                      href={cls.venue?.startsWith('http') ? cls.venue : `https://${cls.venue}`} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ margin: "8px 0", padding: "10px 16px", background: "#4f46e5", borderRadius: "8px", fontSize: "14px", color: "white", fontWeight: "bold", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", textDecoration: "none", boxShadow: "0 4px 6px -1px rgba(79, 70, 229, 0.3)", transition: "0.2s" }}
                    >
                      <Video size={18} /> Join Online Class
                    </a>
                  ) : (
                    <p style={{ margin: 0, fontSize: "13px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
                      <MapPin size={14} /> {cls.venue || "Venue TBA"}
                    </p>
                  )}

                  {/* UPDATED: Dynamic Button that changes when clicked */}
                  <a 
                    href={generateGoogleCalendarLink(cls)} 
                    target="_blank" 
                    rel="noreferrer"
                    onClick={() => handleCalendarClick(cls.registration_id)}
                    style={{ 
                      marginTop: "10px", padding: "8px 12px", 
                      background: isAdded ? "#f0fdf4" : "white", 
                      color: isAdded ? "#166534" : "#4f46e5", 
                      border: isAdded ? "1px solid #bbf7d0" : "1px solid #4f46e5", 
                      borderRadius: "8px", fontSize: "13px", fontWeight: "bold", 
                      display: "inline-flex", alignItems: "center", gap: "6px", 
                      textDecoration: "none", width: "fit-content", transition: "all 0.2s ease"
                    }}
                  >
                    {isAdded ? <CheckCircle size={16} /> : <CalendarPlus size={16} />}
                    {isAdded ? "Added to Calendar" : "Add to Calendar"}
                  </a>
                </div>

                {(cls.requires_ppt === 1 || cls.requires_ppt === true) ? (
                  <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", border: "1px dashed #cbd5e1" }}>
                     {cls.presentation_link === "COMPLETED" || cls.presentation_link ? (
                       <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#059669", fontWeight: "bold", fontSize: "13px" }}>
                          <CheckCircle size={16} /> PPT Successfully Uploaded
                       </div>
                     ) : (
                       <>
                        <p style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#475569", fontWeight: "600" }}>Submission Required:</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <a 
                            href={cls.drive_link} 
                            target="_blank" 
                            rel="noreferrer" 
                            style={{ textDecoration: "none", color: "#475569", background: "white", padding: "8px", borderRadius: "6px", fontSize: "13px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontWeight: "bold", border: "1px solid #cbd5e1" }}
                          >
                            <ExternalLink size={14}/> Open Google Drive
                          </a>
                          <button 
                            onClick={() => handleMarkUploaded(cls.registration_id)}
                            style={{ background: "white", border: "1px solid #10b981", color: "#10b981", padding: "8px", borderRadius: "6px", fontSize: "13px", cursor: "pointer", fontWeight: "bold" }}
                          >
                            Mark as Uploaded
                          </button>
                        </div>
                       </>
                     )}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
      
    </div>
  );
};

export default StudentView;