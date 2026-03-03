import React, { useState, useEffect } from "react";
import { Folder, ChevronRight, ChevronDown, User, Clock } from "lucide-react";
import { fetchWithAuth } from "../api";
import "./AdminRegistrations.css";

const AdminRegistrations = () => {
  const [groupedData, setGroupedData] = useState({});
  const [expandedFolders, setExpandedFolders] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getData = async () => {
      try {
        const data = await fetchWithAuth("/admin/registrations");
        
        // ORGANIZE INTO FOLDERS
        const groups = data.reduce((acc, reg) => {
          const key = reg.event_name; // This creates the "C Class Day 1" folder
          if (!acc[key]) acc[key] = [];
          acc[key].push(reg);
          return acc;
        }, {});
        
        setGroupedData(groups);
      } catch (err) {
        console.error("Fetch error", err);
      } finally {
        setLoading(false);
      }
    };
    getData();
  }, []);

  const toggleFolder = (name) => {
    setExpandedFolders(prev => ({ ...prev, [name]: !prev[name] }));
  };

  if (loading) return <div className="loader">Organizing Database...</div>;

  return (
    <div className="admin-folder-container">
      <div className="page-title">
        <h1>Student <span>Enrollments</span></h1>
        <p>Sorted by Class / Event Name</p>
      </div>

      <div className="folders-grid">
        {Object.entries(groupedData).map(([className, students]) => (
          <div key={className} className={`folder-wrapper ${expandedFolders[className] ? 'open' : ''}`}>
            
            {/* Folder Header */}
            <div className="folder-tab" onClick={() => toggleFolder(className)}>
              <div className="tab-left">
                {expandedFolders[className] ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
                <Folder size={20} className="folder-icon-color" />
                <span className="class-label">{className}</span>
              </div>
              <span className="count-badge">{students.length} Registered</span>
            </div>

            {/* Students inside Folder */}
            {expandedFolders[className] && (
              <div className="folder-details">
                <div className="student-list-header">
                  <span>Student Name</span>
                  <span>Joined Date</span>
                </div>
                {students.map(std => (
                  <div key={std.id} className="student-row">
                    <div className="std-info">
                      <User size={14} />
                      {std.student_name}
                    </div>
                    <div className="std-date">
                      <Clock size={14} />
                      {new Date(std.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminRegistrations;