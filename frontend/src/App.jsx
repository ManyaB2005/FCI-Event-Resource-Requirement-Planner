import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Auth from "./components/Auth";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import StudentView from "./components/StudentView";
import EventManagement from "./components/EventManagement"; 
import ResourceRequirements from "./components/ResourceRequirements";
import AdminRegistrations from "./components/AdminRegistrations"; // <-- Ensure this file exists in /components

import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    
    if (storedUser && storedUser !== "undefined" && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (err) {
        console.error("Auth initialization failed", err);
        localStorage.clear();
      }
    }
    setInitializing(false);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
    setUser(null);
  };

  if (initializing) return <div className="loading-init">Initializing Workspace...</div>;

  if (!user) {
    return <Auth setToken={setToken} setUser={setUser} />;
  }

  return (
    <Router>
      <div className="app-container">
        <Sidebar
          isOpen={sidebarOpen}
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          user={user}
          onLogout={handleLogout}
        />

        <main className={`main-viewport ${sidebarOpen ? "sidebar-expanded" : "sidebar-collapsed"}`}>
          <div className="content-wrapper">
            <Routes>
              {/* Common Route */}
              <Route path="/" element={<Dashboard user={user} />} />

              {/* Admin Access Only - Consolidated */}
              {user.role === "admin" && (
                <>
                  <Route path="/events" element={<EventManagement user={user} />} />
                  <Route path="/registrations" element={<AdminRegistrations />} />
                  <Route path="/resources" element={<ResourceRequirements />} /> 
                </>
              )}

              {/* Student Access Only */}
              {user.role === "student" && (
                <Route path="/events" element={<StudentView user={user} />} />
              )}

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;