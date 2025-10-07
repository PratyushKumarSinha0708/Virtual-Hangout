import React, { useEffect, useRef, useState } from 'react';
import { IconButton, TextField, Button, Badge } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ChatIcon from '@mui/icons-material/Chat';
import CallEndIcon from '@mui/icons-material/CallEnd';
import io from 'socket.io-client';
import './VideoMeet.css';

const SERVER_URL = "https://virtual-hangout-backend.onrender.com";
const peerConfig = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

export default function VideoMeet() {
    const localVideoRef = useRef(null);
    const videoRefs = useRef({});
    const socketRef = useRef();
    const socketIdRef = useRef();
    const connections = useRef({});

    const [videos, setVideos] = useState([]); // only metadata {socketId}
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [screenEnabled, setScreenEnabled] = useState(false);
    const [screenAvailable, setScreenAvailable] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessages, setNewMessages] = useState(0);
    const [username, setUsername] = useState('');
    const [askUsername, setAskUsername] = useState(true);
    const [showChat, setShowChat] = useState(false);

    // ---------- Permissions ----------
    useEffect(() => {
        const checkPermissions = async () => {
            try {
                await navigator.mediaDevices.getUserMedia({ video: true });
                await navigator.mediaDevices.getUserMedia({ audio: true });
                setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);
            } catch (e) {
                console.log("Permission error:", e);
            }
        };
        checkPermissions();
    }, []);

    // ---------- User Media ----------
    const getUserMedia = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: videoEnabled, audio: audioEnabled });
            window.localStream = stream;
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;

            Object.values(connections.current).forEach(pc => {
                pc.addStream(stream);
                pc.createOffer()
                    .then(desc => pc.setLocalDescription(desc)
                        .then(() => {
                            socketRef.current.emit('signal', pc.id, JSON.stringify({ sdp: pc.localDescription }));
                        })
                    );
            });
        } catch (e) { console.log(e); }
    };

    // ---------- Screen Share ----------
    const startScreenShare = async () => {
        if (!screenEnabled || !navigator.mediaDevices.getDisplayMedia) return;
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            window.localStream.getTracks().forEach(track => track.stop());
            window.localStream = stream;
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;

            Object.values(connections.current).forEach(pc => {
                pc.addStream(stream);
                pc.createOffer()
                    .then(desc => pc.setLocalDescription(desc)
                        .then(() => {
                            socketRef.current.emit('signal', pc.id, JSON.stringify({ sdp: pc.localDescription }));
                        })
                    );
            });

            stream.getTracks().forEach(track => track.onended = () => {
                setScreenEnabled(false);
                getUserMedia(); // restore normal stream
            });
        } catch (e) { console.log(e); }
    };

    useEffect(() => {
        if (screenEnabled) startScreenShare();
    }, [screenEnabled]);

    // ---------- Socket & WebRTC ----------
    const connectSocket = () => {
        socketRef.current = io.connect(SERVER_URL, { secure: false });

        socketRef.current.on('connect', () => {
            socketIdRef.current = socketRef.current.id;
            socketRef.current.emit('join-call', window.location.href);

            socketRef.current.on('signal', handleSignal);
            socketRef.current.on('chat-message', handleIncomingMessage);
            socketRef.current.on('user-left', id => {
                setVideos(v => v.filter(v => v.socketId !== id));
                delete videoRefs.current[id];
            });

            socketRef.current.on('user-joined', (id, clients) => {
                clients.forEach(peerId => {
                    if (connections.current[peerId]) return;
                    const pc = new RTCPeerConnection(peerConfig);
                    connections.current[peerId] = pc;

                    pc.onicecandidate = e => {
                        if (e.candidate) socketRef.current.emit('signal', peerId, JSON.stringify({ ice: e.candidate }));
                    };

                    pc.onaddstream = e => {
                        if (!videoRefs.current[peerId]) videoRefs.current[peerId] = e.stream;
                        setVideos(v => {
                            if (v.find(vv => vv.socketId === peerId)) return v;
                            return [...v, { socketId: peerId }];
                        });
                    };

                    if (window.localStream) pc.addStream(window.localStream);
                    if (peerId !== socketIdRef.current) {
                        pc.createOffer()
                            .then(desc => pc.setLocalDescription(desc)
                                .then(() => {
                                    socketRef.current.emit('signal', peerId, JSON.stringify({ sdp: pc.localDescription }));
                                })
                            );
                    }
                });
            });
        });
    };

    const handleSignal = (fromId, message) => {
        const data = JSON.parse(message);
        const pc = connections.current[fromId];
        if (!pc) return;

        if (data.sdp) {
            pc.setRemoteDescription(new RTCSessionDescription(data.sdp)).then(() => {
                if (data.sdp.type === 'offer') {
                    pc.createAnswer().then(ans => pc.setLocalDescription(ans).then(() => {
                        socketRef.current.emit('signal', fromId, JSON.stringify({ sdp: pc.localDescription }));
                    }));
                }
            });
        }

        if (data.ice) {
            pc.addIceCandidate(new RTCIceCandidate(data.ice)).catch(e => console.log(e));
        }
    };

    // ---------- Chat ----------
    const handleIncomingMessage = (msg, sender, id) => {
        setMessages(prev => [...prev, { data: msg, sender }]);
        if (id !== socketIdRef.current) setNewMessages(n => n + 1);
    };
    const sendMessage = () => {
        socketRef.current.emit('chat-message', message, username);
        setMessage('');
    };

    // ---------- Controls ----------
    const toggleVideo = () => setVideoEnabled(v => !v);
    const toggleAudio = () => setAudioEnabled(a => !a);
    const toggleScreen = () => setScreenEnabled(s => !s);

    const handleEndCall = () => {
        try { window.localStream.getTracks().forEach(t => t.stop()); } catch {}
        Object.values(connections.current).forEach(pc => pc.close());
        socketRef.current?.disconnect();
        setVideos([]);
        videoRefs.current = {};
        window.location.href = "/";
    };

    const connect = async () => {
        setAskUsername(false);
        await getUserMedia();
        connectSocket();
    };

    return (
        <div>
            {askUsername ? (
                <div>
                    <h2>Enter Lobby</h2>
                    <TextField label="Username" value={username} onChange={e => setUsername(e.target.value)} />
                    <Button variant="contained" onClick={connect}>Connect</Button>
                    <video ref={localVideoRef} autoPlay muted style={{ width: '200px' }} />
                </div>
            ) : (
                <div className="meetVideoContainer">
                    {showChat && (
                        <div className="chatRoom">
                            <div className="chatContainer">
                                <h1>Chat</h1>
                                <div className="chattingDisplay">
                                    {messages.length > 0 ? messages.map((m, i) => (
                                        <div key={i}>
                                            <p><b>{m.sender}</b></p>
                                            <p>{m.data}</p>
                                        </div>
                                    )) : <p>No messages yet</p>}
                                </div>
                                <div className="chattingArea">
                                    <TextField value={message} onChange={e => setMessage(e.target.value)} />
                                    <Button onClick={sendMessage}>Send</Button>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="buttonContainer">
                        <IconButton onClick={toggleVideo}>{videoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}</IconButton>
                        <IconButton onClick={toggleAudio}>{audioEnabled ? <MicIcon /> : <MicOffIcon />}</IconButton>
                        {screenAvailable && <IconButton onClick={toggleScreen}>{screenEnabled ? <ScreenShareIcon /> : <StopScreenShareIcon />}</IconButton>}
                        <IconButton onClick={handleEndCall} style={{ color: 'red' }}><CallEndIcon /></IconButton>
                        <Badge badgeContent={newMessages} max={999}>
                            <IconButton onClick={() => { setShowChat(!showChat); setNewMessages(0); }}><ChatIcon /></IconButton>
                        </Badge>
                    </div>
                    <video ref={localVideoRef} autoPlay muted className="meetUserVideo" />
                    <div className="conferenceView">
                        {videos.map(v => (
                            <div key={v.socketId}>
                                <video
                                    ref={ref => { if (ref && videoRefs.current[v.socketId]) ref.srcObject = videoRefs.current[v.socketId]; }}
                                    autoPlay
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
