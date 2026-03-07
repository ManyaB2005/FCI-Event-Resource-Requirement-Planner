import React, { useState, useEffect } from "react";
import { 
  CheckSquare, Edit3, Plus, CheckCircle, Circle, ExternalLink, 
  Trash2, Folder, Calendar, MapPin, Video, Save, X, ChevronDown, ChevronUp
} from "lucide-react";
import { fetchWithAuth } from "../api";
import "./EventManagement.css";

const EventManagement = ({ user }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeEventId, setActiveEventId] = useState(null);
  const [viewingFolderId, setViewingFolderId] = useState(null); 
  const [activeFolderId, setActiveFolderId] = useState(null);
  const [editingClassId, setEditingClassId] = useState(null);
  const [editingEventId, setEditingEventId] = useState(null);
  
  const [isClassFormOpen, setIsClassFormOpen] = useState(false);
  
  const [logisticsMode, setLogisticsMode] = useState("checklist");
  const [activeLogisticsClassId, setActiveLogisticsClassId] = useState(null);
  const [activeClassResources, setActiveClassResources] = useState([]); 
  const [newItemName, setNewItemName] = useState("");

  const [editEventForm, setEditEventForm] = useState({ name: "" });
  const [newEventName, setNewEventName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderBatch, setNewFolderBatch] = useState(""); 
  
  // REMOVED: seat_limit from initial state
  const [classForm, setClassForm] = useState({ 
    name: "", date: "", time: "", venue: "", requires_ppt: false, drive_link: "", class_type: "offline" 
  });

  useEffect(() => { loadEvents(); }, []);

  const loadEvents = async () => {
    try {
      const data = await fetchWithAuth("/events");
      setEvents(data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const handleCreateEvent = async () => {
    if (!newEventName.trim()) return;
    try {
      await fetchWithAuth("/events", { method: "POST", body: JSON.stringify({ name: newEventName }) });
      setNewEventName(""); loadEvents();
    } catch (err) { alert(err.message); }
  };

  const startEditEvent = (event) => {
    setEditingEventId(event.event_id);
    setEditEventForm({ name: event.name });
  };

  const handleUpdateEvent = async (eventId) => {
    if (!editEventForm.name.trim()) return;
    try {
      await fetchWithAuth(`/events/${eventId}`, { method: "PUT", body: JSON.stringify(editEventForm) });
      setEditingEventId(null); loadEvents();
    } catch (err) { alert(err.message); }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Delete ENTIRE event? This will delete all folders and classes inside it.")) return;
    try {
      await fetchWithAuth(`/events/${eventId}`, { method: "DELETE" }); loadEvents();
    } catch (err) { alert(err.message); }
  };

  const handleCreateFolder = async (eventId) => {
    if (!newFolderName.trim()) return;
    try {
      await fetchWithAuth(`/events/${eventId}/folders`, { 
        method: "POST", body: JSON.stringify({ name: newFolderName, batch: newFolderBatch }) 
      });
      setNewFolderName(""); setNewFolderBatch(""); loadEvents();
    } catch (err) { alert(err.message); }
  };

  const handleDeleteFolder = async (folderId) => {
    if (!window.confirm("Delete this Sub-Event/Folder? All classes inside will be lost.")) return;
    try {
      await fetchWithAuth(`/events/folders/${folderId}`, { method: "DELETE" }); loadEvents();
    } catch (err) { alert(err.message); }
  };

  const handleSaveClass = async (folderId) => {
    if (!classForm.name.trim()) return alert("Class name is required");
    try {
      if (editingClassId) {
        await fetchWithAuth(`/events/classes/${editingClassId}`, { method: "PUT", body: JSON.stringify(classForm) });
      } else {
        await fetchWithAuth(`/events/folders/${folderId}/classes`, { method: "POST", body: JSON.stringify(classForm) });
      }
      resetClassForm(true); 
      loadEvents();
    } catch (err) { alert(err.message); }
  };

  const handleDeleteClass = async (classId) => {
    if (!window.confirm("Delete this class?")) return;
    try {
      await fetchWithAuth(`/events/classes/${classId}`, { method: "DELETE" }); loadEvents();
    } catch (err) { alert(err.message); }
  };

  const handleEditClick = (cls) => {
    setEditingClassId(cls.class_id);
    setActiveFolderId(cls.folder_id);
    setViewingFolderId(cls.folder_id); 
    setIsClassFormOpen(true);
    // REMOVED: seat_limit from edit mapping
    setClassForm({
      name: cls.name, date: cls.date ? cls.date.split('T')[0] : "", time: cls.time || "", 
      venue: cls.venue || "",
      requires_ppt: cls.requires_ppt === 1 || cls.requires_ppt === true,
      drive_link: cls.drive_link || "", class_type: cls.class_type || "offline"
    });
    
    setTimeout(() => {
      document.getElementById(`form-area-${cls.folder_id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const resetClassForm = (closeForm = true) => {
    setEditingClassId(null);
    if (closeForm === true) {
      setIsClassFormOpen(false);
    }
    // REMOVED: seat_limit from reset
    setClassForm({ name: "", date: "", time: "", venue: "", requires_ppt: false, drive_link: "", class_type: "offline" });
  };

  const handleLogisticsClick = async (classId) => {
    if (activeLogisticsClassId === classId) {
      setActiveLogisticsClassId(null);
      setActiveClassResources([]);
    } else {
      setActiveLogisticsClassId(classId);
      setLogisticsMode("checklist");
      try {
        const res = await fetchWithAuth(`/resources/class/${classId}?t=${new Date().getTime()}`);
        setActiveClassResources(Array.isArray(res) ? res : []);
      } catch (err) {
        setActiveClassResources([]);
      }
    }
  };

  const handleToggleResourceStatus = async (resourceId, currentStatus) => {
    if (logisticsMode !== 'checklist') return; 
    const newStatus = currentStatus === 'confirmed' ? 'planned' : 'confirmed';
    setActiveClassResources(prev => prev.map(res => res.resource_id === resourceId ? { ...res, status: newStatus } : res));
    try {
      await fetchWithAuth(`/resources/${resourceId}/status`, { method: "PUT", body: JSON.stringify({ status: newStatus }) });
    } catch (err) { alert("Failed to update status. Please refresh."); }
  };

  const handleAddInlineResource = async (classId) => {
    if (!newItemName.trim()) return;
    try {
      const response = await fetchWithAuth(`/resources/class/${classId}`, { 
        method: "POST", body: JSON.stringify({ name: newItemName, quantity: 1, unit: "pieces" }) 
      });
      const newResource = { resource_id: response.resource_id, class_id: classId, name: newItemName, quantity: 1, unit: "pieces", status: "planned" };
      setActiveClassResources(prev => [...prev, newResource]);
      setNewItemName(""); 
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div style={{ padding: "50px", textAlign: "center", color: "#4f46e5", fontSize: "1.2rem", fontWeight: "bold" }}>Loading Dashboard...</div>;

  return (
    <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h2 style={{ color: "#1e293b", margin: 0 }}>Event Management</h2>
      </div>

      {user.role === "admin" && (
        <div style={{ background: "white", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0", marginBottom: "35px" }}>
          <h3 style={{ margin: "0 0 15px 0", color: "#334155", fontSize: "1.1rem" }}>Create New Event</h3>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <input 
              placeholder="Enter  Event Name (e.g. Training)" 
              value={newEventName} 
              onChange={(e) => setNewEventName(e.target.value)} 
              style={{ flex: 1, minWidth: "250px", padding: "12px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "1rem", outline: "none" }} 
            />
            <button 
              onClick={handleCreateEvent} 
              style={{ display: "flex", alignItems: "center", gap: "8px", background: "#4f46e5", color: "white", padding: "0 24px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "600", transition: "0.2s" }}
            >
              <Plus size={18} /> Create Event
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "25px", alignItems: "start" }}>
        {events.map((event) => {
          const isActive = activeEventId === event.event_id;
          return (
            <div 
              key={event.event_id} 
              style={{ 
                background: "white", padding: "24px", borderRadius: "16px", 
                gridColumn: isActive ? "1 / -1" : "auto",
                border: isActive ? "2px solid #4f46e5" : "1px solid #e2e8f0", 
                boxShadow: isActive ? "0 20px 25px -5px rgba(0,0,0,0.1)" : "0 10px 15px -3px rgba(0,0,0,0.05)",
                transition: "all 0.3s ease"
              }}
            >
              <div style={{ display: "flex", flexDirection: isActive ? "row" : "column", justifyContent: "space-between", alignItems: isActive ? "center" : "stretch", gap: "20px", paddingBottom: isActive ? "20px" : "0", borderBottom: isActive ? "1px solid #f1f5f9" : "none" }}>
                {editingEventId === event.event_id ? (
                  <div style={{ display: "flex", flexDirection: isActive ? "row" : "column", gap: "10px", flex: 1, flexWrap: "wrap", alignItems: "center" }}>
                    <input 
                      value={editEventForm.name} 
                      onChange={(e) => setEditEventForm({...editEventForm, name: e.target.value})} 
                      style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "1rem", minWidth: "150px", textAlign: isActive ? "left" : "center", width: isActive ? "auto" : "100%", boxSizing: "border-box" }} 
                    />
                    <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                      <button onClick={() => handleUpdateEvent(event.event_id)} style={{ display: "flex", alignItems: "center", gap: "5px", background: "#10b981", color: "white", padding: "10px 16px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "bold" }}><Save size={16} /> Save</button>
                      <button onClick={() => setEditingEventId(null)} style={{ display: "flex", alignItems: "center", gap: "5px", background: "#f1f5f9", color: "#475569", padding: "10px 16px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "bold" }}><X size={16} /> Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: isActive ? "row" : "column", justifyContent: isActive ? "space-between" : "center", alignItems: "center", gap: "15px", flexWrap: "wrap", flex: 1 }}>
                    <h3 style={{ margin: 0, color: "#1e293b", fontSize: "1.4rem", wordBreak: "break-word", textAlign: isActive ? "left" : "center" }}>{event.name}</h3>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                      <button onClick={(e) => { e.stopPropagation(); startEditEvent(event); }} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: "#64748b", padding: "8px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "600", display: "flex", alignItems: "center", gap: "5px" }}>
                        <Edit3 size={14} /> Edit
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event.event_id); }} style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#ef4444", padding: "8px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "600", display: "flex", alignItems: "center", gap: "5px" }}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
                )}
                <button 
                  onClick={() => setActiveEventId(isActive ? null : event.event_id)} 
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: isActive ? "#f1f5f9" : "#4f46e5", color: isActive ? "#475569" : "white", padding: "12px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", transition: "all 0.2s", width: isActive ? "auto" : "100%" }}
                >
                  {isActive ? <><ChevronUp size={18}/> Close Folders</> : <><Folder size={18}/> Manage Folders</>}
                </button>
              </div>

              {isActive && (
                <div style={{ marginTop: "25px", padding: "24px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", gap: "12px", marginBottom: "30px", flexWrap: "wrap", background: "white", padding: "16px", borderRadius: "10px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", border: "1px solid #e2e8f0" }}>
                    <input placeholder="New Folder/Sub-Event Name" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} style={{ flex: 2, minWidth: "200px", padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none" }} />
                    <input placeholder="Batch" value={newFolderBatch} onChange={(e) => setNewFolderBatch(e.target.value)} style={{ flex: 1, minWidth: "150px", padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none" }} />
                    <button onClick={() => handleCreateFolder(event.event_id)} style={{ display: "flex", alignItems: "center", gap: "6px", background: "#334155", color: "white", padding: "10px 20px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "bold" }}>
                      <Plus size={16} /> Add Folder
                    </button>
                  </div>

                  {event.folders?.map((folder) => {
                    const isViewingFolder = viewingFolderId === folder.folder_id;
                    return (
                      <div key={folder.folder_id} style={{ background: "white", borderRadius: "12px", marginBottom: "20px", border: "1px solid #cbd5e1", overflow: "hidden", transition: "all 0.3s ease" }}>
                        <div 
                          onClick={() => setViewingFolderId(isViewingFolder ? null : folder.folder_id)}
                          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: isViewingFolder ? "#e2e8f0" : "#f8fafc", borderBottom: isViewingFolder ? "1px solid #cbd5e1" : "none", flexWrap: "wrap", gap: "10px", cursor: "pointer", transition: "0.2s" }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{ color: "#64748b" }}>{isViewingFolder ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>
                            <Folder color="#4f46e5" fill={isViewingFolder ? "white" : "#eef2ff"} size={24} />
                            <h4 style={{ color: "#1e293b", margin: 0, fontSize: "1.1rem" }}>{folder.name}</h4>
                            {folder.batch && <span style={{ fontSize: "12px", background: "white", padding: "4px 10px", borderRadius: "20px", color: "#475569", fontWeight: "bold", border: "1px solid #cbd5e1" }}>Batch: {folder.batch}</span>}
                          </div>
                          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.folder_id); }} style={{ background: "white", border: "1px solid #fecaca", color: "#ef4444", padding: "8px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "5px" }}><Trash2 size={14} /> Delete</button>
                            <button onClick={(e) => { e.stopPropagation(); setViewingFolderId(folder.folder_id); setActiveFolderId(folder.folder_id); resetClassForm(false); setIsClassFormOpen(true); }} style={{ display: "flex", alignItems: "center", gap: "6px", background: activeFolderId === folder.folder_id && isClassFormOpen ? "#334155" : "#eef2ff", color: activeFolderId === folder.folder_id && isClassFormOpen ? "white" : "#4f46e5", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}><Plus size={16}/> Add Class</button>
                          </div>
                        </div>

                        {isViewingFolder && (
                          <div style={{ animation: "fadeIn 0.3s ease-in-out" }}>
                            <div id={`form-area-${folder.folder_id}`}>
                              {activeFolderId === folder.folder_id && isClassFormOpen && (
                                <div style={{ padding: "24px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                                  <h4 style={{ margin: "0 0 15px 0", color: "#334155", display: "flex", alignItems: "center", gap: "8px" }}>
                                    {editingClassId ? <Edit3 size={18} color="#4f46e5"/> : <Plus size={18} color="#4f46e5"/>} {editingClassId ? "Edit Class Details" : "Configure New Class"}
                                  </h4>
                                  <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "1fr 1fr" }}>
                                    <input placeholder="Class Name" value={classForm.name} onChange={(e) => setClassForm({...classForm, name: e.target.value})} style={formInputStyle} />
                                    <div style={{ display: "flex", gap: "10px" }}>
                                      <select value={classForm.class_type} onChange={(e) => setClassForm({...classForm, class_type: e.target.value})} style={{ ...formInputStyle, flex: "0 0 140px", cursor: "pointer", background: "white" }}>
                                        <option value="offline">Offline</option>
                                        <option value="online">Online</option>
                                      </select>
                                      <input placeholder={classForm.class_type === 'online' ? "Meeting Link" : "Venue"} value={classForm.venue} onChange={(e) => setClassForm({...classForm, venue: e.target.value})} style={{ ...formInputStyle, flex: 1 }} />
                                    </div>
                                    <input type="date" value={classForm.date} onChange={(e) => setClassForm({...classForm, date: e.target.value})} style={formInputStyle} />
                                    <input type="time" value={classForm.time} onChange={(e) => setClassForm({...classForm, time: e.target.value})} style={formInputStyle} />
                                    
                                    {/* REMOVED: Seat Limit Input was here */}

                                    <input type="url" placeholder="Drive Upload Link (Optional)" value={classForm.drive_link} onChange={(e) => setClassForm({...classForm, drive_link: e.target.value})} style={{ ...formInputStyle, gridColumn: "span 2" }} />
                                    <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", gridColumn: "span 2", background: "white", padding: "12px", borderRadius: "8px", border: "1px dashed #cbd5e1", cursor: "pointer" }}>
                                      <input type="checkbox" checked={classForm.requires_ppt} onChange={(e) => setClassForm({...classForm, requires_ppt: e.target.checked})} style={{ width: "16px", height: "16px" }} />
                                      <strong>Require Students to Upload Presentation</strong>
                                    </label>
                                  </div>
                                  <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
                                    <button onClick={() => handleSaveClass(folder.folder_id)} style={{ flex: 1, background: "#10b981", color: "white", padding: "12px", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}><Save size={18} /> Save Class</button>
                                    <button onClick={() => resetClassForm(true)} style={{ flex: 1, background: "white", color: "#475569", border: "1px solid #cbd5e1", padding: "12px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Cancel</button>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "15px", background: "white" }}>
                              {folder.classes?.length === 0 && <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "0.9rem", margin: 0 }}>No classes added.</p>}
                              {folder.classes?.map((cls) => {
                                const isLogisticsOpen = activeLogisticsClassId === cls.class_id;
                                const classRes = isLogisticsOpen ? activeClassResources : []; 
                                return (
                                  <div key={cls.class_id} style={{ padding: "16px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0", borderLeft: "5px solid #4f46e5" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "15px" }}>
                                      <div>
                                        <strong style={{ display: "block", color: "#1e293b", fontSize: "1.1rem", marginBottom: "6px" }}>{cls.name}</strong>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "13px", color: "#64748b" }}>
                                          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Calendar size={14} /> {cls.date?.split('T')[0]} {cls.time && `at ${cls.time}`}</span>
                                          {cls.class_type === 'online' ? <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#4f46e5", fontWeight: "600" }}><Video size={14} /> Online: {cls.venue}</span> : <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><MapPin size={14} /> Venue: {cls.venue || "TBA"}</span>}
                                        </div>
                                      </div>
                                      <div style={{ display: "flex", gap: "8px" }}>
                                        <button onClick={() => handleLogisticsClick(cls.class_id)} style={{ padding: "8px 14px", background: isLogisticsOpen ? "#4f46e5" : "white", color: isLogisticsOpen ? "white" : "#4f46e5", border: "1px solid #4f46e5", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>Resources</button>
                                        <button onClick={() => handleEditClick(cls)} style={{ padding: "8px 14px", background: "white", color: "#475569", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>Edit</button>
                                        <button onClick={() => handleDeleteClass(cls.class_id)} style={{ padding: "8px", background: "transparent", color: "#ef4444", border: "none", cursor: "pointer" }}><Trash2 size={18}/></button>
                                      </div>
                                    </div>
                                    {isLogisticsOpen && (
                                      <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid #e2e8f0" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                                          <h5 style={{ margin: 0, fontSize: "14px", color: "#334155" }}>Resources</h5>
                                          <div style={{ display: "flex", background: "#e2e8f0", padding: "4px", borderRadius: "8px" }}>
                                            <button onClick={() => setLogisticsMode("checklist")} style={{ padding: "6px 12px", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", background: logisticsMode === "checklist" ? "white" : "transparent", color: logisticsMode === "checklist" ? "#4f46e5" : "#64748b" }}>Checklist</button>
                                            <button onClick={() => setLogisticsMode("planning")} style={{ padding: "6px 12px", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", background: logisticsMode === "planning" ? "white" : "transparent", color: logisticsMode === "planning" ? "#4f46e5" : "#64748b" }}>Add Items</button>
                                          </div>
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                          {classRes.map(req => (
                                            <div key={req.resource_id} onClick={() => handleToggleResourceStatus(req.resource_id, req.status)} style={{ display: "flex", alignItems: "center", padding: "12px 16px", background: req.status === "confirmed" ? "#f0fdf4" : "white", border: req.status === "confirmed" ? "1px solid #bbf7d0" : "1px solid #cbd5e1", borderRadius: "8px", cursor: "pointer" }}>
                                              {logisticsMode === "checklist" && <div style={{ marginRight: "12px" }}>{req.status === "confirmed" ? <CheckCircle size={20} color="#059669" /> : <Circle size={20} color="#cbd5e1" />}</div>}
                                              <span style={{ flex: 1, textDecoration: req.status === "confirmed" && logisticsMode === "checklist" ? "line-through" : "none", color: req.status === "confirmed" && logisticsMode === "checklist" ? "#94a3b8" : "#334155" }}>{req.name}</span>
                                            </div>
                                          ))}
                                          {logisticsMode === "planning" && (
                                            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                                              <input type="text" placeholder="New requirement" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} style={{ flex: 1, padding: "10px", border: "1px solid #cbd5e1", borderRadius: "8px" }} />
                                              <button onClick={() => handleAddInlineResource(cls.class_id)} style={{ background: "#4f46e5", color: "white", border: "none", borderRadius: "8px", padding: "0 15px", fontWeight: "bold" }}>Add</button>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const formInputStyle = {
  padding: "12px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.95rem", outline: "none", width: "100%", boxSizing: "border-box"
};

export default EventManagement;