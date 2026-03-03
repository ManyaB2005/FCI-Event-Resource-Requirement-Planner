import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Shield } from 'lucide-react';
import './Auth.css';

const Auth = ({ setToken, setUser }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '', 
    role: 'student' 
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    // Explicit API definition to avoid relative path errors in React mapping
    const endpoint = isLogin ? 'http://localhost:5000/api/auth/login' : 'http://localhost:5000/api/auth/register';
    
    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: isLogin ? formData.role : 'student' 
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // 1. Validate response before processing payload
      const contentType = response.headers.get("content-type");
      
      let data = {};
      
      if (contentType && contentType.includes("application/json")) {
         data = await response.json(); // Safe to parse JSON
      } else {
         const textError = await response.text();
         console.error("Non-JSON Server Response:", textError);
         
         if (response.status === 404) {
           throw new Error(`The URL ${endpoint} does not exist on the server (404 Error). Check Backend Router.`);
         } else {
           throw new Error(`Server returned an invalid format. Status: ${response.status}`);
         }
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || "Authentication failed");
      }

      if (isLogin) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
      } else {
        setSuccess("Account created successfully! You can now log in.");
        setIsLogin(true); 
        setFormData({ ...formData, password: '', confirmPassword: '' });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    setFormData({ ...formData, password: '', confirmPassword: '' });
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        
        <div className="auth-header">
          <div className="auth-icon-container">
            <Shield size={36} className="auth-brand-icon" />
          </div>
          <h2>{isLogin ? 'Login' : 'Student Registration'}</h2>
          <p>{isLogin ? 'Authenticate to access your workspace' : 'Create an account to join events'}</p>
        </div>

        {error && <div className="auth-alert alert-error">{error}</div>}
        {success && <div className="auth-alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          
          {!isLogin && (
            <div className="input-group">
              <label>Full Name</label>
              <div className="input-wrapper">
                <User className="input-icon" size={18} />
                <input 
                  type="text" 
                  name="name" 
                  placeholder="e.g. Jane Doe" 
                  value={formData.name} 
                  onChange={handleChange} 
                  required={!isLogin} 
                />
              </div>
            </div>
          )}

          <div className="input-group">
            <label>Email Address</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} />
              <input 
                type="email" 
                name="email" 
                placeholder="you@example.com" 
                value={formData.email} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input 
                type={showPassword ? "text" : "password"} 
                name="password" 
                placeholder="••••••••" 
                value={formData.password} 
                onChange={handleChange} 
                required 
              />
              <button 
                type="button" 
                className="eye-btn" 
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="input-group">
              <label>Confirm Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  name="confirmPassword" 
                  placeholder="••••••••" 
                  value={formData.confirmPassword} 
                  onChange={handleChange} 
                  required={!isLogin} 
                />
                <button 
                  type="button" 
                  className="eye-btn" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex="-1"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {isLogin && (
             <div className="input-group" style={{ marginTop: '5px' }}>
             <label>Access Level</label>
             <div className="role-selector">
               <label className={`role-card ${formData.role === 'student' ? 'active' : ''}`}>
                 <input type="radio" name="role" value="student" checked={formData.role === 'student'} onChange={handleChange} />
                 Student
               </label>
               <label className={`role-card ${formData.role === 'admin' ? 'active' : ''}`}>
                 <input type="radio" name="role" value="admin" checked={formData.role === 'admin'} onChange={handleChange} />
                 Admin
               </label>
             </div>
           </div>
          )}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Register Account')}
          </button>
        </form>

        <div className="auth-footer">
          {isLogin ? "New to the platform? " : "Already registered? "}
          <button type="button" onClick={toggleMode} className="auth-toggle-link">
            {isLogin ? 'Create an account' : 'Sign in here'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Auth;