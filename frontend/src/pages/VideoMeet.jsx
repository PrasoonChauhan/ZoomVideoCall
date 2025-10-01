// import React, { useEffect, useRef, useState } from "react";
// import TextField from "@mui/material/TextField";
// import Button from "@mui/material/Button";
// import { io } from "socket.io-client";
// import styles from "../styles/VideoComponent.module.css";
// import IconButton from "@mui/material/IconButton";
// import VideocamIcon from "@mui/icons-material/Videocam";
// import VideocamOffIcon from "@mui/icons-material/VideocamOff";
// import CallEndIcon from "@mui/icons-material/CallEnd";
// import MicIcon from "@mui/icons-material/Mic";
// import MicOffIcon from "@mui/icons-material/MicOff";
// import ScreenShareIcon from "@mui/icons-material/ScreenShare";
// import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
// import Badge from "@mui/material/Badge";
// import ChatIcon from "@mui/icons-material/Chat";
// import { useNavigate } from "react-router-dom";
// import server from "../enviroment";

// const server_url = server;

// const connections = {};
// const peerConfigConnection = {
//   iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
// };

// export default function VideoMeetComponent() {
//   const socketRef = useRef(null);
//   const socketIdRef = useRef(null);

//   const localVideoRef = useRef(null);
//   const videoRefsMap = useRef({}); // socketId -> HTMLVideoElement

//   const [videoAvailable, setVideoAvailable] = useState(true);
//   const [audioAvailable, setAudioAvailable] = useState(true);

//   const [video, setVideo] = useState(undefined);
//   const [audio, setAudio] = useState(undefined);

//   const [screen, setScreen] = useState(undefined);
//   const [showModal, setShowModal] = useState(true);

//   const [screenAvailable, setScreenAvailable] = useState(false);
//   const [messages, setMessages] = useState([]);
//   const [message, setMessage] = useState("");
//   const [newMessages, setNewMessages] = useState(0);

//   const [askForUsername, setAskForUsername] = useState(true);
//   const [username, setUsername] = useState("");

//   const [videos, setVideos] = useState([]);
//   const routeTo = useNavigate();

//   // ---- Utilities for fallback streams (black video + silence audio) ----
//   const silence = () => {
//     const ctx = new AudioContext();
//     const oscillator = ctx.createOscillator();
//     const dst = oscillator.connect(ctx.createMediaStreamDestination());
//     oscillator.start();
//     ctx.resume();
//     // Return a disabled audio track
//     return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
//   };

//   const black = ({ width = 640, height = 480 } = {}) => {
//     const canvas = Object.assign(document.createElement("canvas"), {
//       width,
//       height,
//     });
//     canvas.getContext("2d").fillRect(0, 0, width, height);
//     const stream = canvas.captureStream();
//     // Return a disabled video track
//     return Object.assign(stream.getVideoTracks()[0], { enabled: false });
//   };

//   const blackSilenceStream = () => new MediaStream([black({}), silence()]);

//   // ---- Permissions & Local Media ----
//   const getPermissions = async () => {
//     try {
//       // Probe permissions
//       try {
//         const v = await navigator.mediaDevices.getUserMedia({ video: true });
//         v.getTracks().forEach((t) => t.stop());
//         setVideoAvailable(true);
//       } catch {
//         setVideoAvailable(false);
//       }

//       try {
//         const a = await navigator.mediaDevices.getUserMedia({ audio: true });
//         a.getTracks().forEach((t) => t.stop());
//         setAudioAvailable(true);
//       } catch {
//         setAudioAvailable(false);
//       }

//       setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);

//       // Prime local stream (use what’s available)
//       const wantVideo = videoAvailable;
//       const wantAudio = audioAvailable;

//       if (wantVideo || wantAudio) {
//         const userMediaStream = await navigator.mediaDevices.getUserMedia({
//           video: wantVideo,
//           audio: wantAudio,
//         });
//         window.localStream = userMediaStream;
//       } else {
//         window.localStream = blackSilenceStream();
//       }

//       if (localVideoRef.current) {
//         localVideoRef.current.srcObject = window.localStream;
//       }
//     } catch (err) {
//       console.error(err);
//       window.localStream = blackSilenceStream();
//       if (localVideoRef.current) {
//         localVideoRef.current.srcObject = window.localStream;
//       }
//     }
//   };

