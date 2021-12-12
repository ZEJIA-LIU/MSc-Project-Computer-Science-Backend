const mysql = require('mysql');

/*const connection = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: '20160910',
  // 端口, mysql 端口一般是3306
  port: 3306,
  // 数据库的名称
  database: 'test',
});*/

let pool;

let getPool = () => {
  pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    // password: 'Lzj970626',
    password: '123456',
    database: 'super_code',
    connectionLimit: 100,
    // waitForConnections: true, // 默认为true
  });
  // 重连
  pool.on('error', err => {
    if (err.code === 'PROTOCOL_CONNECTION_LOST') setTimeout(getPool, 2000);
  });
}

getPool();

let query = (sql, values) => {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) {
        reject(err)
      } else {
        if (values) {
          connection.query(sql, values, (err, rows) => {
            if (err) {
              reject(err)
            } else {
              resolve(rows)
            }
            connection.release()
          })
        } else {
          connection.query(sql, (err, rows) => {
            if (err) {
              reject(err)
            } else {
              resolve(rows)
            }
            connection.release()
          })
        }
      }
    })
  })
}

module.exports = { query };