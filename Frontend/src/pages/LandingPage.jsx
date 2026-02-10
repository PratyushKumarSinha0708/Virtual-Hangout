import React from 'react'
import "./LandingPage.css"
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'
import MenuIcon from '@mui/icons-material/Menu';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Box,
  useMediaQuery
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

export default function LandingPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };


  return (
    <div className='landingPage'>
      {!isMobile && (
        <nav className="navbar">
          <div className="navbar-title"><h2>Virtual Hangout</h2></div>
          <div className="navbar-list">
            <Button variant="text" onClick={() => { navigate("/guestRoom") }}>Join as a guest</Button>
            <Button onClick={() => { navigate("/auth") }}>Sign Up</Button>
            <Button onClick={() => { navigate("/auth") }}>Sign In</Button>
          </div>
        </nav>
      )}
      {isMobile && (
        <nav className='navbar'>
          <div className='navbar-title'><h5>Virtual Hangout</h5></div>
          <div className="navbar-menu-icon">
            <div>
              <Button
                id="demo-positioned-button"
                aria-controls={open ? 'demo-positioned-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
              >
                <MenuIcon className='hamburger-icon'></MenuIcon>
              </Button>
              <Menu
                id="demo-positioned-menu"
                aria-labelledby="demo-positioned-button"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
                PaperProps={{
                  sx: {
                    height: 'auto',
                  }
                }}
              >
                <MenuItem onClick={() => { navigate("/guestRoom") }}>Join as a guest</MenuItem>
                <MenuItem onClick={() => { navigate("/auth") }}>Sign Up</MenuItem>
                <MenuItem onClick={() => { navigate("/auth") }}>Sign In</MenuItem>
              </Menu>
            </div>
          </div>
        </nav>
      )}
      <div className="mainContainer">
        <div className="tagline">
          <span>{!isMobile && (<h1 style={{ color: "#1e9037ff" }}>Hangout Virtually!!</h1>)}
          {isMobile && (<h3 style={{ color: "#1e9037ff" }}>Hangout Virtually!!</h3>)}
          </span><p>with your loved ones</p>
          <div className="get-started" role='button'><Link to={"/auth"} className='link'>Get Started
          </Link></div>
        </div>
        {!isMobile && (
          <div className="illustration">
            <img src="/artwork.png" alt="" height={"auto"} width={"700px"} />
          </div>
        )}
      </div>
    </div>
  )
}
