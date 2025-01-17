import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import Peer from "simple-peer";
import "global/window";
import "global/document";
import { CallIcon, MicIcon, VideoIcon } from "../icons/Icon";
import { useLocation } from "react-router-dom";

const socket = io("http://localhost:5000/");

const VideoCallPage = () => {
  const location = useLocation();
  const { roomId, userName, isCreator } = location.state || {};

  const [stream, setStream] = useState<any>();
  const [receivingCall, setReceivingCall] = useState<any>(false);
  const [caller, setCaller] = useState<any>("");
  const [callerSignal, setCallerSignal] = useState<any>();
  const [callAccepted, setCallAccepted] = useState<any>(false);
  const [callEnded, setCallEnded] = useState<any>(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isCallAllowed, setIsCallAllowed] = useState<boolean>(false);
  const [isCalling, setIsCalling] = useState<boolean>(false);
  const [height, setHeight] = useState(window.innerHeight);

  const connectionRef = useRef<any>(null);
  const myVideo = useRef<any>(null);
  const userVideo = useRef<any>(null);

  console.log(userVideo);
  console.log(receivingCall, "recivngCall");
  console.log(roomId, "idd");
  console.log(roomId, userName, "check");
  console.log(userVideo.current, "userVideo");

  useEffect(() => {
    const getMediaStream = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setStream(mediaStream);

        if (myVideo.current) {
          myVideo.current.srcObject = mediaStream;
        }
      } catch (error) {
        console.error("Error accessing media devices:", error);
        alert("Please allow camera and microphone access");
      }
    };

    getMediaStream();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track: any) => track.stop());
      }
      if (connectionRef.current) {
        connectionRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    socket.on("callUser", (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setCallerSignal(data.signal);
      console.log(data, "testing");
    });
    socket.on("callAccepted", (signal) => {
      console.log("Call accepted, received signal:", signal);
      setCallAccepted(true);
      setIsCalling(false);
      setIsCallAllowed(true);
      if (connectionRef.current) {
        connectionRef.current.signal(signal);
      }
    });
    socket.on("callEnded", () => {
      setCallEnded(true);
      if (connectionRef.current) {
        connectionRef.current.destroy();
      }
      window.location.reload();
    });
    return () => {
      socket.off("callUser");
      socket.off("callAccepted");
      socket.off("callEnded");
    };
  }, []);
  const callUser = (id: any) => {
    if (!stream) return;
    try {
      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:global.stun.twilio.com:3478" },
          ],
        },
      });
      // peer.on("error", (err) => {
      //   console.error("Peer Error:", err);
      // });
      peer.on("signal", (data) => {
        console.log("working");
        console.log(id, data, userName, "fsfdsfdsfds");
        socket.emit("callUser", {
          userToCall: id,
          signalData: data,
          from: socket.id,
          name: userName,
        });
      });

      peer.on("stream", (remoteStream) => {
        console.log(remoteStream, "remote");
        if (userVideo.current) {
          userVideo.current.srcObject = remoteStream;
          console.log("Set remote stream to video element");
        }
      });
      peer.on("error", (err) => {
        console.error("Peer error:", err);
      });
      
      connectionRef.current = peer;
      setIsCalling(true);
    } catch (error) {
      console.error("Error creating peer connection:", error);
    }
  };

  console.log(receivingCall, isCreator, "testing");

  // const callUser = (id: any) => {
  //   try {
  //     const peer = new Peer({ initiator: true, trickle: false, stream });
  //     console.log(peer);
  //     peer.on("error", (err) => {
  //       console.error("Peer Error:", err);
  //     });
  //     peer.on("signal", (data) => {
  //       console.log("working");

  //       console.log(id, data, userName, "fsfdsfdsfds");

  //       socket.emit("callUser", {
  //         userToCall: id,
  //         signalData: data,
  //         from: id,
  //         name: userName,
  //       });
  //     });

  //     setIsCalling(true);
  //     peer.on("stream", (remoteStream) => {
  //       console.log(remoteStream, "remote");
  //       if (userVideo.current) {
  //         userVideo.current.srcObject = remoteStream;
  //         console.log("Set remote stream to video element");
  //       }
  //     });
  //     // socket.on("callAccepted", (signal) => {
  //     //   console.log("working2","peer");
  //     //   peer.signal(signal);
  //     // });
  //     connectionRef.current = peer;
  //   } catch (error) {
  //     console.error("Error creating peer connection:", error);
  //   }
  // };
  const answerCall = () => {
    if (!stream) return;
    setCallAccepted(true);
    setReceivingCall(false);
    setIsCallAllowed(true);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:global.stun.twilio.com:3478" },
        ],
      },
    });
    console.log(peer, "peer");

    peer.on("signal", (data) => {
      console.log(data, "peer");

      socket.emit("answerCall", { signal: data, to: caller });
    });
    peer.on("stream", (stream) => {
      console.log(stream, "peer");
      userVideo.current.srcObject = stream;
    });

    peer.signal(callerSignal);
    connectionRef.current = peer;
    setCallAccepted(true);
    setReceivingCall(false);
    setIsCallAllowed(true);
  };
  const leaveCall = () => {
    setCallEnded(true);
    connectionRef.current.destroy();
    window.location.reload();
    setCallAccepted(true);
    setReceivingCall(false);
    setIsCallAllowed(true);
  };
  const rejectCall = () => {
    socket.emit("rejectCall", {
      to: caller,
      from: roomId,
    });
    setReceivingCall(false);
  };
  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach((track: any) => {
        track.enabled = isVideoOff;
      });
      setIsVideoOff(!isVideoOff);
    }
  };
  const toggleMute = () => {
    if (stream) {
      stream.getAudioTracks().forEach((track: any) => {
        track.enabled = !isMicMuted;
      });
      setIsMicMuted(!isMicMuted);
    }
  };

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (entry) {
        setHeight(entry.contentRect.height);
      }
    });

    if (document.body) {
      resizeObserver.observe(document.body);
    }

    // Fallback resize event listener
    const handleResize = () => {
      setHeight(window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  console.log(isCreator);

  console.log(isCreator, isCalling, isCallAllowed, receivingCall, "logs");

  console.log(isCalling, "peer");
  console.log(isCallAllowed, "peer");

  return (
    <div
      className="flex flex-col w-full  gap-2  p-3 "
      style={{ height: height }}
    >
      <div className="flex w-full h-[90%]  gap-2 ">
        {stream && (
          <div
            className={`flex flex-col ${
              callAccepted && !callEnded ? "w-[80%]" : "w-full"
            }  shadow-slate-400 border  shadow-md   rounded-md  `}
          >
            <video
              className="w-full h-full"
              playsInline
              muted
              ref={myVideo}
              autoPlay
            />
          </div>
        )}
        <div className="flex flex-col w-[20%]  gap-2 border shadow-md shadow-slate-400   rounded-md    ">
          {callAccepted && !callEnded ? (
            <video
              className="w-full border shadow-lg h-[25%] rounded-md  "
              playsInline
              ref={userVideo}
              autoPlay
              // <video className="w-full border shadow-lg h-[25%] rounded-md" playsInline ref={userVideo} autoPlay />
              // <video className="w-full border shadow-lg h-[25%] rounded-md" playsInline ref={userVideo} autoPlay />
              // <video className="w-full border shadow-lg h-[25%] rounded-md" playsInline ref={userVideo} autoPlay />
            />
          ) : null}
        </div>
      </div>
      <div className="flex items-center w-[83%]  gap-7 justify-center   rounded-md h-[10%]">
        <button
          className="flex items-center  justify-center rounded-full w-10 h-10 bg-blue-200"
          onClick={toggleVideo}
        >
          <VideoIcon />
        </button>
        <button
          className="flex items-center  justify-center rounded-full   w-10 h-10 bg-blue-200"
          onClick={toggleMute}
        >
          <MicIcon />
        </button>
        <button
          className="flex items-center  w-10 h-10 bg-red-600 rounded-full justify-center"
          onClick={leaveCall}
        >
          <CallIcon />
        </button>
        {!isCreator && !isCalling && !isCallAllowed && (
          <button
            className="bg-green-500 text-white px-4 py-2 rounded"
            onClick={() => callUser(roomId)}
          >
            Request Call
          </button>
        )}

        {isCalling && !isCallAllowed && (
          <div className="text-blue-500">Waiting for permission...</div>
        )}
      </div>
      {receivingCall && isCreator && (
        <div className="flex absolute bottom-8  right-1 justify-between bg-white border border-black shadow-xl rounded-md items-center  h-32 px-4  w-96  ">
          <h2 className="">{caller} is Requesting...</h2>
          <div className="flex gap-5">
            <button
              className="p-3 bg-green-400 text-white rounded-full"
              onClick={answerCall}
            >
              Allow
            </button>
            <button
              className="p-3 bg-red-500 text-white rounded-full"
              onClick={rejectCall}
            >
              Deny
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCallPage;
