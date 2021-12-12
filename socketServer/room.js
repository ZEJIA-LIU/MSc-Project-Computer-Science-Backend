const random = require('string-random');
const runCode = require('../apiServer/runCode');

let roomList = {};
let socketList = {};

const defaultCode = `#include <stdio.h>

int main()
{
	// your code goes here
	return 0;
}`;

function roomBroadcast(socketList, eventName, data = {}) {
	for (let socket of socketList) {
		socket.emit(eventName, data);
	}
}

function roomBroadcastOther(curUserId, socketList, eventName, data = {}) {
	for (let socket of socketList) {
		if (socket.userId != curUserId) socket.emit(eventName, data);
	}
}

function createRoomServer(server) {
	let io = require('socket.io')(server);

	io.on('connection', function (socket) {
		socket.on('create room', function (data) {
			let { userId, nickname, avatar } = data;
			let roomId = random(7);
			// 防止重复
			while (roomId in roomList) {
				roomId = random(7);
			}

			let user = {
				userId,
				nickname,
				avatar
			};

			let userList = {
				[userId]: user
			};
			let userListArr = [user];

			let roomInfo = {
				roomId,
				userList,
				userListArr,
				userCount: 1,
				editorCode: defaultCode,
				editorUser: null,
				msgList: [],
				editorStatus: {
					language: 'C',
					editorMode: 'text/x-csrc',
					// editorMode: 'text/x-c++src',
					activePanel: '1',
					isRunning: false,
					stdin: '',
					runResult: null
				}
			};

			socketList[roomId] = [socket];

			roomList[roomId] = roomInfo;

			socket.emit('create room result', {
				status: 0,
				msg: '创建成功',
				data: {
					roomInfo
				}
			});

			socket.roomId = roomId;
			socket.userId = userId;
			socket.userInfo = user;
		});

		socket.on('enter room', function (data) {
			let { roomId, userId, nickname, avatar } = data;

			// console.log(roomId, roomList);
			if (!(roomId in roomList)) {
				socket.emit('enter room result', {
					status: 1,
					msg: '房间ID不存在'
				});
				return;
			}

			let user = { userId, nickname, avatar };
			let room = roomList[roomId];

			room.userList[userId] = user;
			room.userListArr.push(user);
			socketList[roomId].push(socket);

			room.userCount++;

			socket.emit('enter room result', {
				status: 0,
				msg: '进入成功',
				data: {
					roomInfo: room
				}
			});

			socket.roomId = roomId;
			socket.userId = userId;
			socket.userInfo = user;

			// socket.broadcast.emit('user enter', {
			// 	userList: room.userList,
			// 	userListArr: room.userListArr
			// });
			roomBroadcastOther(userId, socketList[roomId], 'user enter', {
				userList: room.userList,
				userListArr: room.userListArr
			});
		});

		socket.on('get editor', function () {
			let { roomId, userInfo } = socket;
			let room = roomList[roomId];
			// console.log(undefined.a);
			if (!room.editorUser) {
				room.editorUser = userInfo;
				// io.emit('user got editor', editorUser);
				roomBroadcast(socketList[roomId], 'user got editor', userInfo);
			}
		});

		socket.on('release editor', function () {
			let { roomId } = socket;
			let room = roomList[roomId];
			room.editorUser = null;
			// io.emit('user released editor');
			roomBroadcast(socketList[roomId], 'user released editor');
		});

		socket.on('update code', function (data) {
			let { code } = data;
			let { roomId, userId } = socket;
			let room = roomList[roomId];
			if (userId === room.editorUser.userId) {
				room.editorCode = code;
				// socket.broadcast.emit('code updated', {
				// 	code
				// });
				roomBroadcastOther(userId, socketList[roomId], 'code updated', {
					code
				});
			}
		});

		socket.on('send msg', function (data) {
			let { content } = data;
			let { roomId, userInfo } = socket;
			let msg = { userInfo, content };
			let { msgList } = roomList[roomId];

			msgList.push(msg);
			// io.emit('got msg', msgList);
			roomBroadcast(socketList[roomId], 'got msg', msgList);
		});

		async function run() {
			console.log('runhere')
			let { roomId } = socket;
			let room = roomList[roomId];
			let { editorCode, editorStatus: { language, stdin } } = room;
			// console.log('start run')
			try {
				let result = await runCode(editorCode, language, stdin);
				console.log('res' + result)
				room.editorStatus.isRunning = false;
				// io.emit('got run result', result);
				roomBroadcast(socketList[roomId], 'got run result', result);
			}
			catch (error) {
				console.log('出错了')
				console.log(error)
			}

		}

		socket.on('update editorStatus', function (data) {
			let { updateStatus } = data;
			let { roomId, userId } = socket;

			if (updateStatus.isRunning) {
				run();
				updateStatus.activePanel = '2';
			}
			Object.assign(roomList[roomId].editorStatus, updateStatus);

			// socket.broadcast.emit('editorStatus updated', updateStatus);
			roomBroadcastOther(
				userId,
				socketList[roomId],
				'editorStatus updated',
				updateStatus
			);
		});

		const exitCallback = function () {
			let { roomId, userId } = socket;
			if (!(roomId in roomList)) {
				return;
			}
			let room = roomList[roomId];
			if (!(userId in room.userList)) {
				return;
			}

			let { userList, userListArr, editorUser } = room;
			delete userList[userId];
			for (let [index, user] of userListArr.entries()) {
				if (user.userId == userId) {
					userListArr.splice(index, 1);
					break;
				}
			}
			let socketListRoom = socketList[roomId];
			for (let [index, socket] of socketListRoom.entries()) {
				if (socket.userId == userId) {
					socketListRoom.splice(index, 1);
					break;
				}
			}
			room.userCount--;
			if (editorUser && editorUser.userId == userId) {
				room.editorUser = null;
				roomBroadcast(socketList[roomId], 'user released editor');
			}

			if (room.userCount < 1) {
				delete roomList[roomId];
				delete socketList[roomId];
				return;
			}
			// socket.broadcast.emit('user exit', {
			// 	userList,
			// 	userListArr
			// });
			roomBroadcastOther(userId, socketList[roomId], 'user exit', {
				userList,
				userListArr
			});
		};

		socket.on('exit room', exitCallback);

		socket.on('disconnect', exitCallback);
	});
}


module.exports = createRoomServer;