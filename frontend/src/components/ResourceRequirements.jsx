import React, { useState, useEffect } from "react";
import { CheckSquare, Edit3, Plus, CheckCircle, Circle, Calendar } from "lucide-react";
import { fetchWithAuth } from "../api";

const ResourceRequirements = () => {
  const [classes, setClasses] = useState([]);
  const [resources, setResources] = useState([]);
  const [mode, setMode] = useState("checklist"); // 'checklist' or 'planning'
  const [loading, setLoading] = useState(true);
  
  // Quick Add Form State
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);
  const [activeAddClassId, setActiveAddClassId] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [eventsData, resourcesData] = await Promise.all([
        fetchWithAuth("/events"),
        fetchWithAuth("/events/master-resources")
      ]);
      
      // Extract all classes from the events hierarchy
      let allClasses = [];
      eventsData.forEach(event => {
        event.folders.forEach(folder => {
          folder.classes.forEach(cls => {
            allClasses.push({ ...cls, event_name: event.name });
          });
        });
      });
      
      // Sort classes by date ascending
      allClasses.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      setClasses(allClasses);
      setResources(resourcesData);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const toggleStatus = async (resourceId, currentStatus) => {
    const newStatus = currentStatus === "confirmed" ? "planned" : "confirmed";
    setResources(resources.map(r => r.resource_id === resourceId ? { ...r, status: newStatus } : r));
    try {
      await fetchWithAuth(`/events/resources/${resourceId}/status`, {
        method: "PUT", body: JSON.stringify({ status: newStatus })
      });
    } catch (err) { alert("Failed to update status."); loadData(); }
  };

  const handleAddRequirement = async (classId) => {
    if (!newItemName.trim()) return;
    try {
      await fetchWithAuth(`/events/classes/${classId}/resources`, {
        method: "POST", body: JSON.stringify({ name: newItemName, quantity: newItemQty })
      });
      setNewItemName(""); setNewItemQty(1); setActiveAddClassId(null);
      loadData(); // Refresh to show new item
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div style={{ padding: "30px" }}>Loading Resources...</div>;

  return (
    <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto" }}>
      
      {/* Header & Mode Toggle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "30px" }}>
        <div>
          <h1 style={{ fontSize: "28px", color: "#0f172a", marginBottom: "8px" }}>Required Resources</h1>
          <p style={{ color: "#64748b" }}>Manage requirements for all upcoming scheduled classes.</p>
        </div>
        
        <div style={{ display: "flex", background: "#f1f5f9", padding: "6px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
          <button 
            onClick={() => setMode("checklist")} 
            style={{ ...toggleBtnStyle, background: mode === "checklist" ? "white" : "transparent", color: mode === "checklist" ? "#2563eb" : "#64748b", boxShadow: mode === "checklist" ? "0 2px 4px rgba(0,0,0,0.05)" : "none" }}
          >
            <CheckSquare size={18} /> Checklist Mode
          </button>
          <button 
            onClick={() => setMode("planning")} 
            style={{ ...toggleBtnStyle, background: mode === "planning" ? "white" : "transparent", color: mode === "planning" ? "#2563eb" : "#64748b", boxShadow: mode === "planning" ? "0 2px 4px rgba(0,0,0,0.05)" : "none" }}
          >
            <Edit3 size={18} /> Planning Mode
          </button>
        </div>
      </div>

      {/* Classes List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
        {classes.map(cls => {
          const classResources = resources.filter(r => r.class_id === cls.class_id);
          const isDone = classResources.length > 0 && classResources.every(r => r.status === "confirmed");
          
          return (
            <div key={cls.class_id} style={{ background: "white", borderRadius: "12px", border: isDone && mode === 'checklist' ? "1px solid #86efac" : "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
              
              {/* Class Header */}
              <div style={{ background: isDone && mode === 'checklist' ? "#f0fdf4" : "#f8fafc", padding: "15px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "#2563eb", textTransform: "uppercase" }}>{cls.event_name}</span>
                  <h3 style={{ margin: "4px 0 0 0", color: "#0f172a", fontSize: "18px" }}>{cls.name}</h3>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "14px", fontWeight: "500" }}>
                  <Calendar size={16} /> {cls.date ? cls.date.split('T')[0] : 'TBA'}
                </div>
              </div>

              {/* Resources List */}
              <div style={{ padding: "20px" }}>
                {classResources.length === 0 ? (
                  <p style={{ color: "#94a3b8", fontSize: "14px", fontStyle: "italic", margin: 0 }}>No requirements added for this class yet.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {classResources.map(req => (
                      <div key={req.resource_id} onClick={() => mode === "checklist" && toggleStatus(req.resource_id, req.status)} style={{ display: "flex", alignItems: "center", padding: "12px 15px", background: req.status === "confirmed" ? "#f8fafc" : "white", border: "1px solid #e2e8f0", borderRadius: "8px", cursor: mode === "checklist" ? "pointer" : "default", transition: "all 0.2s" }}>
                        
                        {mode === "checklist" && (
                          <div style={{ marginRight: "15px", color: req.status === "confirmed" ? "#22c55e" : "#cbd5e1" }}>
                            {req.status === "confirmed" ? <CheckCircle size={22} /> : <Circle size={22} />}
                          </div>
                        )}
                        
                        <div style={{ flex: 1, textDecoration: req.status === "confirmed" && mode === "checklist" ? "line-through" : "none", opacity: req.status === "confirmed" && mode === "checklist" ? 0.6 : 1 }}>
                          <strong style={{ color: "#334155", fontSize: "15px" }}>{req.resource_name}</strong>
                          <span style={{ color: "#64748b", fontSize: "13px", marginLeft: "10px" }}>Qty: {req.quantity}</span>
                        </div>

                      </div>
                    ))}
                  </div>
                )}

                {/* Planning Mode: Add New Requirement */}
                {mode === "planning" && (
                  <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px dashed #cbd5e1" }}>
                    {activeAddClassId === cls.class_id ? (
                      <div style={{ display: "flex", gap: "10px" }}>
                        <input type="text" placeholder="E.g., Projector, Laptops..." value={newItemName} onChange={(e) => setNewItemName(e.target.value)} style={inputStyle} autoFocus />
                        <input type="number" placeholder="Qty" value={newItemQty} onChange={(e) => setNewItemQty(e.target.value)} style={{ ...inputStyle, width: "80px" }} min="1" />
                        <button onClick={() => handleAddRequirement(cls.class_id)} style={{ background: "#2563eb", color: "white", border: "none", borderRadius: "6px", padding: "0 15px", cursor: "pointer", fontWeight: "600" }}>Save</button>
                        <button onClick={() => setActiveAddClassId(null)} style={{ background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: "6px", padding: "0 15px", cursor: "pointer" }}>Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setActiveAddClassId(cls.class_id)} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "#2563eb", fontWeight: "600", cursor: "pointer", fontSize: "14px", padding: 0 }}>
                        <Plus size={16} /> Add Requirement
                      </button>
                    )}
                  </div>
                )}

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Clean inline styles
const toggleBtnStyle = { display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" };
const inputStyle = { flex: 1, padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", outline: "none" };

export default ResourceRequirements;