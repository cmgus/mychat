(() => {
  mainContent.scrollTop = mainContent.srollHeight
})()
const socket = io()
let USERS = []
let talker = prompt()
const messages = document.getElementById('messages')

document.title = `Chat | ${talker}`

socket.emit('add user', talker)

socket.on('user joined', (data) =>
  addChatNotification(`${data.username} se ha conectado`)
)

socket.on('username exists', () => {
  talker = prompt('Username en uso. Intente de nuevo.')
  socket.emit('add user', talker)
  document.title = `Chat | ${talker}`
})

socket.on('send users', (users) => {
  USERS = users
  showUsers()
})

socket.on('new message', (data) => {
  addChatMessage(data)
})

socket.on('user left', (data) => {
  addChatNotification(`${data.username} se ha desconectado`)
})

socket.on('typing', (data) => {
  console.log(data)
  addChatFlash(data.username, 'está escribiendo')
})

socket.on('stop typing', (data) => {
  console.log(data)
  removeChatFlash(data.username)
})

socket.on('new message:image', (imageData) => {
  addChatImage(imageData)
})

message.addEventListener('focus', (e) => {
  socket.emit('typing', talker)
})
message.addEventListener('blur', (e) => {
  socket.emit('stop typing', talker)
})

const showUsers = () => {
  usersList.innerHTML = ''
  console.log(USERS.values())
  USERS.forEach((user) => {
    usersList.innerHTML += `
      <li class="list-group-item">${user.username} <span>${
      user.isOnline ? '🟢' : '🔴'
    }</span></li>
    `
  })
}
const addChatNotification = (notification) => {
  messages.innerHTML += `
    <div class="col-md-6 mb-3 text-lead text-center">
      <small class="text-muted">
        <i>${notification}</i>
      </small>
    </div>
  `
  scrollBottom()
}
const addChatFlash = (username, noti) => {
  messages.innerHTML += `
    <div id="flash-${username}" class="col-md-6 mb-3 text-lead text-center">
      <small id="flash-message" class="text-muted">
        <i>${username} ${noti}</i>
      </small>
    </div>
  `
  scrollBottom()
}
const removeChatFlash = (username) => {
  const flash = document.getElementById(`flash-${username}`)
  if (!flash) return
  flash.parentElement.removeChild(flash)
}
const addChatMessage = ({message, username}) => {
  const isMine = talker === username
  messages.innerHTML += `
    <div class="col-md-6 mb-3 text-${isMine ? 'end' : 'start'}">
      <span class="bg-${
        isMine ? 'primary' : 'secondary'
      } d-inline-block text-white py-1 px-2 rounded">
        <small class="d-block fw-bold">${username}</small>
        ${message}
      </span>
    </div>
  `
  scrollBottom()
}
const addChatImage = ({imageUrl, owner}) => {
  const isFromMe = talker === owner
  messages.innerHTML += `
  <div class="col-md-6 mb-3">
    <figure class="figure">
      <img class="figure-img img-fluid rounded" src="${imageUrl}" />
      <figcaption class="figure-caption text-${isFromMe ? 'end' : 'start'}">
        enviado por ${isFromMe ? 'tí' : owner}
      </figcaption>
    </figure>
  </div>
  `
  scrollBottom()
}

function send() {
  addChatMessage({
    username: talker,
    message: message.value,
  })
  socket.emit('new message', message.value)
  // message.value = ''
}

formSendFile.addEventListener('submit', async (e) => {
  e.preventDefault()
  const newFormData = new FormData(e.currentTarget)
  const result = await fetch('/fileupload', {
    method: 'POST',
    body: newFormData,
  })
  //console.log(await result.json());
  const imageData = {
    ...(await result.json()),
    owner: talker,
  }
  addChatImage(imageData)
  socket.emit('new message:image', imageData)
  scrollBottom()
})
async function sendFile() {
  await fetch('/fileupload', {
    method: 'POST',
  })
}

const scrollBottom = () => {
  mainContent.scrollTop = mainContent.scrollHeight
}

window.addEventListener('close', () => {
  socket.emit('disconnect', talker)
})
