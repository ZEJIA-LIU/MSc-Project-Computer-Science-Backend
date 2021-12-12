const express = require('express');
const runCode = require('./runCode');

const router = express.Router();

router.post('/', async function (req, res) {

	const {
		code,
		language,
		stdin
	} = req.body;



	let result = await runCode(code, language, stdin);
	res.json(result);
})


module.exports = router;