//   useEffect(() => {
//     getPermissions();
//   }, []);

//   const stopLocalTracks = () => {
//     try {
//       const tracks = localVideoRef.current?.srcObject?.getTracks?.() || [];
//       tracks.forEach((t) => t.stop());
//     } catch (e) {
//       console.log(e);
//     }
//   };

//   const getUserMediaSuccess = (stream) => {
//     stopLocalTracks();
//     window.localStream = stream;
//     if (localVideoRef.current) {
//       localVideoRef.current.srcObject = window.localStream;
//     }

//     Object.keys(connections).forEach((id) => {
//       if (id === socketIdRef.current) return;
//       const pc = connections[id];

//       pc.getSenders().forEach((s) => {
//         // Replace existing tracks so toggles work smoothly
//         if (s.track && s.track.kind === "video") {
//           const newV = stream.getVideoTracks()[0] || null;
//           s.replaceTrack(newV);
//         }
//         if (s.track && s.track.kind === "audio") {
//           const newA = stream.getAudioTracks()[0] || null;
//           s.replaceTrack(newA);
//         }
//       });

//       pc.addStream?.(stream); // for older onaddstream flow

//       pc.createOffer()
//         .then((description) => pc.setLocalDescription(description))
//         .then(() => {
//           socketRef.current.emit(
//             "signal",
//             id,
//             JSON.stringify({ sdp: connections[id].localDescription })
//           );
//         })
//         .catch((e) => console.log(e));
//     });

//     stream.getTracks().forEach((track) => {
//       track.onended = () => {
//         try {
//           stopLocalTracks();
//         } catch (e) {
//           console.log(e);
//         }
//         window.localStream = blackSilenceStream();
//         if (localVideoRef.current) {
//           localVideoRef.current.srcObject = window.localStream;
//         }
//       };
//     });
//   };

//   const getUserMedia = () => {
//     const wantVideo = !!video && videoAvailable;
//     const wantAudio = !!audio && audioAvailable;

//     if (wantVideo || wantAudio) {
//       navigator.mediaDevices
//         .getUserMedia({ video: wantVideo, audio: wantAudio })
//         .then(getUserMediaSuccess)
//         .catch((e) => console.log(e));
//     } else {
//       // Turn everything off:
//       stopLocalTracks();
//       window.localStream = blackSilenceStream();
//       if (localVideoRef.current) {
//         localVideoRef.current.srcObject = window.localStream;
//       }
//     }
//   };

//   useEffect(() => {
//     if (video !== undefined || audio !== undefined) {
//       getUserMedia();
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [video, audio]);

//   // ---- Signaling ----
//   const gotMessageFromServer = (fromId, message) => {
//     const signal = JSON.parse(message);
//     if (fromId === socketIdRef.current) return;

//     if (signal.sdp) {
//       connections[fromId]
//         .setRemoteDescription(new RTCSessionDescription(signal.sdp))
//         .then(() => {
//           if (signal.sdp.type === "offer") {
//             return connections[fromId].createAnswer().then((description) =>
//               connections[fromId].setLocalDescription(description).then(() => {
//                 socketRef.current.emit(
//                   "signal",
//                   fromId,
//                   JSON.stringify({ sdp: connections[fromId].localDescription })
//                 );
//               })
//             );
//           }
//         })
//         .catch((e) => console.log(e));
//     }

//     if (signal.ice) {
//       connections[fromId]
//         .addIceCandidate(new RTCIceCandidate(signal.ice))
//         .catch((e) => console.log(e));
//     }
//   };

//   const addMessage = (data, sender, socketIdSender) => {
//     setMessages((prev) => [...prev, { sender, data }]);
//     if (socketIdSender !== socketIdRef.current && !showModal) {
//       setNewMessages((n) => n + 1);
//     }
//   };

//   const connectToSocketServer = () => {
//     socketRef.current = io(server_url, { secure: false });
//     socketRef.current.on("signal", gotMessageFromServer);

//     socketRef.current.on("connect", () => {
//       socketRef.current.emit("join-call", window.location.href);
//       socketIdRef.current = socketRef.current.id;

//       socketRef.current.on("chat-message", addMessage);

