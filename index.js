const express = require('express')
const app = express()
const http = require('http').Server(app)
const {join} = require('path')
const io = require('socket.io')(http)
const formidable = require('formidable')

const USERS = []

app.use(express.static(join(__dirname, 'public')))

io.on('connection', (socket) => {
  socket.on('new message', (data) => {
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data,
    })
  })
  socket.on('add user', (username) => {
    if (USERS.find((user) => user.username === username)) {
      return socket.emit('username exists')
    }
    USERS.push({
      username,
      isOnline: true,
    })
    socket.username = username
    socket.broadcast.emit('user joined', {
      username: socket.username,
    })
    io.emit('send users', USERS)
  })

  socket.on('typing', () => {
    socket.broadcast.emit('typing', {
      username: socket.username,
    })
  })
  socket.on('stop typing', () => {
    socket.broadcast.emit('stop typing', {
      username: socket.username,
    })
  })
  socket.on('new message:image', (imageData) => {
    socket.broadcast.emit('new message:image', imageData)
  })
  socket.on('disconnect', () => {
    socket.broadcast.emit('user left', {
      username: socket.username,
    })
    const indexUser = USERS.findIndex(
      (user) => user.username === socket.username
    )
    USERS.splice(indexUser, 1, {username: socket.username, isOnline: false})
    io.emit('send users', USERS)
  })
})

app.post('/fileupload', (req, res) => {
  var form = formidable({
    uploadDir: join(__dirname, 'public', 'uploads'),
    keepExtensions: true,
  })
  form.parse(req, (err, fields, files) => {
    res.json({
      imageUrl: `/uploads/${files.filetoupload.path.split('\\').reverse()[0]}`,
    })
  })
})

http.listen(5000, () => {
  console.log(`> Server on 5000`)
})
