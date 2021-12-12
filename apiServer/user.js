const express = require('express');
const crypto = require('crypto');
const random = require('string-random');
const fs = require('fs');
const router = express.Router();
const db = require('./util/db');
const { createMailCode, sendMailCode } = require('./util/mailCode');
const { createToken, verifyToken } = require('./util/token');

const imgAddress = 'http://162.62.132.104:8080/avatar/';

router.post('/verifyToken', async function (req, res) {
	const {
		token
	} = req.body;

	if (!token) {
		res.json(new Result({ code: 1, desc: 'token cannot be empty' }));
		return;
	}

	let { isValid, msg } = verifyToken(token);

	if (!isValid) {
		res.json(new Result({ data: { status: 1, msg: 'Invalid or expired token' } }));
		return;
	}

	let { userId } = msg;
	let userInfo;
	try {
		userInfo = await getUserInfo(userId, ['nickname', 'avatar']);
		userInfo.avatar = imgAddress + userInfo.avatar;
		res.json(new Result({
			data: {
				status: 0, msg: 'token有效', userInfo: {
					...userInfo,
					userId
				}
			}
		}));
	} catch (err) {
		res.json(new Result({ code: 3, desc: 'Failed to get user information' }));
	}
});

router.post('/login', async function (req, res) {
	const {
		username,
		password
	} = req.body;

	if (!username || !password) {
		res.json(new Result({ code: 1, desc: 'Username and password cannot be empty' }));
		return;
	}

	let md5Pwd = getMd5(password);

	let checkLogin = `SELECT * FROM user WHERE (email = '${username}' or phone = '${username}') and password = '${md5Pwd}'`;
	let checkLoginResult;
	try {
		checkLoginResult = await db.query(checkLogin);
	} catch (err) {
		res.json(new Result({ code: 3, desc: 'Error checking username and password' }));
		return;
	}

	if (checkLoginResult.length > 0) {
		// 生成3天有效期token
		let token = createToken({ userId: checkLoginResult[0]['user_id'] }, 60 * 60 * 24 * 3);
		res.json(new Result({ data: { status: 0, msg: 'Login successful', token } }));
	} else {
		res.json(new Result({ data: { status: 1, msg: 'Incorrect username or password' } }));
	}
});

router.post('/getMailCode', async function (req, res) {
	const {
		email
	} = req.body;

	if (!email) {
		res.json(new Result({ code: 1, desc: 'Mailbox cannot be empty' }));
		return;
	}

	// 是否已存在邮箱
	let checkEmail = `SELECT * FROM user WHERE email = '${email}'`;
	let checkEmailResult;
	try {

		checkEmailResult = await db.query(checkEmail);
	} catch (err) {

		res.json(new Result({ code: 3, desc: 'Error checking mailbox' }));
		return;
	}
	if (checkEmailResult.length > 0) {
		res.json(new Result({ data: { status: 1, msg: 'Mailbox already exists' } }));
		return;
	}

	// 是否已获取过验证码
	let checkGotCode = `SELECT * FROM inactive_user WHERE email = '${email}'`;
	let checkGotCodeResult;
	try {
		checkGotCodeResult = await db.query(checkGotCode);
	} catch (err) {
		// console.log(2)
		res.json(new Result({ code: 3, desc: 'Error when check if you have got the captcha' }))
		return;
	}

	// 1分钟内重复获取
	if (checkGotCodeResult.length > 0
		&& (+checkGotCodeResult[0]['expire_time']) - (+new Date()) > 1000 * 60 * 4) {
		// console.log((+checkGotCodeResult[0]['expire_time']) - (+new Date()));
		res.json(new Result({ data: { status: 2, msg: 'No repeat access within one minute' } }));
		return;
	}

	// 更新未激活用户表
	let mailCode = createMailCode();
	let expireTime = +new Date() + 1000 * 60 * 5; // 过期时间5分钟
	let modifiedInactiveUser;
	// console.log(checkGotCodeResult[0]['expire_time']);
	if (checkGotCodeResult.length > 0) {
		// 更新验证码和过期时间
		modifiedInactiveUser = `UPDATE inactive_user SET code = '${mailCode}', expire_time = '${expireTime}' WHERE inactive_user.email = '${email}'`;
	} else {
		// 插入新记录
		modifiedInactiveUser = `INSERT INTO inactive_user (email, code, expire_time) VALUES ('${email}', '${mailCode}', '${expireTime}')`
	}
	let modifiedInactiveUserResult;
	try {
		// console.log(modifiedInactiveUser);
		modifiedInactiveUserResult = await db.query(modifiedInactiveUser);
	} catch (err) {
		res.json(new Result({ code: 3, desc: 'Error getting captcha' }))
		return;
	}
	// console.log(modifiedInactiveUserResult);
	if (modifiedInactiveUserResult.affectedRows < 1) {
		res.json(new Result({ code: 3, desc: 'Error getting captcha' }))
		return;
	}

	// 发送验证码
	try {
		console.log(email, mailCode)
		let result = await sendMailCode(email, mailCode);
		if (result.success) {
			res.json(new Result({ data: { status: 0, msg: 'Send email verification code successfully' } }))
		}
	} catch (err) {
		// 未发成功也会存数据库里了
		console.log(err)
		res.json(new Result({ code: 3, desc: 'Error sending email verification code, please check email format' }))
	}
});

