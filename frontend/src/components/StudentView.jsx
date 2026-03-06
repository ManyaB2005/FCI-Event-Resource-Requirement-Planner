import React, { useState, useEffect } from "react";
import { Calendar, UploadCloud, MapPin, CheckCircle, Clock, ExternalLink } from "lucide-react";
import { fetchWithAuth } from "../api"; 

const StudentView = () => {
  const [activeTab, setActiveTab] = useState("available");
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const enrolled = await fetchWithAuth("/student/my-registrations");
      const available = await fetchWithAuth("/student/classes");
      
      const safeEnrolled = Array.isArray(enrolled) ? enrolled : [];
      const safeAvailable = Array.isArray(available) ? available : [];
      
      setEnrolledClasses(safeEnrolled);

      // Filter: If they are enrolled, don't show it in 'Available'
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
      // Just sending a flag to the backend to indicate completion
      await fetchWithAuth(`/student/registrations/${registrationId}/upload`, {
        method: "PUT",
        body: JSON.stringify({ presentation_link: "COMPLETED" })
      });
      loadData(); // Refresh UI to show the green checkmark
    } catch (err) {
      alert("Error updating status: " + err.message);
    }
  };

  if (loading) return <div style={{padding: "50px", textAlign: "center"}}>Loading Dashboard...</div>;

  return (
    <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h2 style={{ color: "#1e293b" }}>Student Portal</h2>
        <div style={{ display: "flex", background: "#f1f5f9", padding: "5px", borderRadius: "8px" }}>
          <button 
            onClick={() => setActiveTab("available")}
            style={{ 
              padding: "10px 20px", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600",
              background: activeTab === "available" ? "white" : "transparent",
              boxShadow: activeTab === "available" ? "0 2px 4px rgba(0,0,0,0.1)" : "none"
            }}
          >
            Available Classes ({availableClasses.length})
          </button>
          <button 
            onClick={() => setActiveTab("enrolled")}
            style={{ 
              padding: "10px 20px", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600",
              background: activeTab === "enrolled" ? "white" : "transparent",
              boxShadow: activeTab === "enrolled" ? "0 2px 4px rgba(0,0,0,0.1)" : "none"
            }}
          >
            My Classes ({enrolledClasses.length})
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "25px" }}>
        {activeTab === "available" ? (
          availableClasses.map(cls => (
            <div key={cls.class_id} style={{ background: "white", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
              <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", fontWeight: "bold" }}>{cls.event_name || "Event"}</span>
              <h3 style={{ margin: "8px 0 16px 0", color: "#1e293b", fontSize: "1.25rem" }}>{cls.name || cls.class_name}</h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
                <p style={{ margin: 0, fontSize: "14px", color: "#475569", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Calendar size={16} color="#6366f1"/> {new Date(cls.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <p style={{ margin: 0, fontSize: "14px", color: "#475569", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Clock size={16} color="#6366f1"/> {cls.time || "Time TBA"}
                </p>
                <p style={{ margin: 0, fontSize: "14px", color: "#475569", display: "flex", alignItems: "center", gap: "8px" }}>
                  <MapPin size={16} color="#6366f1"/> {cls.venue || "Venue TBA"}
                </p>
              </div>

              <button 
                onClick={() => handleRegister(cls.class_id)} 
                style={{ width: "100%", padding: "12px", background: "#4f46e5", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", transition: "background 0.2s" }}
              >
                Register Now
              </button>
            </div>
          ))
        ) : (
          enrolledClasses.map(cls => (
            <div key={cls.registration_id} style={{ background: "white", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0", borderLeft: "6px solid #10b981", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <h3 style={{ margin: "0 0 12px 0", color: "#1e293b" }}>{cls.class_name || cls.name}</h3>
                <span style={{ background: "#dcfce7", color: "#166534", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "4px" }}>
                  <CheckCircle size={14}/> Enrolled
                </span>
              </div>

              {/* Data stays visible after enrollment */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "15px", borderBottom: "1px solid #f1f5f9", paddingBottom: "15px" }}>
                <p style={{ margin: 0, fontSize: "13px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Calendar size={14} /> {new Date(cls.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <p style={{ margin: 0, fontSize: "13px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Clock size={14} /> {cls.time || "Time TBA"}
                </p>
                <p style={{ margin: 0, fontSize: "13px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
                  <MapPin size={14} /> {cls.venue || "Venue TBA"}
                </p>
              </div>

              {cls.requires_ppt && (
                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", border: "1px dashed #cbd5e1" }}>
                   {cls.presentation_link === "COMPLETED" || cls.presentation_link ? (
                     <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#059669", fontWeight: "bold" }}>
                        <CheckCircle size={18} /> PPT Successfully Uploaded
                     </div>
                   ) : (
                     <>
                      <p style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#475569", fontWeight: "600" }}>Submission Required:</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <a 
                          href={cls.drive_link} 
                          target="_blank" 
                          rel="noreferrer" 
                          style={{ textDecoration: "none", color: "white", background: "#4f46e5", padding: "8px", borderRadius: "6px", fontSize: "13px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                        >
                          <ExternalLink size={14}/> Open Google Drive
                        </a>
                        <button 
                          onClick={() => handleMarkUploaded(cls.registration_id)}
                          style={{ background: "white", border: "1px solid #4f46e5", color: "#4f46e5", padding: "8px", borderRadius: "6px", fontSize: "13px", cursor: "pointer", fontWeight: "bold" }}
                        >
                          Mark as Uploaded
                        </button>
                      </div>
                     </>
                   )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      {activeTab === "available" && availableClasses.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>No new classes available for registration at the moment.</div>
      )}
    </div>
  );
};

export default StudentView;