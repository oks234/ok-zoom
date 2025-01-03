import "../css/main.css";

const socket = io();

// call

const call = document.getElementById("call");
const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");

call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;

async function getCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");
    const currentCamera = myStream.getVideoTracks()[0];
    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerText = camera.label;
      if (currentCamera.label === camera.label) {
        option.selected = true;
      }
      camerasSelect.append(option);
    });
  } catch (e) {
    console.log(e);
  }
}

async function getMedia(deviceId) {
  const initialConstrains = {
    audio: true,
    video: {
      facingMode: true,
      width: { min: 640, ideal: 1920, max: 1920 },
      height: { min: 400, ideal: 1080 },
      aspectRatio: 1.777777778,
    },
  };
  const cameraConstrains = {
    audio: true,
    video: {
      deviceId: { exact: deviceId },
      facingMode: true,
      width: { min: 640, ideal: 1920, max: 1920 },
      height: { min: 400, ideal: 1080 },
      aspectRatio: 1.777777778,
    },
  };
  try {
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? cameraConstrains : initialConstrains
    );
    myFace.srcObject = myStream;
    if (!deviceId) await getCameras();
  } catch (e) {
    console.log(e);
  }
}

function handleMuteBtnClick() {
  myStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (!muted) {
    muteBtn.classList.add("muted");
    muted = true;
  } else {
    muteBtn.classList.remove("muted");
    muted = false;
  }
}

function handleCameraBtnClick() {
  myStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (!cameraOff) {
    cameraBtn.classList.add("off");
    cameraOff = true;
  } else {
    cameraBtn.classList.remove("off");
    cameraOff = false;
  }
}

async function handleCameraChange() {
  await getMedia(camerasSelect.value);
  if (myPeerConnection) {
    const videoTrack = myStream.getVideoTracks()[0];
    const audioTrack = myStream.getAudioTracks()[0];
    videoTrack.enabled = !cameraBtn.classList.contains("off");
    audioTrack.enabled = !muteBtn.classList.contains("muted");
    const videoSender = myPeerConnection
      .getSenders()
      .find((sender) => sender.track.kind === "video");
    videoSender.replaceTrack(videoTrack);
  }
}

muteBtn.addEventListener("click", handleMuteBtnClick);
cameraBtn.addEventListener("click", handleCameraBtnClick);
camerasSelect.addEventListener("input", handleCameraChange);

// welcome

const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

async function initCall() {
  await getMedia();
  makeConnection();
  welcome.hidden = true;
  call.hidden = false;
}

async function handleWelcomeSubmit(event) {
  event.preventDefault();
  const input = welcomeForm.querySelector("input");
  roomName = input.value;
  await initCall();
  socket.emit("join_room", roomName);
  input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// socket

socket.on("welcome", async () => {
  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer);
  console.log("send offer");
  socket.emit("offer", offer, roomName);
});

socket.on("offer", async (offer) => {
  console.log("received offer");
  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(answer);
  console.log("send answer");
  socket.emit("answer", answer, roomName);
});

socket.on("answer", async (answer) => {
  console.log("received answer");
  myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", (ice) => {
  console.log("received ice candidate");
  myPeerConnection.addIceCandidate(ice);
});

// RTC

function makeConnection() {
  myPeerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:stun.l.google.com:5349",
          "stun:stun1.l.google.com:3478",
          "stun:stun1.l.google.com:5349",
          "stun:stun2.l.google.com:19302",
          "stun:stun2.l.google.com:5349",
          "stun:stun3.l.google.com:3478",
          "stun:stun3.l.google.com:5349",
          "stun:stun4.l.google.com:19302",
          "stun:stun4.l.google.com:5349",
        ],
      },
    ],
  });
  myPeerConnection.addEventListener("icecandidate", handleIce);
  myPeerConnection.addEventListener("track", handleTrack);
  myStream
    .getTracks()
    .forEach((track) => myPeerConnection.addTrack(track, myStream));
}

function handleIce(data) {
  console.log("send ice candidate");
  socket.emit("ice", data.canditate, roomName);
}

function handleTrack(event) {
  console.log("got an stream from my peer");
  const peerFace = document.getElementById("peerFace");
  peerFace.srcObject = event.streams[0];
}
