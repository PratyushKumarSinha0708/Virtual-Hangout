import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import "./LandingPage.css"
import TextField from '@mui/material/TextField'
import RestoreIcon from '@mui/icons-material/Restore';
import { AuthContext } from '../contents/AuthContext';
import WithAuth from '../utils/WithAuth';
import MenuIcon from '@mui/icons-material/Menu';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import {
  Button,
  IconButton,
  useMediaQuery
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

function Home() {

  let { addToUserHistory } = useContext(AuthContext);

  let navigate = useNavigate();

  const [meeting_Code, setMeeting_Code] = useState('');

  let handleJoinVideoCall = async () => {
    await addToUserHistory(meeting_Code);
    navigate(`/${meeting_Code}`)
  }

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
      {!isMobile ? (<div className="navbar">
        <div className="navbar-title"><h2>Virtual Hangout</h2></div>
        <div className="navbar-list">
          <IconButton onClick={() => { navigate("/history") }} sx={{ fontSize: "18px" }}>
            <RestoreIcon></RestoreIcon>
            <p > History</p>
          </IconButton>

          <Button onClick={() => {
            localStorage.removeItem("token")
            navigate("/auth")
          }}>Logout</Button>
        </div>
      </div>)
        :
        (<div className="navbar">
          <div className="navbar-title"><h5>Virtual Hangout</h5></div>
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
              <MenuItem onClick={() => { navigate("/history") }}>History</MenuItem>
              <MenuItem onClick={() => {
                localStorage.removeItem("token")
                navigate("/auth")
              }}>Logout</MenuItem>
            </Menu>
          </div>
        </div>)}

      <div className="mainContainer">
        <div className="tagline">
          <span>
            {isMobile ? <h3 style={{ color: "#1e9037ff" }}>Hangout Virtually!!</h3> : <h1 style={{ color: "#1e9037ff" }}>Hangout Virtually!!</h1>}
          </span><p>Enter meeting room code to enter the room</p>

          <TextField id="outlined-basic" label="Room Code" value={meeting_Code} variant="outlined" onChange={(e) => { setMeeting_Code(e.currentTarget.value) }} style={{ backgroundColor: "beige", borderRadius: " 5px" }} />

          <Button variant="contained" onClick={handleJoinVideoCall}>Join Room</Button>

        </div>
        {!isMobile && (
          <div className="illustration">
            <img src="/artwork.png" alt="" height={"auto"} width={"700px"} />
          </div>
        )}
      </div>

    </div >
  )
}

export default WithAuth(Home)
