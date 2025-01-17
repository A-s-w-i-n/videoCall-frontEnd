import { useEffect, useState } from "react";
import landingImgae from "../assets/images/landingImage.jpg";
import { TextField } from "@mui/material";
import { io } from "socket.io-client";

import { CloseIcon } from "../icons/Icon";
import { useNavigate } from "react-router";

const socket = io("http://localhost:5000");
const LandingPage = () => {
  const navigate = useNavigate();
  const [me, setMe] = useState<any>("");
  const [popUp, setPopUp] = useState(false);
  // const [name, setName] = useState<any>("");
  const [idToCall, setIdToCall] = useState<any>("");
  const [roomName, setRoomName] = useState<string>("");

  useEffect(() => {
    const handleSocketId = (id: any) => {
      console.log(id,"signal");
      setMe(id);
    };
    socket.on("me", handleSocketId);
    return () => {
      socket.off("me", handleSocketId);
    };
  }, [!me]);

  const createRoom = () => {
    if (me) {
      navigate("/call", {
        state: {
          roomId: me,
          userName: roomName,
          isCreator: true,
        },
      });
    }
  };

  const joinRoom = () => {
    navigate("/call", {
      state: {
        roomId: idToCall,
        userName: `Guest-${me.slice(0, 5)}`,
        isCreator: false,
      },
    });
  };

  const handlePopUpClose = () => {
    setPopUp(false);
    setRoomName("");
    setIdToCall("");
  };
  return (
    <div className="flex flex-col h-screen w-full ">
      <div className="flex justify-between h-20 w-full  border-b shadow-lg">
        <h1 className="h-full flex items-center px-4 font-serif text-xl ">
          WebTalks
        </h1>
      </div>
      <div className="flex w-full h-full px-4   gap-2">
        <div className="flex flex-col gap-10 w-full justify-center  items-center text-start ">
          <div className="flex flex-col justify-start ">
            <h2 className="text-3xl font-bold">Brign People</h2>
            <br />
            <h2 className="text-3xl font-bold">togater to make</h2>
            <br />
            <h2 className="text-3xl font-bold"> WebTalks happen</h2>
          </div>
          <div className="w-[32.5%]">
            <button
              className="flex  justify-center px-10 py-3 rounded-2xl bg-blue-300 text-white hover:bg-violet-600"
              onClick={() => setPopUp(!popUp)}
            >
              Join
            </button>
          </div>
        </div>
        <div className="flex w-full  h-full  items-center">
          <img src={landingImgae} alt="" className="rounded-xl" />
        </div>
      </div>
      {popUp && (
        <div className="absolute inset-0 flex justify-center items-center">
          <div className="flex flex-col gap-5 w-atuo  bg-blue-200 p-8 rounded-xl border shadow-2xl">
            <div className="flex w-full justify-end">
              <button className="" onClick={handlePopUpClose}>
                <CloseIcon />
              </button>
            </div>
            <div className="flex  gap-10">
              <TextField
                className="rounded"
                id="filled-basic"
                label="Room Id to Create"
                variant="filled"
                value={roomName}
                required
                onChange={(e) => setRoomName(e.target.value)}
              />

              <button
                onClick={createRoom}
                className="bg-blue-400  hover:bg-green-500  rounded px-5 py-2 text-white"
                color="primary"
              >
                Create Room
              </button>
            </div>
            <h2 className="flex w-full justify-center">OR</h2>
            <div className="flex gap-10   ">
              <TextField
                id="filled-basic"
                label="ID to call"
                variant="filled"
                value={idToCall}
                onChange={(e) => setIdToCall(e.target.value)}
              />
              <button
                onClick={joinRoom}
                className="bg-blue-400  hover:bg-green-500  rounded px-5 py-2 text-white"
                color="primary"
              >
                Join Room
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