router.post('/register', async function (req, res) {
	const {
		email,
		mailCode,
		password,
		nickname
	} = req.body;

	if (!email || !mailCode || !password || !nickname) {
		console.log(email, mailCode, password, nickname);
		res.json(new Result({ code: 1, desc: 'Email/Verify Code/Password/Nickname cannot be empty' }));
		return;
	}

	// 是否已存在邮箱
	let checkEmail = `SELECT * FROM user WHERE email = '${email}'`;
	let checkEmailResult;
	try {
		checkEmailResult = await db.query(checkEmail);
	} catch (err) {
		res.json(new Result({ code: 3, desc: 'Error checking mailbox' }));
		return;
	}
	if (checkEmailResult.length > 0) {
		res.json(new Result({ data: { status: 1, msg: 'Mailbox already exists' } }));
		return;
	}

	// 检验邮箱验证码
	let checkMailCode = `SELECT * FROM inactive_user WHERE email = '${email}' and code = '${mailCode}'`;
	let checkMailCodeResult;
	try {
		console.log(checkMailCode);
		checkMailCodeResult = await db.query(checkMailCode);
	} catch (err) {
		res.json(new Result({ code: 3, desc: 'Error checking email verification code' }));
		return;
	}
	if (checkMailCodeResult.length > 0) {
		if ((+new Date()) > (+checkMailCodeResult[0]['expire_time'])) {
			res.json(new Result({ data: { status: 3, msg: 'Captcha has expired' } }));
			return;
		}
	} else {
		res.json(new Result({ data: { status: 2, msg: 'Incorrect captcha' } }));
		return;
	}

	// 检查昵称
	if (nickname.length > 10) {
		res.json(new Result({ data: { status: 4, msg: 'Nicknames must not exceed 10 digits in length' } }));
		return;
	}
	let checkNickname = `SELECT * FROM user WHERE nickname = '${nickname}'`;
	let checkNicknameResult;
	try {
		checkNicknameResult = await db.query(checkNickname);
	} catch (err) {
		res.json(new Result({ code: 3, desc: 'Error checking nickname' }));
		return;
	}
	if (checkNicknameResult.length > 0) {
		res.json(new Result({ data: { status: 5, msg: 'Nickname already exists' } }));
		return;
	}

	// 生成唯一user_id
	let userId = random(7);
	let isExistedUserId = true;
	while (isExistedUserId) {
		try {
			let checkUserIdResult = await db.query(`SELECT * FROM user WHERE user_id = '${userId}'`);
			if (checkUserIdResult.length == 0) {
				isExistedUserId = false;
			} else {
				userId = random(7);
			}
		} catch (err) {
			res.json(new Result({ code: 3, desc: 'Error checking userId' }));
			return;
		}
	}

	// 生成md5密码
	let md5Pwd = getMd5(password);

	// 新增用户
	let addUser = `INSERT INTO user (user_id, password, nickname, email) VALUES ('${userId}', '${md5Pwd}', '${nickname}', '${email}')`;
	let addUserResult;
	try {
		addUserResult = await db.query(addUser);
	} catch (err) {
		res.json(new Result({ code: 3, desc: 'Failed to add a user' }))
		return;
	}
	if (addUserResult.affectedRows < 1) {
		res.json(new Result({ code: 3, desc: 'Failed to add a user' }))
	} else {
		res.json(new Result({ data: { status: 0, msg: 'Registration successful' } }));
	}
});

