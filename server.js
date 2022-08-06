/*!
 *  ETC Classroom
 *   (c) 2022 Ruben Lima
 */

const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { v4: uuidv4 } = require("uuid");
const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});

app.set("view engine", "ejs");
app.use(express.static("public"));
// app.use("/public", express.static("public")); // rmal

app.use("/peerjs", peerServer);
app.get("/", (request, response) => {
  response.redirect(`/${uuidv4()}`);
});

app.get("/:room", (request, response) => {
  response.render("room", { roomId: request.params.room });
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).broadcast.emit("user-connected", userId);

    socket.on("disconnect", () => {
      // socket.to(roomId).broadcast.emit('user-disconnected', userId);
      socket.to(roomId).emit("user-disconnected", userId); // rmal
    });

    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message, userId);
    });
  });
});

server.listen(process.env.PORT || 3333 || 443);
