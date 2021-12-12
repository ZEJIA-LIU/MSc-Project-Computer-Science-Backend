const jwt = require("jsonwebtoken");

const secretPrivateKey = "SuperlinSuperCode"; // 加密的key

const createToken = (msg = {}, expire = 60 * 60) => {
	return jwt.sign({	msg }, secretPrivateKey, {
		expiresIn: expire
	});
};

const verifyToken = (token) => {
	let isValid;
	let msg = {};
	// 同步方法
	jwt.verify(token, secretPrivateKey, function(err, decode) {
	  if (err) {
	    isValid = false; // 时间失效的时候/伪造的token
	  } else {
	  	isValid = true;
	  	msg = decode.msg;
	  }
	});
	return {
		isValid,
		msg
	};
}

module.exports = {
	createToken,
	verifyToken
};