//       socketRef.current.on("user-left", (id) => {
//         setVideos((vs) => vs.filter((v) => v.socketId !== id));
//         delete videoRefsMap.current[id];
//         if (connections[id]) {
//           try {
//             connections[id].close();
//           } catch (_) {}
//           delete connections[id];
//         }
//       });

//       socketRef.current.on("user-joined", (id, clients) => {
//         clients.forEach((socketListId) => {
//           if (connections[socketListId]) return;

//           const pc = new RTCPeerConnection(peerConfigConnection);
//           connections[socketListId] = pc;

//           pc.onicecandidate = (event) => {
//             if (event.candidate) {
//               socketRef.current.emit(
//                 "signal",
//                 socketListId,
//                 JSON.stringify({ ice: event.candidate })
//               );
//             }
//           };

//           // Older API (matches your original onaddstream usage)
//           pc.onaddstream = (event) => {
//             setVideos((prev) => {
//               const exists = prev.some((v) => v.socketId === socketListId);
//               const updated = exists
//                 ? prev.map((v) =>
//                     v.socketId === socketListId
//                       ? { ...v, stream: event.stream }
//                       : v
//                   )
//                 : [
//                     ...prev,
//                     {
//                       socketId: socketListId,
//                       stream: event.stream,
//                       autoPlay: true,
//                       playsInline: true,
//                     },
//                   ];
//               return updated;
//             });

//             // Ensure our own stream is added
//             if (window.localStream) {
//               pc.addStream?.(window.localStream);
//             } else {
//               window.localStream = blackSilenceStream();
//               pc.addStream?.(window.localStream);
//             }
//           };

//           // Seed local stream to peer
//           if (window.localStream) {
//             pc.addStream?.(window.localStream);
//           }
//         });
//       });
//     });
//   };

//   const getMedia = () => {
//     setVideo(videoAvailable);
//     setAudio(audioAvailable);
//     connectToSocketServer();
//   };

//   const connect = () => {
//     if (!username.trim()) {
//       alert("Please enter a username");
//       return;
//     }
//     setAskForUsername(false);
//     getMedia();
//   };

//   const handleVideo = () => setVideo((v) => !v);
//   const handleAudio = () => setAudio((a) => !a);

//   const getDisplayMediaSuccess = (stream) => {
//     stopLocalTracks();
//     window.localStream = stream;
//     if (localVideoRef.current) {
//       localVideoRef.current.srcObject = window.localStream;
//     }

//     Object.keys(connections).forEach((id) => {
//       if (id === socketIdRef.current) return;
//       const pc = connections[id];

//       pc.addStream?.(stream);
//       pc.createOffer()
//         .then((description) => pc.setLocalDescription(description))
//         .then(() => {
//           socketRef.current.emit(
//             "signal",
//             id,
//             JSON.stringify({ sdp: pc.localDescription })
//           );
//         })
//         .catch((e) => console.log(e));
//     });

//     stream.getTracks().forEach((track) => {
//       track.onended = () => {
//         setScreen(false);
//         stopLocalTracks();
//         window.localStream = blackSilenceStream();
//         if (localVideoRef.current) {
//           localVideoRef.current.srcObject = window.localStream;
//         }
//         getUserMedia(); // revert to camera/mic as per toggles
//       };
//     });
//   };

//   const getDisplayMedia = () => {
//     if (screen && navigator.mediaDevices.getDisplayMedia) {
//       navigator.mediaDevices
//         .getDisplayMedia({ video: true, audio: true })
//         .then(getDisplayMediaSuccess)
//         .catch((e) => console.log(e));
//     }
//   };

//   useEffect(() => {
//     if (screen !== undefined) getDisplayMedia();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [screen]);

//   const handleScreen = () => setScreen((s) => !s);

//   const sendMessage = () => {
//     const text = message.trim();
//     if (!text) return;
//     socketRef.current.emit("chat-message", text, username);
//     setMessage("");
//   };

//   const handleEndcall = () => {
//     stopLocalTracks();
//     routeTo("/home");
//   };

//   useEffect(() => {
//     if (showModal) {
//       // opened chat -> clear unread count
//       setNewMessages(0);
//     }
//   }, [showModal]);

