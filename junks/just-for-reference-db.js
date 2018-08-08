// const mysql = require('mysql');
// const config = require('../config');
// const db = config.db.local;

// const pool = mysql.createPool(Object.assign({}, db, {
//     connectionLimit: 10,
//     multipleStatements: true
// }));
// pool.on('connection', function(connection) {
//   connection.on('enqueue', function(sequence) {
//     // if (sequence instanceof mysql.Sequence.Query) {
//     if ('Query' === sequence.constructor.name) {
//       console.log(sequence.sql);
//     }
//   });
// });
// module.exports = pool;
