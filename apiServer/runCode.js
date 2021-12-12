const fs = require('fs');
const exec = require('child_process').exec;
const { codeFilePath } = require('../config/config');
const { runLanguageToCmd, compileMapLanguageToCmd, fileTypes } = require('./constant')

async function runCode(code, language, stdin) {
	const fileType = fileTypes[language];
	const dirName = +new Date() + '' + Math.floor((Math.random() * 10000) + 1);
	const hasStdin = (!!stdin);

	try {
		// Create temporary directory
		const rs1 = await createDir('./CodeFile/' + dirName);
		console.log(rs1);

		// write code
		const rs2 = await createFile('./CodeFile/' + dirName + '/app' + fileType, code);
		console.log(rs2);

		// Compile
		await compile(language, dirName);

		// Write to input files
		if (hasStdin) {
			const rs3 = await createFile('./CodeFile/' + dirName + '/input.txt', stdin);
			console.log(rs3);
		} else {
			console.log('Empty input');
		}

		// Run
		const stdout = await run(language, dirName, hasStdin);

		// Check for time out
		const rs4 = await checkTimeout(dirName);
		console.log(rs4);

		// Get running messages
		const { time, memory } = await getRunMsg(dirName);

		await removeDir('./CodeFile/' + dirName);

		return new Result({
			status: 0, msg: 'Running successfully', data: {
				stdout,
				time,
				memory
			}
		});
	} catch (error) {
		const { wrongType, detail = '' } = error;
		await removeDir('./CodeFile/' + dirName);
		switch (wrongType) {
			case 1:
				return new Result({ status: 4, msg: '创建目录失败' });
			case 2:
				return new Result({ status: 4, msg: '写入文件失败' });
			case 3:
				return new Result({
					status: 1, msg: '编译失败', data: {
						error: detail
					}
				});
			case 4:
				return new Result({
					status: 2, msg: '运行出错', data: {
						error: detail
					}
				});
			case 5:
				return new Result({ status: 3, msg: '程序未在规定时间运行完毕' });
			case 6:
				return new Result({ status: 4, msg: '查找编译生成的class文件出错' });
			case 7:
				return new Result({ status: 4, msg: '查询运行信息出错' });
			default:
				return new Result({ status: 5, msg: '未知错误' });

		}
	}
}

function Result({ status = 0, msg = '', data = {} }) {
	Object.assign(this, {
		status,
		msg,
		data
	});
}

function createDir(dirName) {
	return new Promise((res, rej) => {
		fs.mkdir(dirName, { recursive: true }, err => {
			if (err) {
				rej({ wrongType: 1 }); // 创建目录失败
			} else {
				res('创建目录成功');
			}
		});
	});
}

function removeDir(dirName) {
	let cmdStr = 'sudo rm -rf ' + dirName;
	exec(cmdStr, function (err, stdout, stderr) {
		if (err) {
			console.log('删除目录失败');
		} else {
			console.log('删除目录成功');
		}
	});
}

function createFile(filePath, content) {
	return new Promise((res, rej) => {
		fs.writeFile(filePath, content, err => {
			if (err) {
				rej({ wrongType: 2 }); // 写入文件失败
			} else {
				res('写入文件' + filePath + '成功');
			}
		})
	});
}

function catFile(filePath) {
	let cmdStr = 'sudo cat ' + filePath;
	return new Promise((res, rej) => {
		exec(cmdStr, function (err, stdout, stderr) {
			if (err) {
				rej({ wrongType: 7 });
			} else {
				res(stdout);
			}
		});
	});
}

function getRunMsg(dirName) {
	return catFile('./CodeFile/' + dirName + '/time.txt')
		.then(msg => {
			let splits = msg.replace('\n', '').split(' ');
			return {
				time: (+splits[0]) + (+splits[1]) + 's',
				memory: splits[2]
			}
		});
}

function checkTimeout(dirName) {
	return catFile('./CodeFile/' + dirName + '/timeout.txt')
		.then(msg => {
			let code = msg.replace('\n', '');
			if (code == '0') {
				return '运行成功';
			}
			if (code == '139') {
				return Promise.reject({ wrongType: 4, detail: '运行期间发生错误' });
			}
			if (code == '124') {
				console.log('运行超时')
				return Promise.reject({ wrongType: 5 });
			}
			return Promise.reject({ wrongType: 4, detail: '运行期间发生错误' });
		})
}

function compile(language, dirName) {
	if (language == 'JavaScript(Node)' || language == 'Python2.7' || language == 'Python3') {
		console.log('不用编译');
		return
	}
	const tmpcmdStr = "sudo docker run --rm -v '" + codeFilePath
		+ dirName + "/':'/home' -w /home code-docker:v6"



	const cmdStr = tmpcmdStr + compileMapLanguageToCmd[language]

	return new Promise((res, rej) => {
		exec(cmdStr, function (err, stdout, stderr) {
			if (err) {
				rej({ wrongType: 3, detail: stderr });
			} else {
				res('编译成功');
			}
		});
	})
}


function findJavaClass(dirName) {
	var cmdFindClass = "find ./CodeFile/" + dirName + "/ -type f -regex '.*\.class'";

	return new Promise((res, rej) => {
		exec(cmdFindClass, function (err, stdout, stderr) {
			if (err) {
				rej({ wrongType: 6 });
			} else {
				let result = stdout.match(/[^/]*(?=\.class)/);
				// console.log(result);
				if (result) {
					res(result[0]);
				} else {
					rej({ wrongType: 6 });
				}
			}
		});
	});
}

async function run(language, dirName, hasStdin) {
	const dockerCmdTmp = "sudo docker run --rm -i -v '" + codeFilePath
		+ dirName + "/':'/home' -w /home code-docker:v6 timeout 10 /usr/bin/time -f '%U %S %MKB' -o time.txt "
	const languageStr = runLanguageToCmd[language]
	const className = language === "Java" ? await findJavaClass(dirName) : ""
	const stdinStr = language === "javascript" ? "" : (hasStdin ? " <./CodeFile/" + dirName + "/input.txt" : "")
	const echoStr = " ; echo $? > ./CodeFile/" + dirName + "/timeout.txt"
	const cmdStr = dockerCmdTmp + languageStr + className + stdinStr + echoStr
	return new Promise((res, rej) => {
		console.log(cmdStr)
		exec(cmdStr, function (err, stdout, stderr) {
			if (err) {
				rej({ wrongType: 4, detail: err });
			} else if (stdout) {
				res(stdout);
			} else if (stderr) {
				rej({ wrongType: 4, detail: stderr });
			} else {
				res('');
			}
		});
	});
}
module.exports = runCode;