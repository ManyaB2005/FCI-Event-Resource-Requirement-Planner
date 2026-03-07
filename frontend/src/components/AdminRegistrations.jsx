import React, { useState, useEffect } from "react";
import { fetchWithAuth } from "../api";
import { 
  CheckCircle, XCircle, MinusCircle, Printer, GraduationCap, 
  Filter, Search, Users, FileText, ChevronDown, ChevronUp, Monitor, MapPin
} from "lucide-react";

const AdminRegistrations = () => {
  const [registrations, setRegistrations] = useState({});
  const [loading, setLoading] = useState(true);
  
  const [selectedClass, setSelectedClass] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [classSearchTerm, setClassSearchTerm] = useState(""); // NEW: Class Search
  
  // NEW: State to track which class tables are expanded/collapsed
  const [expandedClasses, setExpandedClasses] = useState({});

  useEffect(() => {
    fetchWithAuth("/registrations/all")
      .then((data) => {
        setRegistrations(data);
        // By default, expand all classes when the data loads
        const initialExpanded = {};
        Object.keys(data).forEach(className => initialExpanded[className] = true);
        setExpandedClasses(initialExpanded);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const toggleClassExpansion = (className) => {
    setExpandedClasses(prev => ({
      ...prev,
      [className]: !prev[className]
    }));
  };

  const exportClassPDF = (classId) => {
    const allArea = document.querySelectorAll('.printable-class');
    allArea.forEach(el => el.classList.add('no-print-specific'));
    
    const target = document.getElementById(`class-section-${classId}`);
    target.classList.remove('no-print-specific');
    target.classList.add('force-print');

    window.print();

    // Cleanup after print dialog closes
    allArea.forEach(el => {
      el.classList.remove('no-print-specific');
      el.classList.remove('force-print');
    });
  };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", color: "#4f46e5", fontWeight: "bold", fontSize: "1.2rem" }}>
      Loading Dashboard Data...
    </div>
  );

  // --- Filter Logic (Now filters by dropdown AND Class Search) ---
  const classesToDisplay = Object.entries(registrations).filter(([className]) => {
    const matchesDropdown = selectedClass === "All" || className === selectedClass;
    const matchesClassSearch = className.toLowerCase().includes(classSearchTerm.toLowerCase());
    return matchesDropdown && matchesClassSearch;
  });

  return (
    <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto", fontFamily: "'Inter', sans-serif" }}>
      
      {/* PROFESSIONAL PRINT CSS OVERHAUL */}
      <style>
        {`
          @media print {
            body * { visibility: hidden; height: 0; margin: 0; padding: 0; }
            .force-print, .force-print * { visibility: visible !important; height: auto !important; margin: auto !important; }
            .force-print { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
            .no-print { display: none !important; }
            
            /* Print Formatting for Table */
            .print-table-wrapper { display: block !important; } /* Force open if collapsed */
            table { width: 100%; border-collapse: collapse !important; margin-top: 20px; }
            th, td { border: 1px solid #94a3b8 !important; padding: 12px !important; text-align: left; }
            th { background-color: #f1f5f9 !important; -webkit-print-color-adjust: exact; color: #000 !important; font-weight: bold; }
            
            /* Header adjustments for print */
            .print-header-title { font-size: 24px !important; margin-bottom: 5px !important; color: #000 !important; }
            .print-header-subtitle { color: #475569 !important; font-size: 14px !important; margin-bottom: 20px !important; }
          }
        `}
      </style>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "30px" }} className="no-print">
        <div>
          <h2 style={{ color: "#1e293b", margin: 0, display: "flex", alignItems: "center", gap: "12px", fontSize: "2rem" }}>
            <GraduationCap size={36} color="#4f46e5" /> Registration Dashboard
          </h2>
        </div>
      </div>

      {Object.keys(registrations).length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px", background: "white", borderRadius: "16px", border: "1px dashed #cbd5e1", color: "#64748b", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
          <FileText size={48} color="#cbd5e1" style={{ marginBottom: "15px" }} />
          <h3 style={{ color: "#334155", marginBottom: "8px" }}>No Registrations Found</h3>
          <p>When students register for events, their details will appear here.</p>
        </div>
      ) : (
        <>
          {/* CONTROL PANEL */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "15px", background: "white", padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", marginBottom: "30px" }} className="no-print">
            
            {/* Class Dropdown */}
            <div style={{ flex: "1 1 200px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569", display: "flex", alignItems: "center", gap: "6px" }}><Filter size={14} /> Dropdown Filter</label>
              <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", color: "#1e293b", fontWeight: "600", outline: "none", cursor: "pointer" }}>
                <option value="All">Show All Classes</option>
                {Object.keys(registrations).map(className => (
                  <option key={className} value={className}>{className}</option>
                ))}
              </select>
            </div>

            {/* NEW: Class Search Bar */}
            <div style={{ flex: "1 1 250px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569", display: "flex", alignItems: "center", gap: "6px" }}><Search size={14} /> Search Classes</label>
              <div style={{ position: "relative" }}>
                <Search size={16} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "12px" }} />
                <input type="text" placeholder="Type a class name..." value={classSearchTerm} onChange={(e) => setClassSearchTerm(e.target.value)} style={{ width: "100%", padding: "10px 14px 10px 36px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontSize: "14px", boxSizing: "border-box" }} />
              </div>
            </div>

            {/* Student Search Bar */}
            <div style={{ flex: "1 1 250px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569", display: "flex", alignItems: "center", gap: "6px" }}><Users size={14} /> Search Students</label>
              <div style={{ position: "relative" }}>
                <Search size={16} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "12px" }} />
                <input type="text" placeholder="Student name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: "100%", padding: "10px 14px 10px 36px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontSize: "14px", boxSizing: "border-box" }} />
              </div>
            </div>
          </div>

          {/* DATA TABLES */}
          <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
            {classesToDisplay.map(([className, students], index) => {
              
              const filteredStudents = students.filter(s => 
                s.student.toLowerCase().includes(searchTerm.toLowerCase()) || 
                s.email.toLowerCase().includes(searchTerm.toLowerCase())
              );

              if (filteredStudents.length === 0) return null;

              // SMART DETECT for Online/Offline using the first student in the array
              const sampleStudent = students[0];
              const isOnline = sampleStudent?.class_type === 'online' || (sampleStudent?.venue && sampleStudent?.venue.includes('http'));
              
              const isExpanded = expandedClasses[className];

              return (
                <div key={className} id={`class-section-${index}`} className="printable-class" style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)", overflow: "hidden" }}>
                  
                  {/* ACCORDION HEADER */}
                  <div style={{ padding: "16px 24px", borderBottom: isExpanded ? "1px solid #e2e8f0" : "none", background: "#f8fafc", transition: "all 0.2s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px" }}>
                      
                      {/* Clickable Title Area */}
                      <div 
                        onClick={() => toggleClassExpansion(className)} 
                        style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "15px", flex: 1 }}
                        className="no-print"
                      >
                        <div style={{ background: "#e2e8f0", padding: "6px", borderRadius: "8px", color: "#475569" }}>
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                        <div>
                          <h3 style={{ margin: "0 0 6px 0", fontSize: "1.2rem", color: "#1e293b" }}>{className}</h3>
                          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", background: isOnline ? "#eef2ff" : "#f1f5f9", color: isOnline ? "#4f46e5" : "#475569" }}>
                              {isOnline ? <><Monitor size={12} style={{ marginRight: "4px" }}/> Online</> : <><MapPin size={12} style={{ marginRight: "4px" }}/> Offline</>}
                            </span>
                            <span style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", background: "#e2e8f0", color: "#334155" }}>
                              <Users size={12} style={{ marginRight: "4px" }}/> {filteredStudents.length} Registered
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Print Only Header (Hidden normally, shown in PDF) */}
                      <div style={{ display: "none" }} className="print-header-title">
                        <h2 style={{ margin: 0 }}>Attendance Report</h2>
                        <p style={{ margin: "5px 0 0 0", color: "#475569" }}>Class: {className} | Total Students: {filteredStudents.length}</p>
                      </div>
                      
                      {/* Print Button */}
                      <button 
                        onClick={(e) => { e.stopPropagation(); exportClassPDF(index); }}
                        className="no-print"
                        style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", background: "white", color: "#1e293b", border: "1px solid #cbd5e1", borderRadius: "8px", cursor: "pointer", fontWeight: "600", transition: "0.2s", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                        onMouseOver={(e) => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.borderColor = "#94a3b8"; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = "white"; e.currentTarget.style.borderColor = "#cbd5e1"; }}
                      >
                        <Printer size={16} /> Print
                      </button>
                    </div>
                  </div>

                  {/* TABLE CONTENT (Collapsible) */}
                  <div className="print-table-wrapper" style={{ display: isExpanded ? "block" : "none" }}>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ textAlign: "left", borderBottom: "2px solid #e2e8f0" }}>
                            <th style={{ padding: "16px 24px", color: "#64748b", fontWeight: "600", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Student Name</th>
                            <th style={{ padding: "16px 24px", color: "#64748b", fontWeight: "600", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Email Address</th>
                            <th style={{ padding: "16px 24px", color: "#64748b", fontWeight: "600", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Submission Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudents.map((s) => (
                            <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.2s" }} onMouseOver={(e) => e.currentTarget.style.background = "#f8fafc"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                              <td style={{ padding: "16px 24px", fontWeight: "500", color: "#1e293b" }}>{s.student}</td>
                              <td style={{ padding: "16px 24px", color: "#64748b", fontSize: "14px" }}>{s.email}</td>
                              <td style={{ padding: "16px 24px" }}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", background: s.status === "Uploaded" ? "#ecfdf5" : s.status === "Not Uploaded" ? "#fef2f2" : "#f1f5f9", color: s.status === "Uploaded" ? "#059669" : s.status === "Not Uploaded" ? "#dc2626" : "#64748b" }}>
                                  {s.status === "Uploaded" && <CheckCircle size={14} />}
                                  {s.status === "Not Uploaded" && <XCircle size={14} />}
                                  {s.status === "N/A" && <MinusCircle size={14} />}
                                  {s.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminRegistrations;