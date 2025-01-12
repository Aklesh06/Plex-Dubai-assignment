import { useState } from "react";
import { useLocation } from "react-router-dom";
import './nav.css';

function Nav({userInfo}) {

    const location = useLocation([]);

    const getPageName = () => {
        switch (location.pathname) {
          case '/dashboard':
            return 'DashBoard';
          case '/campaign':
            return 'Campaign';
          case '/invoice':
            return 'Invoice';
          default:
            return 'Dashboard';
        }
    };
  return (
    <div className="navbar-container">
      <h1 className="navbar-title">{getPageName()}</h1>
      <h2 className="navbar-welcome">Welcome {userInfo.first_name}</h2>
      <ul className="navbar-menu">
        <a href="/dashboard" className="navbar-link">
          <div className="navbar-item-container">
            <li className="navbar-item">DashBoard</li>
          </div>
        </a>
        
        <a href="/campaign" className="navbar-link">
          <div className="navbar-item-container">
            <li className="navbar-item">Campaign</li>
          </div>
        </a>
        <a href="/invoice" className="navbar-link">
          <div className="navbar-item-container">
            <li className="navbar-item">Invoice</li>
          </div>
        </a>
      </ul>
    </div>
  )
}

export default Nav
