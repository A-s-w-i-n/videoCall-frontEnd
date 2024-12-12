import { useEffect, useRef, useState } from "react";
import "./App.css";
import { io } from "socket.io-client";
import Peer from "simple-peer";
import "global/window";
import "global/document";
import {  IconButton, TextField } from "@mui/material";
import { CopyToClipboard } from "react-copy-to-clipboard";
import {
  PhoneBluetoothSpeaker,
} from "@mui/icons-material";
const socket = io("https://videocall-backend-wqwv.onrender.com");
// import global from 'global'
import * as process from "process";
global.process = process;
function App() {
  console.log("hihii");

  const [me, setMe] = useState<any>("");
  const [stream, setStream] = useState<any>();
  const [receivingCall, setReceivingCall] = useState<any>(false);
  const [caller, setCaller] = useState<any>("");
  const [callerSignal, setCallerSignal] = useState<any>();
  const [callAccepted, setCallAccepted] = useState<any>(false);
  const [idToCall, setIdToCall] = useState<any>("");
  const [callEnded, setCallEnded] = useState<any>(false);
  const [name, setName] = useState<any>("");
  const myVideo = useRef<any>(null);
  const userVideo = useRef<any>(null);
  const connectionRef = useRef<any | null>(null);

  console.log(me, "idd");

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
    socket.on("me", (id) => {
      console.log(id);

      setMe(id);
    });

    socket.on("callUser", (data) => {
      console.log(data, "data");

      setReceivingCall(true);
      setCaller(data.from);
      setName(data.name);
      setCallerSignal(data.signal);
    });

    return () => {
      socket.off("me");
      socket.off("callUser");
      if (stream) {
        stream.getTracks().forEach((track: any) => track.stop());
      }
    };
  }, []);
  console.log(stream);

  const callUser = (id: any) => {
    try {
      console.log(id);
      const peer = new Peer({ initiator: true, trickle: false, stream });
      // const peer = new Peer({
      //   initiator: true,
      //   trickle: false,
      //   stream: stream,
      //   // config:{
      //   //   iceServers:[
      //   //     { urls: 'stun:stun.l.google.com:19302' },
      //   //     { urls: 'stun:global.stun.twilio.com:3478?transport=udp' }
      //   //   ]
      //   // }
      // });
      console.log(peer);
      peer.on("error", (err) => {
        console.error("Peer Error:", err);
      });

      peer.on("signal", (data) => {
        console.log("working");

        socket.emit("callUser", {
          userToCall: id,
          signalData: data,
          from: me,
          name: name,
        });
        console.log("working 2");
      });
      peer.on("stream", (remoteStream) => {
        console.log("working1");

        if (userVideo.current) {
          userVideo.current.srcObject = remoteStream;
        }
      });
      socket.on("callAccepted", (signal) => {
        console.log("working2");

        setCallAccepted(true);
        peer.signal(signal);
      });
      connectionRef.current = peer;
    } catch (error) {
      console.error("Error creating peer connection:", error);
    }
  };

  const answerCall = () => {
    setCallAccepted(true);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });
    peer.on("signal", (data) => {
      socket.emit("answerCall", { signal: data, to: caller });
    });
    peer.on("stream", (stream) => {
      userVideo.current.srcObject = stream;
    });

    peer.signal(callerSignal);
    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setCallEnded(true);
    connectionRef.current.destroy();
    window.location.reload();
  };
  console.log(receivingCall);

  console.log(idToCall);

  return (
    <div className=" bg-blue-100 h-full">
      <h1 className="text-lg font-bold w-full  text-center justify-center">Video Call</h1>
      <div className="flex flex-col w-full   justify-center">
        <div className=" flex gap-5 w-[50%]  ">
          <div className="video w-full">
            {stream && (
              <video
                className="w-full"
                playsInline
                muted
                ref={myVideo}
                autoPlay
              />
            )}
          </div>
          <div className="video w-full">
            {callAccepted && !callEnded ? (
              <video className="w-full" playsInline ref={userVideo} autoPlay />
            ) : null}
          </div>
        </div>
        <div className="flex flex-col gap-3 ">
          <div className="flex w-[50%] justify-between gap-3 items-center ">
            <TextField
              className="rounded"
              id="filled-basic"
              label="Name"
              variant="filled"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {!callAccepted && (
              <CopyToClipboard text={me}>
                <button
                  className="bg-blue-400  hover:bg-green-500  rounded px-5 py-2 text-white"
                  color="primary"
                >
                  Copy ID
                </button>
              </CopyToClipboard>
            )}

            <TextField
              id="filled-basic"
              label="ID to call"
              variant="filled"
              value={idToCall}
              onChange={(e) => setIdToCall(e.target.value)}
            />
          </div>

          <div className="call-button">
            {callAccepted && !callEnded ? (
              <button
                className="bg-red-500 py-2 px-5 rounded"
                onClick={leaveCall}
              >
                End Call
              </button>
            ) : (
              <IconButton
                color="primary"
                aria-label="call"
                onClick={() => callUser(idToCall)}
              >
                <PhoneBluetoothSpeaker fontSize="large" />
              </IconButton>
            )}
            {idToCall}
          </div>
        </div>
        <div>
          {receivingCall && !callAccepted ? (
            <div className="caller">
              <h1>{name} is calling...</h1>
              <button
                className="bg-green-500 rounded py-2 px-3"
                onClick={answerCall}
              >
                Answer
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default App;
