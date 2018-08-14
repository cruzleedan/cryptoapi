const CONFIG = require('../config');
const Hashids = require('hashids');
const hashids = new Hashids(CONFIG.hashids_salt, 10);

module.exports.hashids = hashids

const decodeHash = (column) => {
    const decoded = hashids.decode(column);
    return decoded instanceof Array && decoded.length === 1 ? decoded[0] : decoded;
}
module.exports.decodeHash = decodeHash;

const hashColumns = (columns, rows) => {
	rows = JSON.parse(JSON.stringify(rows));
    if(rows instanceof Array) {
        for(let i = 0; i<rows.length; i++){
            let row = rows[i];
            columns.forEach(col => {
                if(typeof col === 'string'){
                    row[col] = hashids.encode(row[col]);
                } else if(typeof col === 'object'){
                    let obj = col;
                    for(let key in obj) {
                        obj[key] = obj[key] instanceof Array ? obj[key] : [obj[key]];
                        obj[key].forEach(c => {
                            if(row[key] instanceof Array) {
                                row[key] = row[key].map(subRow => {
                                    subRow[c] = hashids.encode(subRow[c]);
                                    return subRow;
                                })
                            }
                            else {
                                row[key][c] = hashids.encode(row[key][c]);
                            }
                        });
                    }
                }
            });
        }
    }
    else {
        let row = rows;
        columns.forEach(col => {
            if(typeof col === 'string'){
                row[col] = hashids.encode(row[col]);
            } else if(typeof col === 'object'){
                let obj = col;
                for(let key in obj) {
                    obj[key] = obj[key] instanceof Array ? obj[key] : [obj[key]];
                    obj[key].forEach(c => {
                        row[key][c] = hashids.encode(row[key][c]);
                    });
                }
            }
        });
    }
    return rows;
}
module.exports.hashColumns = hashColumns;