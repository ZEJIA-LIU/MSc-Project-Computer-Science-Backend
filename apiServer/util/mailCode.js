const nodemailer = require('nodemailer');

//创建一个smtp服务器
const config = {
  host: 'smtp.163.com',
  port: 465,
  auth: {
    user: 'a790868516@163.com', // 邮箱账号
    pass: 'PMMTOYNBGBTGLWLP' // 邮箱的授权码
  }
};
// 创建一个SMTP客户端对象
const transporter = nodemailer.createTransport(config);

let mail = {
  // 发件人
  from: 'SuperCode<a790868516@163.com>',
  // 主题
  subject: '请激活您的账号', //邮箱主题
  // 收件人
  // to: '419084766@qq.com',//前台传过来的邮箱
  // // 邮件内容，HTML格式
  // text: 'test3'//发送验证码
};

const sendMailCode = (email, code) => {
  return new Promise((resolve, reject) => {
    transporter.sendMail({
      ...mail,
      to: email,
      text: `您的验证码为: ${code}`
    }, function (error, info) {
      if (error) {
        reject(error);
      }
      resolve({ success: 1 })
    });
  });
};

const createMailCode = () => {
  let Code = "";
  for (let i = 0; i < 6; i++) {
    Code += Math.floor(Math.random() * 10);
  }
  return Code;
};

module.exports = {
  createMailCode,
  sendMailCode
};