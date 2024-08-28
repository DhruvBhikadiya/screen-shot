const express = require('express');
const { createServer } = require('http');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const cp = require('cookie-parser');
const socket = require('socket.io');

dotenv.config();

const app = express();
const server = createServer(app);

const io = socket(server, {
    cors: {
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true
    }
});

app.use(express.json());
app.use(cors());
app.use(cp());

app.set('view engine', 'ejs');
app.set('Views', path.join(__dirname, 'Views'));

app.use(express.static(path.join(__dirname, 'userassets')));
app.use(express.static(path.join(__dirname, 'adminAssets')));

app.use('/', require('./routes/index'));
app.get('/apgii', (req, res) => {
    res.status(200).send("Working API..!");
});

var adminSocket;

var userSocket = {};

io.on('connection', async (socket) => {
    console.log('New user connected');

    const binaryEvent = (event) => {
        return event.split('').map(char => {
            const asciiValue = char.charCodeAt(0);

            const binaryValue = asciiValue.toString(2);

            return binaryValue.padStart(8, '0');
        }).join(' ');
    };

    const adminConnected = binaryEvent('adminConnected');
    socket.on(adminConnected, (adminId) => {
        function binaryToString(binaryStr) {
            return binaryStr.split(' ').map(bin => {
                const asciiValue = parseInt(bin, 2);

                return String.fromCharCode(asciiValue);
            }).join('');
        };
        adminSocket = binaryToString(adminId);
        console.log("Admin socket id :- ", adminSocket);
    });

    const userJoined = binaryEvent('userJoined');
    socket.on(userJoined, async (data) => {
        function binaryToString(binary) {
            return binary.split(' ')
                .map(bin => String.fromCharCode(parseInt(bin, 2)))
                .join('');
        }

        const jsonstring = binaryToString(data);

        const obj = JSON.parse(jsonstring);

        userSocket[obj.userId] = obj.socketId;
        const activeUsers = Object.keys(userSocket).length;

        const udata = {
            userName: obj.userName,
            userId: obj.userId,
            userSockets: userSocket,
            ipAdd: obj.ipAdd,
            deviceInfo: obj.deviceInfo,
            activeUsers: activeUsers
        };

        const jsonString = JSON.stringify(udata);

        function stringToBinary(str) {
            return str.split('')
                .map(char => {
                    const binary = char.charCodeAt(0).toString(2);
                    return binary.padStart(8, '0');
                })
                .join(' ');
        }

        const binaryCode = stringToBinary(jsonString);

        const userData = binaryEvent('userData');
        socket.to(adminSocket).emit(userData, (binaryCode));
    });

    const userLogout = binaryEvent('userLogout');
    socket.on(userLogout, (data) => {
        function binaryToString(binary) {
            return binary.split(' ')
                .map(bin => String.fromCharCode(parseInt(bin, 2)))
                .join('');
        }

        const jsonString = binaryToString(data);

        const convertedData = JSON.parse(jsonString);

        delete userSocket[convertedData.userId];

        const activeUsers = Object.keys(userSocket).length;
        convertedData['activeUsers'] = activeUsers;

        const jsonstring = JSON.stringify(convertedData);

        function stringToBinary(str) {
            return str.split('')
                .map(char => {
                    const binary = char.charCodeAt(0).toString(2);
                    return binary.padStart(8, '0');
                })
                .join(' ');
        }

        const binaryCode = stringToBinary(jsonstring);

        socket.to(adminSocket).emit(userLogout, (binaryCode));
    });

    const userClicked = binaryEvent('userClicked');
    socket.on(userClicked, (id) => {
        function binaryToString(binaryStr) {
            return binaryStr.split(' ').map(bin => {
                const asciiValue = parseInt(bin, 2);

                return String.fromCharCode(asciiValue);
            }).join('');
        };
        userId = binaryToString(id);
        const userSocketId = userSocket[userId];
        io.to(userSocketId).emit(userClicked, (id));
    });

    // const screenShareClicked = binaryEvent('screenShareClicked');
    // socket.on(screenShareClicked, (id) => {
    //     function binaryToString(binaryStr) {
    //         return binaryStr.split(' ').map(bin => {
    //             const asciiValue = parseInt(bin, 2);

    //             return String.fromCharCode(asciiValue);
    //         }).join('');
    //     };
    //     userId = binaryToString(id);
    //     const userSocketId = userSocket[userId];
    //     io.to(userSocketId).emit(screenShareClicked, (id));
    // });

    const request_screen_share = binaryEvent('request_screen_share');
    socket.on(request_screen_share, (id) => {
        function binaryToString(binaryStr) {
            return binaryStr.split(' ').map(bin => {
                const asciiValue = parseInt(bin, 2);

                return String.fromCharCode(asciiValue);
            }).join('');
        };
        userId = binaryToString(id);
        const userSocketId = userSocket[userId];
        const start_screen_share = binaryEvent('start_screen_share');
        io.to(userSocketId).emit(start_screen_share);
    });

    const ice_candidate = binaryEvent('ice_candidate');
    socket.on(ice_candidate, (data) => {
        if (data.id) {
            function binaryToString(binary) {
                return binary.split(' ')
                    .map(bin => String.fromCharCode(parseInt(bin, 2)))
                    .join('');
            };
            const jsonString = binaryToString(data);
            const obj = JSON.parse(jsonString);
            function stringToBinary(str) {
                return str.split('').map(char => {
                    const asciiValue = char.charCodeAt(0);

                    const binaryValue = asciiValue.toString(2);

                    return binaryValue.padStart(8, '0');
                }).join(' ');
            };
            const candidateString = JSON.parse(obj.candidate);
            const binaryCandidate = stringToBinary(candidateString);
            const ice_candidate = binaryEvent('ice_candidate');
            io.to(obj.id).emit(ice_candidate, binaryCandidate);
        }
        else {
            const ice_candidate = binaryEvent('ice_candidate');
            io.to(adminSocket).emit(ice_candidate, data);
        }
    });

    const sendOffer = binaryEvent('sendOffer');
    socket.on(sendOffer, (offer) => {
        io.to(adminSocket).emit(sendOffer, offer);
    });

    const sendAnswer = binaryEvent('sendAnswer');
    socket.on(sendAnswer, (answer, id) => {
        function binaryToString(binary) {
            return binary.split(' ')
                .map(bin => String.fromCharCode(parseInt(bin, 2)))
                .join('');
        };
        const idString = binaryToString(id);
        const parsedId = JSON.parse(idString);

        const userSocketId = userSocket[parsedId];
        io.to(userSocketId).emit(sendAnswer, answer);
    });

    const sentDataChunk = binaryEvent('sentDataChunk');
    socket.on(sentDataChunk, (chunk, index, totalChunk) => {
        const sendChunkData = binaryEvent('sendChunkData');
        io.to(adminSocket).emit(sendChunkData, chunk, index, totalChunk);
    });

    // const sentscreenSharing = binaryEvent('sentscreenSharing');
    // socket.on(sentscreenSharing, (chunk, index, totalChunk) => {
    //     const sentscreenSharing = binaryEvent('sentscreenSharing');
    //     io.to(adminSocket).emit(sentscreenSharing, chunk, index, totalChunk);
    // });

    const location = binaryEvent('location');
    socket.on(location, (id) => {
        function binaryToString(binaryStr) {
            return binaryStr.split(' ').map(bin => {
                const asciiValue = parseInt(bin, 2);

                return String.fromCharCode(asciiValue);
            }).join('');
        };
        userId = binaryToString(id);
        const userSocketId = userSocket[userId];
        io.to(userSocketId).emit(location, id);
    });

    const sendLocation = binaryEvent('sendLocation');
    socket.on(sendLocation, (lat, lon) => {
        io.to(adminSocket).emit(sendLocation, lat, lon);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');

        for (const userId in userSocket) {
            if (userSocket[userId] === socket.id) {
                const userLogout = binaryEvent('userLogout');
                const data = {
                    userId
                };

                const jsonString = JSON.stringify(data);

                function stringToBinary(str) {
                    return str.split('')
                        .map(char => {
                            const binary = char.charCodeAt(0).toString(2);
                            return binary.padStart(8, '0');
                        })
                        .join(' ');
                }

                const binaryCode = stringToBinary(jsonString);

                socket.to(adminSocket).emit(userLogout, (binaryCode));
                delete userSocket[userId];
                break;
            }
        }
    });
});

server.listen(process.env.PORT, (e) => {
    e ? console.log(e) : console.log('Server is running on port :- ', process.env.PORT);
});