//   return (
//     <div className={styles.meetVideoContainer}>
//       {askForUsername ? (
//         /* ---- Lobby ---- */
//         <div
//           style={{
//             display: "flex",
//             flexDirection: "column",
//             alignItems: "center",
//             justifyContent: "center",
//             height: "100%",
//             gap: "20px",
//           }}
//         >
//           <h2 style={{ fontSize: "2rem", fontWeight: "bold" }}>
//             Enter into Lobby
//           </h2>
//           <TextField
//             id="outlined-basic"
//             label="Username"
//             value={username}
//             onChange={(e) => setUsername(e.target.value)}
//             variant="outlined"
//             style={{ background: "white", borderRadius: "6px" }}
//           />
//           <Button
//             variant="contained"
//             onClick={connect}
//             style={{ backgroundColor: "#ff9939", color: "white" }}
//           >
//             Connect
//           </Button>

//           <div
//             style={{
//               marginTop: "10px",
//               border: "1px solid #444",
//               borderRadius: "8px",
//               overflow: "hidden",
//             }}
//           >
//             <video
//               ref={localVideoRef}
//               autoPlay
//               muted
//               className={styles.meetUserVideo}
//             />
//           </div>
//         </div>
//       ) : (
//         /* ---- Meeting ---- */
//         <>
//           {/* Chat Panel */}
//           {showModal && (
//             <div className={styles.chatRoom}>
//               <div className={styles.chatContainer}>
//                 <h2 style={{ color: "white", marginBottom: "10px" }}>Chat</h2>
//                 <div className={styles.chattingDisplay}>
//                   {messages.map((item, index) => (
//                     <div style={{ marginBottom: "12px" }} key={index}>
//                       <p style={{ fontWeight: "bold", fontSize: "14px" }}>
//                         {item.sender}
//                       </p>
//                       <p style={{ fontSize: "13px", color: "#d1d5db" }}>
//                         {item.data}
//                       </p>
//                     </div>
//                   ))}
//                 </div>
//                 <div className={styles.chattingArea}>
//                   <TextField
//                     value={message}
//                     onChange={(e) => setMessage(e.target.value)}
//                     id="outlined-basic"
//                     label="Enter your chat"
//                     variant="outlined"
//                     style={{
//                       background: "white",
//                       borderRadius: "6px",
//                       flex: 1,
//                     }}
//                     onKeyDown={(e) => e.key === "Enter" && sendMessage()}
//                   />
//                   <Button
//                     onClick={sendMessage}
//                     variant="contained"
//                     style={{ backgroundColor: "#3b82f6" }}
//                   >
//                     Send
//                   </Button>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Controls */}
//           <div className={styles.buttonContainers}>
//             <IconButton onClick={handleVideo}>
//               {video ? <VideocamIcon /> : <VideocamOffIcon />}
//             </IconButton>

//             <IconButton
//               onClick={handleEndcall}
//               style={{ backgroundColor: "red", color: "white" }}
//             >
//               <CallEndIcon />
//             </IconButton>

//             <IconButton onClick={handleAudio}>
//               {audio ? <MicIcon /> : <MicOffIcon />}
//             </IconButton>

//             {screenAvailable && (
//               <IconButton onClick={handleScreen}>
//                 {screen ? <ScreenShareIcon /> : <StopScreenShareIcon />}
//               </IconButton>
//             )}

//             <Badge badgeContent={newMessages} max={99} color="secondary">
//               <IconButton onClick={() => setShowModal(!showModal)}>
//                 <ChatIcon />
//               </IconButton>
//             </Badge>
//           </div>

//           {/* Local Video */}
//           <div style={{ position: "absolute", bottom: "12vh", left: "20px" }}>
//             <video
//               className={styles.meetUserVideo}
//               ref={localVideoRef}
//               autoPlay
//               muted
//             />
//             <span className={styles.videoNameTag}>You</span>
//           </div>

//           {/* Remote Participants */}
//           <div className={styles.conferenceView}>
//             {videos.map((v) => (
//               <div key={v.socketId} style={{ position: "relative" }}>
//                 <video
//                   data-socket={v.socketId}
//                   ref={(ref) => {
//                     if (ref) {
//                       videoRefsMap.current[v.socketId] = ref;
//                       if (v.stream) ref.srcObject = v.stream;
//                     }
//                   }}
//                   autoPlay
//                   playsInline
//                 />
//                 <span className={styles.videoNameTag}>Participant</span>
//               </div>
//             ))}
//           </div>
//         </>
//       )}
//     </div>
//   );
// }



