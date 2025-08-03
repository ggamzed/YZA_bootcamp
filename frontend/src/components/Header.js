import React from 'react';
import { Link } from 'react-router-dom';
import hazerFenLogo from '../img/hazerFen.png';
import './Header.css';

export default function Header() {
  return (
    <div className="top-logo">
      <Link to="/home" className="logo-link">
        <div className="logo-container">
                           <img src="/favicon.png" alt="HezarFen Favicon" className="favicon-icon" />
                 <img src={hazerFenLogo} alt="HezarFen Logo" className="logo-image" />
                 <div className="logo-text">
                   <span className="bold">Hezar</span><span className="cursive">Fen</span>
                 </div>
        </div>
        <div className="logo-slogan">BİLGİYLE KANATLAN!</div>
      </Link>
    </div>
  );
} 