// module.exports = class User {
//     constructor( config ) {
//         this.pool = require('./db');
//         this.columns = {
//             facebook_id: null,
//             username: null,
//             first_name: null,
//             last_name: null,
//             email: null,
//             password: null,
//             delete_flag: 0,
//             auth_method: null
//         };
//         this.create_timestamp = 'create_time = NOW(), update_time = NOW()';
//         this.update_timestamp = 'update_time = NOW()';
//     }
//     findOne (params) {
//         return new Promise((resolve, reject) => {
//             let arr = [];
//             for( let key in params ) {
//                 arr.push(`${ key } = ${ params[key] }`);
//             }
//             let p = arr.join(' AND ');
//             this.pool.query('SELECT * FROM users WHERE ?', p, (error, results, fields) => {
//                 if(error) reject(error);
//                 console.log(results);
//                 resolve(results);
//             });
//         });
//     }
//     create (user) {
//         return new Promise((resolve, reject) => {
//             user = Object.assign({}, this.columns, user);
//             this.pool.query(`INSERT INTO users SET ?, ${this.create_timestamp}`, user, (error, results, fields) => {
//                 if(error) reject(error);
//                 resolve(results);
//             })
//         })
//     }
// }