router.post('/avatar', async function (req, res) {
	const {
		userId,
		imgData
	} = req.body;

	let imgType = imgData.match(/(?<=^data:image\/)\w+(?=;base64,)/)[0];
	let imgName = random(10) + '.' + imgType;
	let path = './avatar/' + imgName;

	try {
		await savaImg(imgData, path);
	} catch (err) {
		res.json(new Result({ code: 3, desc: 'Failed to save image' }))
	}

	// 删掉原来的图片

	let updateAvatar = `UPDATE user SET avatar = '${imgName}' WHERE user_id = '${userId}'`;
	let updateAvatarResult;
	try {
		updateAvatarResult = await db.query(updateAvatar);
		if (updateAvatarResult.affectedRows < 1) {
			res.json(new Result({ code: 3, desc: 'Failed to save image' }))
		} else {
			res.json(new Result({ data: { status: 0, msg: 'Save successfully' } }));
		}
	} catch (err) {
		res.json(new Result({ code: 3, desc: 'Failed to save image' }))
	}
});

function getUserInfo(userId, keys) {
	return new Promise((res, rej) => {
		db.query(`SELECT ${keys.join(', ')} FROM user WHERE user_id = '${userId}'`)
			.then(rows => {
				if (rows.length > 0) {
					res(rows[0]);
				} else {
					rej(new Error('not find user'));
				}
			}, err => rej(err));
	});
}

function changeUserInfo(userId, key, value) {
	return new Promise((res, rej) => {
		db.query(`UPDATE user SET ${key} = '${value}' WHERE user_id = '${userId}'`)
			.then(result => {
				if (result.affectedRows > 0) {
					res();
				} else {
					rej(new Error('not find user'));
				}
			}, err => rej(err));
	});
}

router.post('/info', async function (req, res) {
	const {
		userId
	} = req.body;

	if (isEmpty(userId)) {
		res.json(new Result({ code: 1, desc: '请求字段不能为空' }));
		return;
	}

	try {
		let userInfo = await getUserInfo(userId, ['nickname', 'avatar', 'sex', 'introduce', 'email']);
		userInfo.avatar = imgAddress + userInfo.avatar;
		res.json(new Result({ data: { status: 0, msg: '获取成功', userInfo } }));
	} catch (err) {
		res.json(new Result({ code: 3, desc: err.message }));
	}
});

router.post('/info/change', async function (req, res) {
	const {
		userId,
		infoName,
		value
	} = req.body;

	if (isEmpty(userId, infoName, value)) {
		res.json(new Result({ code: 1, desc: '请求字段不能为空' }));
		return;
	}

	if (infoName == 'userId' || infoName == 'password' || infoName == 'email') {
		res.json(new Result({ code: 1, desc: '不允许修改的字段' }));
		return;
	}

	try {
		await changeUserInfo(userId, infoName, value);
		res.json(new Result({ data: { status: 0, msg: '修改成功' } }));
	} catch (err) {
		res.json(new Result({ code: 3, desc: err.message }));
	}
});

router.post('/pwd', async function (req, res) {
	const {
		userId,
		oldPwd,
		newPwd
	} = req.body;

	if (isEmpty(userId, oldPwd, newPwd)) {
		res.json(new Result({ code: 1, desc: '请求字段不能为空' }));
		return;
	}

	let md5OldPwd = getMd5(oldPwd);

	try {
		let curPwd = await getUserInfo(userId, ['password']);
		if (curPwd['password'] != md5OldPwd) {
			res.json(new Result({ data: { status: 1, msg: 'Original password error' } }));
			return;
		}
	} catch (err) {
		res.json(new Result({ code: 3, desc: err.message }));
	}

	let md5NewPwd = getMd5(newPwd);

	try {
		await changeUserInfo(userId, 'password', md5NewPwd);
		res.json(new Result({ data: { status: 0, msg: 'Change successfully' } }));
	} catch (err) {
		res.json(new Result({ code: 3, desc: err.message }));
	}
});

function savaImg(imgData, path) {
	return new Promise((res, rej) => {
		//过滤data:URL
		let base64Data = imgData.replace(/^data:image\/\w+;base64,/, "");
		let dataBuffer = new Buffer(base64Data, 'base64');
		fs.writeFile(path, dataBuffer, function (err) {
			if (err) {
				rej(err);
			} else {
				res();
			}
		});
	});
}

function getMd5(str) {
	return crypto.createHash('md5').update(str).digest("hex");
}

function isEmpty(...values) {
	for (const value of values) {
		if (value === undefined || value === null) return true;
	}
	return false;
}

function Result({ code = 0, desc = '', data = {} }) {
	Object.assign(this, {
		code,
		desc,
		data
	});
}

module.exports = router;