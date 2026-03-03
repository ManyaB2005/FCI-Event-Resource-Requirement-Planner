import React, { useState } from "react";
import { Plus, Edit2, Trash2, CheckCircle, Circle } from "lucide-react";

const ResourcePlanning = ({ resources = [], setResources }) => {
  const [newItem, setNewItem] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState("");

  // Add a new requirement
  const handleAdd = (e) => {
    e.preventDefault(); // Prevents the parent form from accidentally submitting
    if (!newItem.trim()) return;

    setResources([
      ...resources,
      { 
        id: Date.now(), // Temporary ID for frontend rendering
        name: newItem, 
        completed: false,
        quantity: 1,
        unit: "pcs",
        status: "planned"
      }
    ]);
    setNewItem("");
  };

  // Delete a requirement
  const handleDelete = (indexToDelete) => {
    const updated = resources.filter((_, index) => index !== indexToDelete);
    setResources(updated);
  };

  // Toggle checklist status
  const handleToggle = (indexToToggle) => {
    const updated = resources.map((item, index) => {
      if (index === indexToToggle) {
        return { 
          ...item, 
          completed: !item.completed,
          status: !item.completed ? "confirmed" : "planned" 
        };
      }
      return item;
    });
    setResources(updated);
  };

  // Inline Editing
  const startEdit = (index, currentName) => {
    setEditingIndex(index);
    setEditValue(currentName);
  };

  const handleEditSave = (indexToSave) => {
    if (!editValue.trim()) return;
    
    const updated = resources.map((item, index) => {
      if (index === indexToSave) {
        return { ...item, name: editValue };
      }
      return item;
    });
    
    setResources(updated);
    setEditingIndex(null);
    setEditValue("");
  };

  return (
    <div style={{ background: "white", padding: "15px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
      
      {/* Input Area */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
        <input
          type="text"
          placeholder="e.g., 50 Printed Handouts, Projector, Snacks..."
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd(e)}
          style={{
            flex: 1, padding: "10px 12px", borderRadius: "6px",
            border: "1px solid #cbd5e0", outline: "none", fontSize: "14px"
          }}
        />
        <button
          onClick={handleAdd}
          type="button"
          style={{
            padding: "10px 15px", borderRadius: "6px", border: "none",
            background: "#667eea", color: "white", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "6px", fontWeight: "500"
          }}
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {/* List Area */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {resources.length === 0 ? (
          <p style={{ fontSize: "13px", color: "#a0aec0", fontStyle: "italic", textAlign: "center", padding: "10px 0" }}>
            No requirements added yet.
          </p>
        ) : (
          resources.map((item, index) => (
            <div 
              key={item.id || index} 
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 12px", background: item.completed ? "#f0fff4" : "#f8f9fa",
                border: `1px solid ${item.completed ? "#9ae6b4" : "#e2e8f0"}`,
                borderRadius: "6px", transition: "all 0.2s ease"
              }}
            >
              
              {/* Left Side: Checkbox & Name */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                <button 
                  type="button"
                  onClick={() => handleToggle(index)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: item.completed ? "#48bb78" : "#a0aec0", display: "flex", alignItems: "center" }}
                >
                  {item.completed ? <CheckCircle size={20} /> : <Circle size={20} />}
                </button>

                {editingIndex === index ? (
                  <div style={{ display: "flex", gap: "6px", flex: 1 }}>
                    <input
                      autoFocus
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleEditSave(index)}
                      style={{ flex: 1, padding: "4px 8px", fontSize: "14px", border: "1px solid #cbd5e0", borderRadius: "4px" }}
                    />
                    <button type="button" onClick={() => handleEditSave(index)} style={{ padding: "4px 8px", background: "#48bb78", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>Save</button>
                  </div>
                ) : (
                  <span style={{ fontSize: "14px", color: "#2d3748", textDecoration: item.completed ? "line-through" : "none", opacity: item.completed ? 0.6 : 1 }}>
                    {item.name}
                  </span>
                )}
              </div>

              {/* Right Side: Actions */}
              {editingIndex !== index && (
                <div style={{ display: "flex", gap: "6px" }}>
                  <button type="button" onClick={() => startEdit(index, item.name)} style={{ background: "none", border: "none", color: "#a0aec0", cursor: "pointer", padding: "4px" }} title="Edit">
                    <Edit2 size={16} />
                  </button>
                  <button type="button" onClick={() => handleDelete(index)} style={{ background: "none", border: "none", color: "#fc8181", cursor: "pointer", padding: "4px" }} title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              )}

            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ResourcePlanning;