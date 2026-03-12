import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileUp, Activity, ScatterChart, Lightbulb } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="glass-panel navbar">
      <div className="navbar-logo">
        <div className="logo-icon"></div>
        <span className="text-gradient">AutoPattern</span>
      </div>
      
      <div className="nav-links">
        <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <FileUp size={20} />
          <span>Upload</span>
        </NavLink>
        
        <NavLink to="/overview" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          <span>Overview</span>
        </NavLink>
        
        <NavLink to="/patterns" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <ScatterChart size={20} />
          <span>Discovery</span>
        </NavLink>
        
        <NavLink to="/anomalies" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Activity size={20} />
          <span>Anomalies</span>
        </NavLink>
        
        <NavLink to="/insights" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Lightbulb size={20} />
          <span>Insights</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default Navbar;
