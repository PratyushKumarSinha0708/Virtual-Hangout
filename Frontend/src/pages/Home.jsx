import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import "./LandingPage.css"
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import RestoreIcon from '@mui/icons-material/Restore';
import { AuthContext } from '../contents/AuthContext';
import WithAuth from '../utils/WithAuth';

function Home() {

  let { addToUserHistory } = useContext(AuthContext);

  let navigate = useNavigate();

  const [meeting_Code, setMeeting_Code] = useState('');

  let handleJoinVideoCall = async () => {
    await addToUserHistory(meeting_Code);
    navigate(`/${meeting_Code}`)
  }

  return (
    <div className='landingPage'>
      <div className="navbar">
        <div className="navbar-title"><h2>Virtual Hangout</h2></div>
        <div className="navbar-list">
          <IconButton onClick={()=>{navigate("/history")}}>
            <RestoreIcon></RestoreIcon>
            <p>History</p>
          </IconButton>

          <Button onClick={() => {
            localStorage.removeItem("token")
            navigate("/auth")
          }}>Logout</Button>
        </div>
      </div>

      <div className="mainContainer">
        <div className="tagline">
          <span><h1 style={{ color: "#1e9037ff" }}>Hangout Virtually!!</h1></span><p>Enter meeting room code to enter the room</p>

          <TextField id="outlined-basic" label="Room Code" value={meeting_Code} variant="outlined" onChange={(e) => { setMeeting_Code(e.currentTarget.value) }} style={{backgroundColor: "beige", borderRadius: " 5px"}}/>

          <Button variant="contained" onClick={handleJoinVideoCall}>Join Room</Button>

        </div>
        <div className="illustration">
          <img src="/artwork.png" alt="" />
        </div>
      </div>

    </div >
  )
}

export default WithAuth(Home)
