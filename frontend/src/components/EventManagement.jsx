import React, { useState, useEffect } from "react";
import { CheckSquare, Edit3, Plus, CheckCircle, Circle } from "lucide-react";
import { fetchWithAuth } from "../api";
import ResourcePlanning from "./ResourcePlanning";
import "./EventManagement.css";

const EventManagement = ({ user }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeEventId, setActiveEventId] = useState(null);
  const [activeFolderId, setActiveFolderId] = useState(null);
  const [editingClassId, setEditingClassId] = useState(null);
  const [editingEventId, setEditingEventId] = useState(null);
  
  const [isClassFormOpen, setIsClassFormOpen] = useState(false);
  
  const [logisticsMode, setLogisticsMode] = useState("checklist");
  const [activeLogisticsClassId, setActiveLogisticsClassId] = useState(null);
  const [newItemName, setNewItemName] = useState("");

  const [editEventForm, setEditEventForm] = useState({ name: "", type: "Training" });
  const [newEventName, setNewEventName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [classForm, setClassForm] = useState({ name: "", date: "", time: "", venue: "", seat_limit: 0, requires_ppt: false });
  const [classResources, setClassResources] = useState([]);

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
      await fetchWithAuth("/events", { method: "POST", body: JSON.stringify({ name: newEventName, type: "Training" }) });
      setNewEventName(""); loadEvents();
    } catch (err) { alert(err.message); }
  };

  const startEditEvent = (event) => {
    setEditingEventId(event.event_id);
    setEditEventForm({ name: event.name, type: event.type });
  };

  const handleUpdateEvent = async (eventId) => {
    if (!editEventForm.name.trim()) return;
    try {
      await fetchWithAuth(`/events/${eventId}`, { method: "PUT", body: JSON.stringify(editEventForm) });
      setEditingEventId(null); loadEvents();
    } catch (err) { alert(err.message); }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Delete ENTIRE event?")) return;
    try {
      await fetchWithAuth(`/events/${eventId}`, { method: "DELETE" }); loadEvents();
    } catch (err) { alert(err.message); }
  };

  const handleCreateFolder = async (eventId) => {
    if (!newFolderName.trim()) return;
    try {
      await fetchWithAuth(`/events/${eventId}/folders`, { method: "POST", body: JSON.stringify({ name: newFolderName }) });
      setNewFolderName(""); loadEvents();
    } catch (err) { alert(err.message); }
  };

  const handleSaveClass = async (folderId) => {
    if (!classForm.name.trim()) return alert("Class name is required");
    try {
      const payload = { ...classForm, resources: classResources };
      if (editingClassId) {
        await fetchWithAuth(`/events/classes/${editingClassId}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await fetchWithAuth(`/events/folders/${folderId}/classes`, { method: "POST", body: JSON.stringify(payload) });
      }
      resetClassForm(); loadEvents();
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
    setIsClassFormOpen(true);
    setClassForm({
      name: cls.name, date: cls.date ? cls.date.split('T')[0] : "",
      time: cls.time || "", venue: cls.venue || "", seat_limit: cls.seat_limit || 0,
      requires_ppt: cls.requires_ppt === 1 || cls.requires_ppt === true
    });
    setClassResources(cls.resources || []); 
  };

  const resetClassForm = () => {
    setEditingClassId(null);
    setIsClassFormOpen(false);
    setClassForm({ name: "", date: "", time: "", venue: "", seat_limit: 0, requires_ppt: false });
    setClassResources([]);
  };

  const handleToggleResourceStatus = async (resourceId, currentStatus) => {
    if (logisticsMode !== 'checklist') return; 
    const newStatus = currentStatus === "confirmed" ? "planned" : "confirmed";
    try {
      await fetchWithAuth(`/events/resources/${resourceId}/status`, { method: "PUT", body: JSON.stringify({ status: newStatus }) });
      loadEvents(); 
    } catch (err) { alert("Failed to update status."); }
  };

  const handleAddInlineResource = async (classId) => {
    if (!newItemName.trim()) return;
    try {
      await fetchWithAuth(`/events/classes/${classId}/resources`, { 
        method: "POST", 
        body: JSON.stringify({ name: newItemName, quantity: 1 }) // Quantity defaulted to 1 internally
      });
      setNewItemName(""); loadEvents();
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "20px" }}>Event Management</h2>

      {user.role === "admin" && (
        <div className="form-card" style={{ background: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", marginBottom: "30px" }}>
          <h3>Create New Event</h3>
          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <input placeholder="Enter Event Name" value={newEventName} onChange={(e) => setNewEventName(e.target.value)} className="input-style" />
            <button onClick={handleCreateEvent} className="btn-primary">Create Event</button>
          </div>
        </div>
      )}

      {events.map((event) => (
        <div key={event.event_id} className="event-card" style={{ background: "white", padding: "20px", borderRadius: "16px", marginBottom: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            
            {editingEventId === event.event_id ? (
              <div style={{ display: "flex", gap: "10px", flex: 1, marginRight: "15px" }}>
                <input value={editEventForm.name} onChange={(e) => setEditEventForm({...editEventForm, name: e.target.value})} className="input-style" style={{ marginBottom: 0 }} />
                <select value={editEventForm.type} onChange={(e) => setEditEventForm({...editEventForm, type: e.target.value})} className="input-style" style={{ marginBottom: 0, width: "auto" }}>
                  <option value="Training">Training</option>
                  <option value="Tech Fest">Tech Fest</option>
                  <option value="Industrial Visit">Industrial Visit</option>
                  <option value="Outbound Program">Outbound Program</option>
                </select>
                <button onClick={() => handleUpdateEvent(event.event_id)} className="btn-primary" style={{ background: "#48bb78" }}>Save</button>
                <button onClick={() => setEditingEventId(null)} className="btn-primary" style={{ background: "#a0aec0" }}>Cancel</button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <h3 style={{ margin: 0 }}>{event.name} <span style={{fontSize: '14px', color: '#718096', fontWeight: 'normal'}}>({event.type})</span></h3>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => startEditEvent(event)} style={{ background: "none", border: "none", color: "#667eea", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>Edit</button>
                  <button onClick={() => handleDeleteEvent(event.event_id)} style={{ background: "none", border: "none", color: "#e53e3e", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>Delete</button>
                </div>
              </div>
            )}

            <button className="btn-primary" onClick={() => setActiveEventId(activeEventId === event.event_id ? null : event.event_id)}>
              {activeEventId === event.event_id ? "Close Folders" : "Manage Folders"}
            </button>
          </div>

          {activeEventId === event.event_id && (
            <div style={{ marginTop: "20px", padding: "20px", background: "#f8f9fa", borderRadius: "12px" }}>
              <div style={{ display: "flex", gap: "10px", marginBottom: "25px" }}>
                <input placeholder="New Folder Name" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} className="input-style" style={{ marginBottom: 0 }} />
                <button onClick={() => handleCreateFolder(event.event_id)} className="btn-primary" style={{ background: "#4a5568" }}>Add Folder</button>
              </div>

              {event.folders?.map((folder) => (
                <div key={folder.folder_id} style={{ padding: "20px", background: "white", borderRadius: "12px", marginBottom: "15px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                    <h4 style={{ color: "#2d3748" }}>📁 {folder.name}</h4>
                    <button 
                      onClick={() => { setActiveFolderId(folder.folder_id); setIsClassFormOpen(!isClassFormOpen); if(isClassFormOpen) resetClassForm(); }} 
                      style={{ background: "#ebf4ff", padding: "6px 12px", borderRadius: "6px", border: "none", color: "#2563eb", cursor: "pointer", fontWeight: "600" }}
                    >
                      {activeFolderId === folder.folder_id && isClassFormOpen ? "Close Form" : "+ Add Class"}
                    </button>
                  </div>

                  {activeFolderId === folder.folder_id && isClassFormOpen && (
                    <div style={{ padding: "20px", background: "#f8fafc", borderRadius: "8px", marginBottom: "20px", border: "1px solid #e2e8f0" }}>
                      <h4>{editingClassId ? "Edit Class" : "New Class"}</h4>
                      <div style={{ display: "grid", gap: "15px", gridTemplateColumns: "1fr 1fr" }}>
                        <input placeholder="Class Name" value={classForm.name} onChange={(e) => setClassForm({...classForm, name: e.target.value})} className="input-style" />
                        <input placeholder="Venue" value={classForm.venue} onChange={(e) => setClassForm({...classForm, venue: e.target.value})} className="input-style" />
                        <input type="date" value={classForm.date} onChange={(e) => setClassForm({...classForm, date: e.target.value})} className="input-style" />
                        <input type="time" value={classForm.time} onChange={(e) => setClassForm({...classForm, time: e.target.value})} className="input-style" />
                        <input type="number" placeholder="Seats" value={classForm.seat_limit} onChange={(e) => setClassForm({...classForm, seat_limit: parseInt(e.target.value)})} className="input-style" />
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", gridColumn: "span 2" }}>
                          <input type="checkbox" checked={classForm.requires_ppt} onChange={(e) => setClassForm({...classForm, requires_ppt: e.target.checked})} />
                          Require Student PPT
                        </label>
                      </div>
                      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                        <button onClick={() => handleSaveClass(folder.folder_id)} className="btn-primary" style={{ flex: 1 }}>Save</button>
                        <button onClick={resetClassForm} className="btn-primary" style={{ flex: 1, background: "white", color: "#4a5568", border: "1px solid #cbd5e0" }}>Cancel</button>
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {folder.classes?.map((cls) => {
                      const classRes = cls.resources || [];
                      const isLogisticsOpen = activeLogisticsClassId === cls.class_id;
                      return (
                        <div key={cls.class_id} style={{ padding: "15px", background: "#f8f9fa", borderRadius: "8px", borderLeft: "4px solid #667eea" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <strong>{cls.name}</strong>
                              <span style={{ fontSize: "13px", color: "#718096", display: "block" }}>{cls.venue} | {cls.date?.split('T')[0]}</span>
                            </div>
                            <div style={{ display: "flex", gap: "10px" }}>
                              <button onClick={() => setActiveLogisticsClassId(isLogisticsOpen ? null : cls.class_id)} style={{ padding: "6px 12px", background: isLogisticsOpen ? "#2563eb" : "#edf2f7", color: isLogisticsOpen ? "white" : "#2d3748", border: "none", borderRadius: "6px", cursor: "pointer" }}>Logistics</button>
                              <button onClick={() => handleEditClick(cls)} className="btn-edit-small">Edit</button>
                              <button onClick={() => handleDeleteClass(cls.class_id)} className="btn-delete-small">Delete</button>
                            </div>
                          </div>

                          {isLogisticsOpen && (
                            <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px dashed #cbd5e1" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                                <h5 style={{ margin: 0, fontSize: "14px" }}>Requirements Checklist</h5>
                                <div style={{ display: "flex", background: "#e2e8f0", padding: "4px", borderRadius: "6px" }}>
                                  <button onClick={() => setLogisticsMode("checklist")} style={{ ...toggleBtnStyle, background: logisticsMode === "checklist" ? "white" : "transparent" }}><CheckSquare size={14} /> Checklist</button>
                                  <button onClick={() => setLogisticsMode("planning")} style={{ ...toggleBtnStyle, background: logisticsMode === "planning" ? "white" : "transparent" }}><Edit3 size={14} /> Plan</button>
                                </div>
                              </div>

                              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {classRes.map(req => (
                                  <div key={req.resource_id} onClick={() => handleToggleResourceStatus(req.resource_id, req.status)} style={{ display: "flex", alignItems: "center", padding: "10px", background: req.status === "confirmed" ? "#f0fdf4" : "white", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: logisticsMode === "checklist" ? "pointer" : "default" }}>
                                    {logisticsMode === "checklist" && (
                                      <div style={{ marginRight: "12px", color: req.status === "confirmed" ? "#22c55e" : "#cbd5e1" }}>
                                        {req.status === "confirmed" ? <CheckCircle size={18} /> : <Circle size={18} />}
                                      </div>
                                    )}
                                    <span style={{ flex: 1, textDecoration: req.status === "confirmed" && logisticsMode === "checklist" ? "line-through" : "none", opacity: req.status === "confirmed" && logisticsMode === "checklist" ? 0.6 : 1 }}>{req.name}</span>
                                  </div>
                                ))}
                              </div>

                              {logisticsMode === "planning" && (
                                <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                                  <input type="text" placeholder="Add requirement (e.g. Projector)" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} style={{ flex: 1, padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
                                  <button onClick={() => handleAddInlineResource(cls.class_id)} style={{ background: "#2563eb", color: "white", border: "none", borderRadius: "6px", padding: "0 15px", cursor: "pointer" }}><Plus size={14}/> Add</button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const toggleBtnStyle = { display: "flex", alignItems: "center", gap: "6px", padding: "4px 10px", border: "none", borderRadius: "4px", fontSize: "12px", fontWeight: "600", cursor: "pointer" };

export default EventManagement;