import React, { useEffect, useRef, useState } from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { io } from "socket.io-client";
import styles from "../styles/VideoComponent.module.css";
import IconButton from "@mui/material/IconButton";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import Badge from "@mui/material/Badge";
import ChatIcon from "@mui/icons-material/Chat";
import { useNavigate } from "react-router-dom";
import server from "../enviroment";

const server_url = server;

const connections = {};
const peerConfigConnection = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VideoMeetComponent() {
  const socketRef = useRef(null);
  const socketIdRef = useRef(null);

  const localVideoRef = useRef(null);
  const videoRefsMap = useRef({}); // socketId -> HTMLVideoElement

  const [videoAvailable, setVideoAvailable] = useState(true);
  const [audioAvailable, setAudioAvailable] = useState(true);

  const [video, setVideo] = useState(undefined);
  const [audio, setAudio] = useState(undefined);

  const [screen, setScreen] = useState(undefined);
  const [showModal, setShowModal] = useState(true);

  const [screenAvailable, setScreenAvailable] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [newMessages, setNewMessages] = useState(0);

  const [askForUsername, setAskForUsername] = useState(true);
  const [username, setUsername] = useState("");

  const [videos, setVideos] = useState([]);
  const routeTo = useNavigate();

  // ---- draggable local video state ----
  const localVideoBoxRef = useRef(null);
  const [pos, setPos] = useState({ x: 20, y: 20 });

  const handleDragStart = (e) => {
    const box = localVideoBoxRef.current;
    if (!box) return;

    const shiftX = e.clientX - box.getBoundingClientRect().left;
    const shiftY = e.clientY - box.getBoundingClientRect().top;

    const onMouseMove = (event) => {
      setPos({
        x: event.clientX - shiftX,
        y: event.clientY - shiftY,
      });
    };

    document.addEventListener("mousemove", onMouseMove);
    document.onmouseup = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.onmouseup = null;
    };
  };

  // ---- Utilities for fallback streams (black video + silence audio) ----
  const silence = () => {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
  };

  const black = ({ width = 640, height = 480 } = {}) => {
    const canvas = Object.assign(document.createElement("canvas"), {
      width,
      height,
    });
    canvas.getContext("2d").fillRect(0, 0, width, height);
    const stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
  };

  const blackSilenceStream = () => new MediaStream([black({}), silence()]);

  // ---- Permissions & Local Media ----
  const getPermissions = async () => {
    try {
      try {
        const v = await navigator.mediaDevices.getUserMedia({ video: true });
        v.getTracks().forEach((t) => t.stop());
        setVideoAvailable(true);
      } catch {
        setVideoAvailable(false);
      }

      try {
        const a = await navigator.mediaDevices.getUserMedia({ audio: true });
        a.getTracks().forEach((t) => t.stop());
        setAudioAvailable(true);
      } catch {
        setAudioAvailable(false);
      }

      setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);

      const wantVideo = videoAvailable;
      const wantAudio = audioAvailable;

      if (wantVideo || wantAudio) {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({
          video: wantVideo,
          audio: wantAudio,
        });
        window.localStream = userMediaStream;
      } else {
        window.localStream = blackSilenceStream();
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = window.localStream;
      }
    } catch (err) {
      console.error(err);
      window.localStream = blackSilenceStream();
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = window.localStream;
      }
    }
  };

  useEffect(() => {
    getPermissions();
  }, []);

  const stopLocalTracks = () => {
    try {
      const tracks = localVideoRef.current?.srcObject?.getTracks?.() || [];
      tracks.forEach((t) => t.stop());
    } catch (e) {
      console.log(e);
    }
  };

  const getUserMediaSuccess = (stream) => {
    stopLocalTracks();
    window.localStream = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = window.localStream;
    }

    Object.keys(connections).forEach((id) => {
      if (id === socketIdRef.current) return;
      const pc = connections[id];

      pc.getSenders().forEach((s) => {
        if (s.track && s.track.kind === "video") {
          const newV = stream.getVideoTracks()[0] || null;
          s.replaceTrack(newV);
        }
        if (s.track && s.track.kind === "audio") {
          const newA = stream.getAudioTracks()[0] || null;
          s.replaceTrack(newA);
        }
      });

      pc.addStream?.(stream);

      pc.createOffer()
        .then((description) => pc.setLocalDescription(description))
        .then(() => {
          socketRef.current.emit(
            "signal",
            id,
            JSON.stringify({ sdp: connections[id].localDescription })
          );
        })
        .catch((e) => console.log(e));
    });

    stream.getTracks().forEach((track) => {
      track.onended = () => {
        try {
          stopLocalTracks();
        } catch (e) {
          console.log(e);
        }
        window.localStream = blackSilenceStream();
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = window.localStream;
        }
      };
    });
  };

  const getUserMedia = () => {
    const wantVideo = !!video && videoAvailable;
    const wantAudio = !!audio && audioAvailable;

    if (wantVideo || wantAudio) {
      navigator.mediaDevices
        .getUserMedia({ video: wantVideo, audio: wantAudio })
        .then(getUserMediaSuccess)
        .catch((e) => console.log(e));
    } else {
      stopLocalTracks();
      window.localStream = blackSilenceStream();
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = window.localStream;
      }
    }
  };

  useEffect(() => {
    if (video !== undefined || audio !== undefined) {
      getUserMedia();
    }
  }, [video, audio]);

  const gotMessageFromServer = (fromId, message) => {
    const signal = JSON.parse(message);
    if (fromId === socketIdRef.current) return;

    if (signal.sdp) {
      connections[fromId]
        .setRemoteDescription(new RTCSessionDescription(signal.sdp))
        .then(() => {
          if (signal.sdp.type === "offer") {
            return connections[fromId].createAnswer().then((description) =>
              connections[fromId].setLocalDescription(description).then(() => {
                socketRef.current.emit(
                  "signal",
                  fromId,
                  JSON.stringify({ sdp: connections[fromId].localDescription })
                );
              })
            );
          }
        })
        .catch((e) => console.log(e));
    }

    if (signal.ice) {
      connections[fromId]
        .addIceCandidate(new RTCIceCandidate(signal.ice))
        .catch((e) => console.log(e));
    }
  };

  const addMessage = (data, sender, socketIdSender) => {
    setMessages((prev) => [...prev, { sender, data }]);
    if (socketIdSender !== socketIdRef.current && !showModal) {
      setNewMessages((n) => n + 1);
    }
  };

  const connectToSocketServer = () => {
    socketRef.current = io(server_url, { secure: false });
    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.on("connect", () => {
      socketRef.current.emit("join-call", window.location.href);
      socketIdRef.current = socketRef.current.id;

      socketRef.current.on("chat-message", addMessage);

      socketRef.current.on("user-left", (id) => {
        setVideos((vs) => vs.filter((v) => v.socketId !== id));
        delete videoRefsMap.current[id];
        if (connections[id]) {
          try {
            connections[id].close();
          } catch (_) {}
          delete connections[id];
        }
      });

      socketRef.current.on("user-joined", (id, clients) => {
        clients.forEach((socketListId) => {
          if (connections[socketListId]) return;

          const pc = new RTCPeerConnection(peerConfigConnection);
          connections[socketListId] = pc;

          pc.onicecandidate = (event) => {
            if (event.candidate) {
              socketRef.current.emit(
                "signal",
                socketListId,
                JSON.stringify({ ice: event.candidate })
              );
            }
          };

          pc.onaddstream = (event) => {
            setVideos((prev) => {
              const exists = prev.some((v) => v.socketId === socketListId);
              const updated = exists
                ? prev.map((v) =>
                    v.socketId === socketListId
                      ? { ...v, stream: event.stream }
                      : v
                  )
                : [
                    ...prev,
                    {
                      socketId: socketListId,
                      stream: event.stream,
                      autoPlay: true,
                      playsInline: true,
                    },
                  ];
              return updated;
            });

            if (window.localStream) {
              pc.addStream?.(window.localStream);
            } else {
              window.localStream = blackSilenceStream();
              pc.addStream?.(window.localStream);
            }
          };

          if (window.localStream) {
            pc.addStream?.(window.localStream);
          }
        });
      });
    });
  };

  const getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer();
  };

  const connect = () => {
    if (!username.trim()) {
      alert("Please enter a username");
      return;
    }
    setAskForUsername(false);
    getMedia();
  };

  const handleVideo = () => setVideo((v) => !v);
  const handleAudio = () => setAudio((a) => !a);

  const getDisplayMediaSuccess = (stream) => {
    stopLocalTracks();
    window.localStream = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = window.localStream;
    }

    Object.keys(connections).forEach((id) => {
      if (id === socketIdRef.current) return;
      const pc = connections[id];

      pc.addStream?.(stream);
      pc.createOffer()
        .then((description) => pc.setLocalDescription(description))
        .then(() => {
          socketRef.current.emit(
            "signal",
            id,
            JSON.stringify({ sdp: pc.localDescription })
          );
        })
        .catch((e) => console.log(e));
    });

    stream.getTracks().forEach((track) => {
      track.onended = () => {
        setScreen(false);
        stopLocalTracks();
        window.localStream = blackSilenceStream();
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = window.localStream;
        }
        getUserMedia();
      };
    });
  };

  const getDisplayMedia = () => {
    if (screen && navigator.mediaDevices.getDisplayMedia) {
      navigator.mediaDevices
        .getDisplayMedia({ video: true, audio: true })
        .then(getDisplayMediaSuccess)
        .catch((e) => console.log(e));
    }
  };

  useEffect(() => {
    if (screen !== undefined) getDisplayMedia();
  }, [screen]);

  const handleScreen = () => setScreen((s) => !s);

  const sendMessage = () => {
    const text = message.trim();
    if (!text) return;
    socketRef.current.emit("chat-message", text, username);
    setMessage("");
  };

  const handleEndcall = () => {
    stopLocalTracks();
    routeTo("/home");
  };

  useEffect(() => {
    if (showModal) {
      setNewMessages(0);
    }
  }, [showModal]);

  return (
    <div className={styles.meetVideoContainer}>
      {askForUsername ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            gap: "20px",
          }}
        >
          <h2 style={{ fontSize: "2rem", fontWeight: "bold" }}>
            Enter into Lobby
          </h2>
          <TextField
            id="outlined-basic"
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            variant="outlined"
            style={{ background: "white", borderRadius: "6px" }}
          />
          <Button
            variant="contained"
            onClick={connect}
            style={{ backgroundColor: "#ff9939", color: "white" }}
          >
            Connect
          </Button>

          <div
            style={{
              marginTop: "10px",
              border: "1px solid #444",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <video
              ref={localVideoRef}
              autoPlay
              muted
              className={styles.meetUserVideo}
            />
          </div>
        </div>
      ) : (
        <>
          {/* Controls */}
          <div className={styles.buttonContainers}>
            <IconButton onClick={handleVideo}>
              {video ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>

            <IconButton
              onClick={handleEndcall}
              style={{ backgroundColor: "red", color: "white" }}
            >
              <CallEndIcon />
            </IconButton>

            <IconButton onClick={handleAudio}>
              {audio ? <MicIcon /> : <MicOffIcon />}
            </IconButton>

            {screenAvailable && (
              <IconButton onClick={handleScreen}>
                {screen ? <ScreenShareIcon /> : <StopScreenShareIcon />}
              </IconButton>
            )}

            <Badge badgeContent={newMessages} max={99} color="secondary">
              <IconButton onClick={() => setShowModal(!showModal)}>
                <ChatIcon />
              </IconButton>
            </Badge>
          </div>

          {/* ✅ Local draggable video */}
          <div
            ref={localVideoBoxRef}
            onMouseDown={handleDragStart}
            style={{
              position: "absolute",
              top: pos.y,
              left: pos.x,
              zIndex: 100,
              cursor: "move",
            }}
          >
            <video
              className={styles.meetUserVideo}
              ref={localVideoRef}
              autoPlay
              muted
            />
            <span className={styles.videoNameTag}>You</span>
          </div>

          {/* ✅ Remote participants full size */}
          <div className={styles.conferenceView}>
            {videos.map((v) => (
              <div
                key={v.socketId}
                style={{ position: "relative", width: "100%", height: "100%" }}
              >
                <video
                  data-socket={v.socketId}
                  ref={(ref) => {
                    if (ref) {
                      videoRefsMap.current[v.socketId] = ref;
                      if (v.stream) ref.srcObject = v.stream;
                    }
                  }}
                  autoPlay
                  playsInline
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "10px",
                  }}
                />
                <span className={styles.videoNameTag}>Participant</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
