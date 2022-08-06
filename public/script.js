/*!
 *  ETC Classroom
 *  (c) 2022 Ruben Lima
 */

const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");

myVideo.muted = true;

let peer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "3333" || "443",
});
// const peer = new Peer(); // rmal

const peers = {};

let myVideoStream;

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    peer.on(
      "call",
      (call) => {
        call.answer(stream);
        const video = document.createElement("video");
        call.on("stream", (userVideoStream) => {
          addVideoStream(video, userVideoStream);
        });
      },
      (err) => {
        console.log("Failed to get local stream", err);
      }
    );

    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
    });
  });

socket.on("user-disconnected", (userId) => {
  if (peers[userId]) peers[userId].close();
});

peer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
});

const connectToNewUser = (userId, stream) => {
  const call = peer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });

  call.on("close", () => {
    video.remove();
  });

  peers[userId] = call; // extra rmal
};

const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
};

const verifyEndMessage = (e) => {
  let keyPressed = e.which || e.keyCode; //event.which || event.keyCode; // rmal update 2022/08/05
  let msgField = document.getElementById("chat__message");
  if (keyPressed == 13 && msgField.value !== "") {
    socket.emit("message", msgField.value);
    msgField.value = "";
    msgField.focus();
  }
};

socket.on("createMessage", (message, userId) => {
  let ul = document.getElementById("chat__all__messages");
  let li = document.createElement("li");
  li.innerHTML = "<b>User_" + userId.substring(0, 8) + "</b><br/>" + message;
  li.setAttribute("class", "message");
  ul.appendChild(li);

  scrollToBottom();
});

const scrollToBottom = () => {
  document
    .querySelector(".main__chat__window")
    .scrollTo(0, document.querySelector(".main__chat__window").scrollHeight);
};

const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
};

const setMuteButton = () => {
  const html = `
  <i class="fas fa-microphone"></i>
  <span>Mute</span>
  `;
  document.querySelector(".main__mute__button").innerHTML = html;
};

const setUnmuteButton = () => {
  const html = `
  <i class="unmute fas fa-microphone-slash"></i>
  <span>Unmute</span>
  `;
  document.querySelector(".main__mute__button").innerHTML = html;
};

const playStop = () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo();
  } else {
    setStopVideo();
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
};

const setPlayVideo = () => {
  const html = `
  <i class="stop fas fa-video-slash"></i>
  <span>Play Video</span>
  `;
  document.querySelector(".main__video__button").innerHTML = html;
};

const setStopVideo = () => {
  const html = `
  <i class="fas fa-video"></i>
  <span>Stop Video</span>
  `;
  document.querySelector(".main__video__button").innerHTML = html;
};
