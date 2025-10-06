import React, { useEffect, useRef, useState } from 'react';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import IconButton from '@mui/material/IconButton';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ChatIcon from '@mui/icons-material/Chat';
import TextField from '@mui/material/TextField';
import Badge from '@mui/material/Badge';
import CallEndIcon from '@mui/icons-material/CallEnd';
import Button from '@mui/material/Button'
import io from 'socket.io-client'
import './VideoMeet.css'
import { useNavigate } from 'react-router-dom';

const server_url = "http://localhost:8080";

const connections = {};

const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
}



function VideoMeet() {

    var socketRef = useRef();
    let socketIdRef = useRef();

    let localVideoRef = useRef();

    let [videoAvailable, setVideoAvailable] = useState(true);
    let [audioAvailable, setAudioAvailable] = useState(true);

    let [video, setVideo] = useState([]);
    let [audio, setAudio] = useState();

    let [screen, setScreen] = useState();

    let [showModal, setShowModal] = useState();

    let [screenAvailable, setScreenAvailable] = useState();

    let [messages, setMessages] = useState([]);


    let [message, setMessage] = useState();

    let [newMessages, setNewMessages] = useState(0);

    let [askForUsername, setAskForUsername] = useState(true);

    let [username, setUsername] = useState("");

    const videoRef = useRef([]);

    let [videos, setVideos] = useState([]);

    let routeTo = useNavigate();

    // if (isChrome() === false) {

    // }

    const getPermissions = async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });

            if (videoPermission) {
                setVideoAvailable(true);
            } else {
                setVideoAvailable(false);
            }

            if (audioPermission) {
                setAudioAvailable(true);
            } else {
                setAudioAvailable(false);
            }

            if (navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            } else {
                setScreenAvailable(false);
            }

            if (videoAvailable || audioAvailable) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

                if (userMediaStream) {
                    window.localStream = userMediaStream;
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = userMediaStream;
                    }
                }

            }




        } catch (error) {
            console.log(error);
        }
    }


    const getUserMediaSuccess = (stream) => {
        try { window.localStream.getTracks().forEach(track => track.stop()) } catch (e) { console.log(e) }
        window.localStream = stream;
        localVideoRef.current.srcObject = stream;

        for (let id in connections) {
            if (id === socketIdRef.current) continue;
            connections[id].addStream(window.localStream);
            connections[id].createOffer().then(description => {
                connections[id].setLocalDescription(description).then(() => {
                    socketRef.current.emit('signal', id, JSON.stringify({ sdp: connections[id].localDescription }))
                }).catch(e => console.log(e))
            }).catch(e => console.log(e))
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setVideo(false)
            setAudio(false)

            try {
                let tracks = localVideoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop())
            } catch (error) {
                console.log(error)
            }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            localVideoRef.current.srcObject = window.localStream;

            for (let id in connections) {
                connections[id].addStream(window.localStream)
                connections[id].createOffer()
                    .then((description) => {
                        connections[id].setLocalDescription(description)
                            .then(() => {
                                socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                            }).catch((error) => { console.log(error) })
                    }).catch((error) => { console.log(error) })
            }

        })

    }


    const gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message)

        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp))
                    .then(() => {

                        if (signal.sdp.type === 'offer') {

                            connections[fromId].createAnswer()
                                .then((description) => {
                                    connections[fromId].setLocalDescription(description)
                                        .then(() => {
                                            socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }))
                                        }).catch((error) => { console.log(error) })
                                }).catch((error) => { console.log(error) })


                        }

                    }).catch((error) => { console.log(error) })
            }

            if (signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch((error) => { console.log(error) })
            }

        }
    }


    const addMessage = (data , sender , socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages, {sender: sender, data: data}
        ]);

        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prevNewMessages) => prevNewMessages +1 )
        }
    }


    const connectToSocketServer = () => {

        socketRef.current = io.connect(server_url, { secure: false });

        socketRef.current.on('signal', gotMessageFromServer);

        socketRef.current.on('connect', () => {

            socketRef.current.emit('join-call', window.location.href);

            socketIdRef.current = socketRef.current.id;

            socketRef.current.on('chat-message', addMessage)

            socketRef.current.on('user-left', (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id))
            })

            socketRef.current.on('user-joined', (id, clients) => {
                console.log('user-joined:', id, clients);
                clients.forEach((socketListId) => {

                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections)

                    connections[socketListId].onicecandidate = (event) => {
                        if (event.candidate !== null) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
                        }
                    }

                    connections[socketListId].onaddstream = (event) => {

                        let videoExists = videoRef.current.find(video => video.socketId === socketListId);

                        console.log(socketListId)

                        if (videoExists) {
                            setVideos(videos => {
                                const updatedVideos = videos.map(video => video.socketId === socketListId ? { ...video, stream: event.stream } : video)
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            })
                        } else {

                            let newVideo = {
                                socketId: socketListId,
                                stream: event.stream,
                                autoPlay: true,
                                playsinline: true,
                            }

                            console.log(newVideo.socketId)
                            console.log(socketListId)


                            setVideos(videos => {
                                const updatedVideos = [...videos, newVideo];
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            })

                        }
                    }

                    if (window.localStream !== undefined && window.localStream !== null) {
                        connections[socketListId].addStream(window.localStream);
                    } else {

                        let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
                        window.localStream = blackSilence();
                        connections[socketListId].addStream(window.localStream);
                    }

                })

                if (id === socketIdRef.current) {

                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue

                        try {
                            connections[id2].addStream(window.localStream)
                        } catch (error) {

                        }

                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }))
                                })
                        })

                    }

                }

            })

        })

    }


    let silence = () => {
        let ctx = new AudioContext()
        let oscillator = ctx.createOscillator()

        let dst = oscillator.connect(ctx.createMediaStreamDestination());

        oscillator.start();
        ctx.resume()
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
    }

    let black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement('canvas'), { width, height });

        canvas.getContext('2d').fillRect(0, 0, width, height);
        let stream = canvas.captureStream();
        return Object.assign(stream.getVideoTracks()[0], { enabled: false })

    }

    const getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ audio: audio, video: video })
                .then(getUserMediaSuccess) //todo getUserMediaSuccess
                .then((stream) => { })
                .catch((error) => { console.log(error) })
        } else {
            try {
                let tracks = localVideoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop())
            } catch (error) {
                console.log(error);
            }
        }
    }

    let getDisplayMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach((track) => track.stop())
        } catch (error) {
            console.log(error)
        }

        window.localStream = stream;
        localVideoRef.current.srcObject = stream;

        for (let id in connections) {
            if (id === socketIdRef.current) continue;

            connections[id].addStream(window.localStream)
            connections[id].createOffer()
                .then((description) => [
                    connections[id].setLocalDescription(description)
                        .then(() => {
                            socketRef.current.emit('signal', id, JSON.stringify({ "sdp": connections[id].localDescription }))

                        }).catch((error) => console.log(error))
                ]).catch((error) => console.log(error))
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false)

            try {
                let tracks = localVideoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop())
            } catch (error) {
                console.log(error)
            }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            localVideoRef.current.srcObject = window.localStream;

            getUserMedia();

        })
    }

    let getDisplayMedia = () => {
        if (screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDisplayMediaSuccess)
                    .then((stream) => { })
                    .catch((error) => console.log(error))
            }
        }
    }

    useEffect(() => {
        getPermissions();
    },)

    useEffect(() => {
        if (video !== undefined && audio !== undefined) {
            getUserMedia();
        }
    }, [audio, video])

    useEffect(() => {
        if (screen !== undefined) {
            getDisplayMedia();
        }
    }, [screen])

    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();
    }

    // useEffect(() => {
    //     console.log("videos updated:", videos);
    // }, [videos]);

    let connect = async () => {
        setAskForUsername(false);
        await getPermissions();
        getMedia();
    }

    let handleVideo = () => {
        setVideo(!video);
    }

    let handleAudio = () => {
        setAudio(!audio);
    }

    let handleScreen = () => {
        setScreen(!screen);
    }

    let handleChat = () => {
        setShowModal(!showModal);
        {!showModal && setNewMessages(0)}
    }

    let sendMessage = () => {
        socketRef.current.emit('chat-message', message, username);
        setMessage("");
    }

    let handleEndCall = () => {
    // Stop local tracks
    try {
        if (localVideoRef.current?.srcObject) {
            localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
    } catch (error) {
        console.log(error);
    }

    // Close all peer connections
    for (let id in connections) {
        try {
            connections[id].getSenders().forEach(sender => sender.track?.stop());
            connections[id].close();
        } catch (err) {
            console.warn("Error closing connection for", id, err);
        }
        delete connections[id];
    }

    // Disconnect socket
    if (socketRef.current) {
        socketRef.current.disconnect();
    }

    // Reset state
    setVideos([]);
    videoRef.current = [];

    // Navigate away
    routeTo("/home");
};


    return (
        <div>
            {askForUsername === true ?
                <div>

                    <h2>Enter into lobby</h2>

                    <TextField id="outlined-basic" label="username" value={username} variant="outlined" onChange={(e) => { setUsername(e.currentTarget.value) }} />

                    <Button variant="contained" onClick={connect}>Connect</Button>

                    <div>
                        <video
                            ref={localVideoRef}
                            autoPlay
                            muted
                        />
                    </div>

                </div>
                :
                <div className='meetVideoContainer'>

                    {showModal ?
                        <div className="chatRoom">
                            <div className="chatContainer">
                                <h1>Chat</h1>

                        <div className="chattingDisplay">
                            {messages.length > 0 ? messages.map((item, index) => {
                                return (
                                    <div style={{marginBottom: "1rem"}} key={index}>
                                        <p style={{fontWeight: "bold"}}>{item.sender}</p>
                                        <p>{item.data}</p>
                                    </div>
                                )
                            }): <p>No messages available</p>}
                        </div>

                                <div className="chattingArea">
                                    <TextField id="outlined-basic" label="Enter your chat" value={message} variant="outlined" onChange={(e) => { setMessage(e.currentTarget.value) }} />
                                    <Button variant="contained" onClick={sendMessage} >Send</Button>
                                </div>

                            </div>
                        </div>
                        : <></>}


                    <div className="buttonContainer">

                        <IconButton style={{ color: "white" }} onClick={handleVideo}>
                            {(video === true) ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>

                        <IconButton style={{ color: "white" }} onClick={handleAudio}>
                            {(audio === true) ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>

                        {screenAvailable === true ? <IconButton onClick={handleScreen} style={{ color: "white" }}>
                            {(screen === true) ? <ScreenShareIcon /> : <StopScreenShareIcon />}
                        </IconButton> : <></>}

                        <IconButton style={{ color: "red" }} onClick={handleEndCall}>
                            <CallEndIcon />
                        </IconButton>

                        <Badge badgeContent={newMessages} max={999} color='secondary'>
                            <IconButton style={{ color: "white" }} onClick={handleChat}>
                                <ChatIcon />
                            </IconButton>
                        </Badge>

                    </div>

                    <video ref={localVideoRef} autoPlay muted className='meetUserVideo' />
                    <div className='conferenceView'>
                        {videos.map((video) => (
                            <div key={video.socketId} >
                                <video className='videoStream'
                                    ref={ref => {
                                        if (ref && video.stream) {
                                            ref.srcObject = video.stream;
                                        }
                                    }}
                                    autoPlay
                                />

                            </div>
                        ))}
                    </div>
                </div>}
        </div>
    )
}

export default VideoMeet
