var _a, _b;
// @ts-ignore
const socket = io('ws://localhost:3500');
const msgInput = document.querySelector('#message');
const nameInput = document.querySelector('#name');
const chatRoom = document.querySelector('#room');
const activity = document.querySelector('.activity');
const userList = document.querySelector('.user-list');
const roomList = document.querySelector('.room-list');
const chatDisplay = document.querySelector('.chat-display');
let currentUserName = '';
function sendMessage(e) {
    e.preventDefault();
    if ((nameInput === null || nameInput === void 0 ? void 0 : nameInput.value) && (msgInput === null || msgInput === void 0 ? void 0 : msgInput.value) && (chatRoom === null || chatRoom === void 0 ? void 0 : chatRoom.value)) {
        socket.emit('message', {
            name: nameInput.value,
            text: msgInput.value
        });
        msgInput.value = '';
    }
    msgInput === null || msgInput === void 0 ? void 0 : msgInput.focus();
}
function enterRoom(e) {
    e.preventDefault();
    if ((nameInput === null || nameInput === void 0 ? void 0 : nameInput.value) && (chatRoom === null || chatRoom === void 0 ? void 0 : chatRoom.value)) {
        socket.emit('enterRoom', {
            name: nameInput.value,
            room: chatRoom.value
        });
        currentUserName = nameInput.value;
    }
}
(_a = document.querySelector('.form-msg')) === null || _a === void 0 ? void 0 : _a.addEventListener('submit', sendMessage);
(_b = document.querySelector('.form-join')) === null || _b === void 0 ? void 0 : _b.addEventListener('submit', enterRoom);
msgInput === null || msgInput === void 0 ? void 0 : msgInput.addEventListener('keypress', () => {
    socket.emit('activity', nameInput === null || nameInput === void 0 ? void 0 : nameInput.value);
});
socket.on('message', (data) => {
    activity && (activity.textContent = '');
    const { name, text, time, color } = data;
    const li = document.createElement('li');
    li.className = 'post';
    if (name === (nameInput === null || nameInput === void 0 ? void 0 : nameInput.value)) {
        li.className = 'post post--left';
    }
    else if (name !== 'Admin') {
        li.className = 'post post--right';
    }
    if (name === 'Admin') {
        li.innerHTML = `
            <div class="post__text">${text}</div>
        `;
    }
    else {
        li.innerHTML = `
            <div 
              class="post__header"
              style="background-color: #${color}"
            >
                <span class="post__header--name">${name}</span>
                <span class="post__header--time">${time}</span>
            </div>
            <div class="post__text">${text}</div>
        `;
    }
    if (chatDisplay) {
        chatDisplay.appendChild(li);
        chatDisplay.scrollTop = chatDisplay.scrollHeight;
    }
});
let activityTimer;
socket.on('activity', (name) => {
    activity && (activity.textContent = `${name} is typing...`);
    clearTimeout(activityTimer);
    activityTimer = setTimeout(() => {
        activity && (activity.textContent = '');
    }, 1000);
});
socket.on('userList', ({ users }) => {
    showUsers(users);
});
socket.on('roomsList', ({ rooms, name, room }) => {
    showRooms(rooms, name, room);
    document
        .querySelectorAll('.room-button')
        .forEach(item => {
        item.addEventListener('click', () => {
            item.textContent && enterActiveRoom(item.textContent);
        });
    });
});
function showUsers(users) {
    userList && (userList.textContent = '');
    if (users && userList && chatRoom) {
        userList.innerHTML = `<em>Users in ${chatRoom.value}:</em>`;
        users.forEach((user, i) => {
            userList.textContent += ` ${user.name}`;
            if (users.length > 1 && i !== users.length - 1) {
                userList.textContent += ',';
            }
        });
    }
}
function showRooms(rooms, name, currentRoom) {
    roomList && (roomList.innerHTML = '');
    if (rooms && roomList && chatRoom) {
        roomList.innerHTML = `<em>Active rooms:</em>`;
        rooms.forEach((room, i) => {
            roomList.innerHTML += room === currentRoom
                ? ` ${room}`
                : ` <button class="room-button">${room}</button>`;
            if (rooms.length > 1 && i !== rooms.length - 1) {
                roomList.innerHTML += ',';
            }
        });
    }
}
function enterActiveRoom(room) {
    socket.emit('enterRoom', {
        name: currentUserName,
        room
    });
}
export {};
