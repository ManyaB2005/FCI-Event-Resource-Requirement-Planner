import React, { useState, useEffect } from "react";
import { fetchWithAuth } from "../api";
import { CheckCircle, XCircle, MinusCircle, Printer, Users, GraduationCap } from "lucide-react";

const AdminRegistrations = () => {
  const [registrations, setRegistrations] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithAuth("/registrations/all")
      .then((data) => setRegistrations(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const exportClassPDF = (classId) => {
    // 1. Give the specific class a unique class name for the Print CSS
    const allArea = document.querySelectorAll('.printable-class');
    allArea.forEach(el => el.classList.add('no-print-specific'));
    
    const target = document.getElementById(`class-section-${classId}`);
    target.classList.remove('no-print-specific');
    target.classList.add('force-print');

    // 2. Trigger Print
    window.print();

    // 3. Cleanup after printing
    allArea.forEach(el => {
      el.classList.remove('no-print-specific');
      el.classList.remove('force-print');
    });
  };

  if (loading) return <div style={{ padding: "50px", textAlign: "center" }}>Loading Registrations...</div>;

  return (
    <div style={{ padding: "30px" }}>
      {/* 1. Enhanced Print CSS */}
      <style>
        {`
          @media print {
            /* Hide everything by default */
            body * { visibility: hidden; height: 0; margin: 0; padding: 0; }
            
            /* Show ONLY the forced section */
            .force-print, .force-print * { 
              visibility: visible !important; 
              height: auto !important; 
              margin: auto !important;
            }
            
            .force-print { 
              position: absolute; 
              left: 0; 
              top: 0; 
              width: 100%; 
              padding: 20px;
            }

            .no-print { display: none !important; }
            
            /* Ensure colors and borders print */
            tr { border-bottom: 1px solid #eee !important; -webkit-print-color-adjust: exact; }
            th { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; }
          }
        `}
      </style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }} className="no-print">
        <h2 style={{ color: "#1e293b", display: "flex", alignItems: "center", gap: "12px" }}>
          <GraduationCap size={32} color="#4f46e5" /> Registration Records
        </h2>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0, fontWeight: "bold", color: "#475569" }}>Admin Control Panel</p>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#94a3b8" }}>{new Date().toDateString()}</p>
        </div>
      </div>

      {Object.entries(registrations).map(([className, students], index) => (
        <div 
          key={className} 
          id={`class-section-${index}`}
          className="printable-class"
          style={{ 
            marginBottom: "40px", 
            border: "1px solid #e2e8f0", 
            borderRadius: "16px", 
            background: "#fff", 
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" 
          }}
        >
          {/* Header for PDF only */}
          <div style={{ padding: "30px", borderBottom: "2px solid #4f46e5" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h3 style={{ margin: "0 0 5px 0", fontSize: "1.5rem", color: "#1e293b" }}>{className}</h3>
                <p style={{ margin: 0, color: "#64748b" }}>Registered Students List</p>
              </div>
              
              <button 
                onClick={() => exportClassPDF(index)}
                className="no-print"
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "8px", 
                  padding: "10px 18px", 
                  background: "#4f46e5", 
                  color: "white", 
                  border: "none", 
                  borderRadius: "8px", 
                  cursor: "pointer",
                  fontWeight: "bold",
                  boxShadow: "0 4px 6px -1px rgba(79, 70, 229, 0.4)"
                }}
              >
                <Printer size={18} /> Export Class PDF
              </button>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", background: "#f8fafc" }}>
                  <th style={{ padding: "15px 25px", borderBottom: "1px solid #e2e8f0", color: "#475569", width: "40%" }}>Student Name</th>
                  <th style={{ padding: "15px 25px", borderBottom: "1px solid #e2e8f0", color: "#475569", width: "40%" }}>Email</th>
                  <th style={{ padding: "15px 25px", borderBottom: "1px solid #e2e8f0", color: "#475569", width: "20%" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, idx) => (
                  <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "15px 25px", fontWeight: "500", color: "#1e293b" }}>{s.student}</td>
                    <td style={{ padding: "15px 25px", color: "#64748b" }}>{s.email}</td>
                    <td style={{ padding: "15px 25px" }}>
                      <span style={{ 
                        display: "inline-flex", 
                        alignItems: "center", 
                        gap: "6px", 
                        padding: "4px 10px",
                        borderRadius: "20px",
                        fontSize: "0.85rem",
                        fontWeight: "600",
                        background: s.status === "Uploaded" ? "#ecfdf5" : s.status === "Not Uploaded" ? "#fef2f2" : "#f1f5f9",
                        color: s.status === "Uploaded" ? "#059669" : s.status === "Not Uploaded" ? "#dc2626" : "#64748b"
                      }}>
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
          
          {/* Footer for PDF only */}
          <div style={{ padding: "20px 25px", background: "#f8fafc", fontSize: "0.85rem", color: "#94a3b8", textAlign: "right" }}>
            Total Registered: {students.length} | Generated by FCI Planner
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminRegistrations;