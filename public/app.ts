import {IMessage, IUser} from '../types.ts'

// @ts-ignore
const socket = io('ws://localhost:3500')

const msgInput: HTMLInputElement | null = document.querySelector('#message')
const nameInput: HTMLInputElement | null = document.querySelector('#name')
const chatRoom: HTMLInputElement | null = document.querySelector('#room')

const activity = document.querySelector('.activity')
const userList = document.querySelector('.user-list')
const roomList = document.querySelector('.room-list')
const chatDisplay = document.querySelector('.chat-display')

let currentUserName = ''

function sendMessage(e: Event) {
    e.preventDefault()

    if (nameInput?.value && msgInput?.value && chatRoom?.value) {
        socket.emit('message', {
            name: nameInput.value,
            text: msgInput.value
        })
        msgInput.value = ''
    }
    msgInput?.focus()
}

function enterRoom(e: Event) {
    e.preventDefault()
    if (nameInput?.value && chatRoom?.value) {
        socket.emit('enterRoom', {
            name: nameInput.value,
            room: chatRoom.value
        })
        currentUserName = nameInput.value
    }
}

document.querySelector('.form-msg')?.addEventListener('submit', sendMessage)
document.querySelector('.form-join')?.addEventListener('submit', enterRoom)
msgInput?.addEventListener('keypress', () => {
    socket.emit('activity', nameInput?.value)
})

socket.on('message', (data: IMessage) => {
    activity && (activity.textContent = '')
    const {name, text, time, color} = data
    const li = document.createElement('li')
    li.className = 'post'
    if (name === nameInput?.value) {
        li.className = 'post post--left'
    } else if (name !== 'Admin') {
        li.className = 'post post--right'
    }

    if (name === 'Admin') {
        li.innerHTML = `
            <div class="post__text">${text}</div>
        `
    } else {
        li.innerHTML = `
            <div 
              class="post__header"
              style="background-color: #${color}"
            >
                <span class="post__header--name">${name}</span>
                <span class="post__header--time">${time}</span>
            </div>
            <div class="post__text">${text}</div>
        `
    }

    if (chatDisplay) {
        chatDisplay.appendChild(li)

        chatDisplay.scrollTop = chatDisplay.scrollHeight
    }
})

let activityTimer: ReturnType<typeof setTimeout>

socket.on('activity', (name: string) => {
    activity && (activity.textContent = `${name} is typing...`)

    clearTimeout(activityTimer)
    activityTimer = setTimeout(() => {
        activity && (activity.textContent = '')
    }, 1000)
})

socket.on('userList', ({users}: {users: IUser[]}) => {
    showUsers(users)
})

socket.on('roomsList', ({rooms, name, room}: {rooms: string[], name: string, room: string}) => {
    showRooms(rooms, name, room)

    document
        .querySelectorAll('.room-button')
        .forEach(item => {
            item.addEventListener('click', () => {
                item.textContent && enterActiveRoom(item.textContent)
            })
        })
})

function showUsers(users: IUser[]) {
    userList && (userList.textContent = '')
    if (users && userList && chatRoom) {
        userList.innerHTML = `<em>Users in ${chatRoom.value}:</em>`
        users.forEach((user, i) => {
            userList.textContent += ` ${user.name}`
            if (users.length > 1 && i !== users.length - 1) {
                userList.textContent += ','
            }
        })
    }
}

function showRooms(rooms: string[], name: string, currentRoom: string) {
    roomList && (roomList.innerHTML = '')
    if (rooms && roomList && chatRoom) {
        roomList.innerHTML = `<em>Active rooms:</em>`
        rooms.forEach((room, i) => {
            roomList.innerHTML += room === currentRoom
                ? ` ${room}`
                : ` <button class="room-button">${room}</button>`
            if (rooms.length > 1 && i !== rooms.length - 1) {
                roomList.innerHTML += ','
            }
        })
    }
}

function enterActiveRoom(room: string) {
    socket.emit('enterRoom', {
        name: currentUserName,
        room
    })
}
