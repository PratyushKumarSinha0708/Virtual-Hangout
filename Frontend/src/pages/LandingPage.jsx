import React from 'react'
import "./LandingPage.css"
import { Button } from '@mui/material';
import {Link, useNavigate} from 'react-router-dom'

export default function LandingPage() {
const navigate = useNavigate();

  return (
    <div className='landingPage'>
      <nav className="navbar">
        <div className="navbar-title"><h2>Virtual Hangout</h2></div>
        <div className="navbar-list">
            <Button variant="text" onClick={()=>{navigate("/guestRoom")}}>Join as a guest</Button>
            <Button onClick={()=> {navigate("/auth")}}>Sign Up</Button>
            <Button onClick={()=>{navigate("/auth")}}>Sign In</Button>
        </div>
      </nav>
      <div className="mainContainer">
        <div className="tagline">
            <span><h1 style={{color:"#1e9037ff"}}>Hangout Virtually!!</h1></span><p>with your loved ones</p>
            <div className="get-started" role='button'><Link to={"/auth"} className='link'>Get Started
            </Link></div>
        </div>
        <div className="illustration">
            <img src="/artwork.png" alt="" />
        </div>
      </div>
    </div>
  )
}
