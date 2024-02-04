import express from 'express'
import {Server} from 'socket.io'
import path from 'path'
import {fileURLToPath} from 'url'
import {IUser} from './types.ts'

interface IUsersState {
    users: IUser[]
    setUsers: (newUsersArray: IUser[]) => void
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = process.env.PORT || 3500
const ADMIN = 'Admin'

const app = express()

app.use(express.static(path.join(__dirname, 'public')))

const expressServer = app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`)
})

const UsersState: IUsersState = {
    users: [],
    setUsers: function (newUsersArray: IUser[]) {
        this.users = newUsersArray
    }
}

const io = new Server(expressServer, {
    cors: {
        origin: process.env.NODE_ENV === 'production'
            ? false
            : ['http://localhost:5500', 'http://localhost:63342']
    }
})

io.on('connection', socket => {
    console.log(`User ${socket.id} connected`)

    socket.emit('message', buildMsg(ADMIN, 'Welcome to Chat App!'))

    socket.on('enterRoom', ({name, room}) => {
        const prevRoom = getUser(socket.id)?.room

        if (prevRoom) {
            socket.leave(prevRoom)
            io.to(prevRoom).emit('message', buildMsg(ADMIN, `${name} has left the room`))
        }

        let color: string
        do {
            color = Math.floor(Math.random() * 16777215).toString(16)
        } while (getUsersInRoom(room).find(item => item.color === color))

        const user = activateUser(socket.id, name, room, color)

        if (prevRoom) {
            io.to(prevRoom).emit('userList', {
                users: getUsersInRoom(prevRoom)
            })
        }

        socket.join(user.room)

        socket.emit('message', buildMsg(ADMIN, `You have joined the ${user.room} chat room`))

        socket.broadcast.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} has joined the room`))

        io.to(user.room).emit('userList', {
            users: getUsersInRoom(user.room)
        })

        io.emit('roomsList', {
            rooms: getAllActiveRooms(),
            name: user.name,
            room: user.room
        })
    })

    socket.on('disconnect', () => {
        const user = getUser(socket.id)
        removeUser(socket.id)
        if (user) {
            io.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} has left the room`))
            io.to(user.room).emit('userList', {
                users: getUsersInRoom(user.room)
            })
            io.emit('roomList', {
                rooms: getAllActiveRooms(),
                name: user.name,
                room: user.room
            })
        }

        console.log(`User ${socket.id} disconnected`)
    })

    socket.on('message', ({name, text}) => {
        const user = getUser(socket.id)
        const room = user?.room
        const color = user?.color

        if (room) {
            io.to(room).emit('message', buildMsg(name, text, color))
        }
    })

    socket.on('activity', name => {
        const room = getUser(socket.id)?.room

        if (room) {
            socket.broadcast.to(room).emit('activity', name)
        }
    })
})

function buildMsg(name: string, text: string, color?: string) {
    return {
        name,
        text,
        color,
        time: new Intl.DateTimeFormat('default', {
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric'
        }).format(new Date())
    }
}

function activateUser(id: string, name: string, room: string, color: string) {
    const user = {id, name, room, color}
    UsersState.setUsers([
        ...UsersState.users.filter(user => user.id !== id),
        user
    ])
    return user
}

function removeUser(id: string) {
    UsersState.setUsers(UsersState.users.filter(user => user.id !== id))
}

function getUser(id: string) {
    return UsersState.users.find(user => user.id === id)
}

function getUsersInRoom(room: string) {
    return UsersState.users.filter(user => user.room === room)
}

function getAllActiveRooms() {
    return Array.from(new Set(UsersState.users.map(user => user.room)))
}