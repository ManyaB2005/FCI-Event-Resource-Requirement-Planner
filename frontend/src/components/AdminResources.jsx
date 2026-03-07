import React, { useState, useEffect } from "react";
import { fetchWithAuth } from "../api";
import { 
  ClipboardList, Plus, Trash2, CheckCircle, Circle, 
  Package, Filter
} from "lucide-react";

const AdminResources = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState("pieces");

  useEffect(() => {
    fetchWithAuth("/events")
      .then(data => {
        const flatClasses = [];
        data.forEach(event => {
          event.folders?.forEach(folder => {
            folder.classes?.forEach(cls => {
              flatClasses.push({ ...cls, event_name: event.name });
            });
          });
        });
        setClasses(flatClasses);
        if (flatClasses.length > 0) {
          setSelectedClassId(flatClasses[0].class_id);
        }
      })
      .catch(err => console.error("Error fetching classes:", err));
  }, []);

  useEffect(() => {
    if (!selectedClassId) return;
    setLoading(true);
    fetchWithAuth(`/resources/class/${selectedClassId}?t=${new Date().getTime()}`)
      .then(data => setResources(Array.isArray(data) ? data : []))
      .catch(err => setResources([])) 
      .finally(() => setLoading(false));
  }, [selectedClassId]);

  const handleAddResource = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const response = await fetchWithAuth(`/resources/class/${selectedClassId}`, {
        method: "POST", body: JSON.stringify({ name, quantity, unit })
      });
      
      const newResource = {
        resource_id: response.resource_id, class_id: selectedClassId,
        name: name, quantity: quantity, unit: unit, status: "planned"
      };
      
      setResources(prev => [newResource, ...prev]);
      setName(""); setQuantity(1); setUnit("pieces");
    } catch (err) { alert("Error adding resource: " + err.message); }
  };

  // SIMPLIFIED: Just toggles between planned (pending) and confirmed (completed)
  const toggleStatus = async (resourceId, currentStatus) => {
    const newStatus = currentStatus === 'confirmed' ? 'planned' : 'confirmed';

    setResources(prev => 
      prev.map(r => r.resource_id === resourceId ? { ...r, status: newStatus } : r)
    );

    try {
      await fetchWithAuth(`/resources/${resourceId}/status`, {
        method: "PUT", body: JSON.stringify({ status: newStatus })
      });
    } catch (err) { alert("Error updating status. Please refresh."); }
  };

  const deleteResource = async (resourceId) => {
    if (!window.confirm("Are you sure you want to remove this requirement?")) return;
    setResources(prev => prev.filter(r => r.resource_id !== resourceId));
    try { await fetchWithAuth(`/resources/${resourceId}`, { method: "DELETE" }); } 
    catch (err) { alert("Error deleting resource. Please refresh."); }
  };

  const totalItems = resources.length;
  const completedItems = resources.filter(r => r.status === 'confirmed').length;
  const pendingItems = totalItems - completedItems;

  return (
    <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "30px" }}>
        <div>
          <h2 style={{ color: "#1e293b", margin: 0, display: "flex", alignItems: "center", gap: "12px", fontSize: "2rem" }}>
            <ClipboardList size={36} color="#4f46e5" /> Resource Planner
          </h2>
          <p style={{ margin: "8px 0 0 0", color: "#64748b", fontSize: "1rem" }}>Plan and track physical requirements for upcoming classes.</p>
        </div>
      </div>

      <div style={{ background: "white", padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", marginBottom: "30px", display: "flex", alignItems: "center", gap: "15px" }}>
        <Filter size={20} color="#64748b" />
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>Select a Class to Manage</label>
          <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} style={{ width: "100%", padding: "12px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", color: "#1e293b", fontWeight: "600", outline: "none", cursor: "pointer", fontSize: "15px" }}>
            {classes.length === 0 ? <option>No classes available</option> : null}
            {classes.map(cls => (
              <option key={cls.class_id} value={cls.class_id}>
                {cls.event_name} — {cls.name} ({cls.date?.split('T')[0]})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "30px", alignItems: "start" }}>
        
        <div style={{ background: "white", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", position: "sticky", top: "30px" }}>
          <h3 style={{ margin: "0 0 20px 0", color: "#1e293b", fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <Plus size={20} color="#4f46e5" /> Add Requirement
          </h3>
          <form onSubmit={handleAddResource} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>Item Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Projector, Water Bottles..." required style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", gap: "15px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>Quantity</label>
                <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>Unit</label>
                <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g. pieces, boxes" required style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>
            <button type="submit" style={{ background: "#4f46e5", color: "white", padding: "12px", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer", transition: "0.2s", marginTop: "10px" }} onMouseOver={(e) => e.currentTarget.style.background = "#4338ca"} onMouseOut={(e) => e.currentTarget.style.background = "#4f46e5"}>
              Add to Checklist
            </button>
          </form>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, background: "white", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "12px" }}>
              <Package size={24} color="#64748b" />
              <div><p style={{ margin: 0, fontSize: "12px", color: "#64748b", fontWeight: "600" }}>Total Items</p><h4 style={{ margin: 0, fontSize: "1.2rem" }}>{totalItems}</h4></div>
            </div>
            <div style={{ flex: 1, background: "#fffbeb", padding: "16px", borderRadius: "12px", border: "1px solid #fde68a", display: "flex", alignItems: "center", gap: "12px" }}>
              <Circle size={24} color="#d97706" />
              <div><p style={{ margin: 0, fontSize: "12px", color: "#d97706", fontWeight: "600" }}>Pending</p><h4 style={{ margin: 0, fontSize: "1.2rem", color: "#b45309" }}>{pendingItems}</h4></div>
            </div>
            <div style={{ flex: 1, background: "#ecfdf5", padding: "16px", borderRadius: "12px", border: "1px solid #a7f3d0", display: "flex", alignItems: "center", gap: "12px" }}>
              <CheckCircle size={24} color="#059669" />
              <div><p style={{ margin: 0, fontSize: "12px", color: "#059669", fontWeight: "600" }}>Completed</p><h4 style={{ margin: 0, fontSize: "1.2rem", color: "#047857" }}>{completedItems}</h4></div>
            </div>
          </div>

          {loading ? (
             <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>Loading checklist...</div>
          ) : resources.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: "16px", border: "1px dashed #cbd5e1", color: "#64748b" }}>
              <ClipboardList size={48} color="#cbd5e1" style={{ marginBottom: "15px" }} />
              <h3 style={{ color: "#334155", margin: "0 0 8px 0" }}>No Requirements Yet</h3>
              <p style={{ margin: 0 }}>Use the form to add items needed for this class.</p>
            </div>
          ) : (
            <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                    <th style={{ padding: "16px 20px", color: "#64748b", fontSize: "13px", fontWeight: "600", textTransform: "uppercase" }}>Item Name</th>
                    <th style={{ padding: "16px 20px", color: "#64748b", fontSize: "13px", fontWeight: "600", textTransform: "uppercase" }}>Quantity</th>
                    <th style={{ padding: "16px 20px", color: "#64748b", fontSize: "13px", fontWeight: "600", textTransform: "uppercase" }}>Status</th>
                    <th style={{ padding: "16px 20px", color: "#64748b", fontSize: "13px", fontWeight: "600", textTransform: "uppercase", textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map((res) => (
                    <tr key={res.resource_id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "16px 20px", fontWeight: "600", color: "#1e293b", fontSize: "15px", textDecoration: res.status === 'confirmed' ? 'line-through' : 'none' }}>{res.name}</td>
                      <td style={{ padding: "16px 20px", fontWeight: "bold", color: "#475569", fontSize: "15px" }}>{res.quantity} <span style={{ fontWeight: "normal", fontSize: "13px", color: "#94a3b8" }}>{res.unit}</span></td>
                      <td style={{ padding: "16px 20px" }}>
                        <button 
                          onClick={() => toggleStatus(res.resource_id, res.status)}
                          style={{ 
                            display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold", cursor: "pointer", border: "none", transition: "0.2s",
                            background: res.status === 'confirmed' ? "#ecfdf5" : "#f1f5f9",
                            color: res.status === 'confirmed' ? "#059669" : "#64748b",
                            border: res.status === 'confirmed' ? "1px solid #a7f3d0" : "1px solid #cbd5e1"
                          }}
                        >
                          {res.status === 'confirmed' ? <><CheckCircle size={14}/> Completed</> : <><Circle size={14}/> Pending</>}
                        </button>
                      </td>
                      <td style={{ padding: "16px 20px", textAlign: "right" }}>
                        <button onClick={() => deleteResource(res.resource_id)} style={{ background: "#fef2f2", color: "#ef4444", border: "none", padding: "8px", borderRadius: "8px", cursor: "pointer", display: "inline-flex" }}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminResources;