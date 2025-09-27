import React, { useState } from 'react'
import './Navbar.css'
import { assets } from '../../assets/assets'
import { Link } from 'react-router-dom'

const Navbar = () => {
  const [menu, setMenu] = useState("menu")

  return (
    <div className='navbar'>
      <img src={assets.logo} alt="" className="logo" />
      <ul className="navbar-menu">
        <Link to='/' onClick={()=>setMenu("home")} className={menu === "home" ? "active" : ""}>Home</li>
        <a href='#explore-menu' onClick={()=>setMenu("menu")} className={menu === "menu" ? "active" : ""}>Menu</li>
        <a href='#app-download' onClick={()=>setMenu("mobile-app")} className={menu === "mobile-app" ? "active" : ""}>Mobile-app</li>
        <a href='#footer' onClick={()=>setMenu("contact-us")} className={menu === "contact-us" ? "active" : ""}>Contact us</li>
      </ul>
      <div className="navbar-right">
        <img src={assets.search_icon} alt="" />
        <div className="navbar-search-icon">
          <img src={assets.basket_icon} alt="" />
          <div className="dot"></div>
        </div>
        <button className='navbar-button'>Sign in</button>
      </div>
    </div>
  )
}

export default Navbar
