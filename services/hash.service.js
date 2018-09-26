const CONFIG = require('../config');
const Hashids = require('hashids');
const hashids = new Hashids(CONFIG.hashids_salt, 10);

module.exports.hashids = hashids

const decodeHash = (column) => {
    const decoded = hashids.decode(column);
    return decoded instanceof Array && decoded.length === 1 ? decoded[0] : decoded;
}
module.exports.decodeHash = decodeHash;

const hash = (param) => {
    return hashids.encode(param);
}
module.exports.hash = hash;

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
                                try {
                                    row[key][c] = hashids.encode(row[key][c]);
                                } catch (e) {
                                    
                                }
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
                        try {
                            row[key][c] = hashids.encode(row[key][c]);
                        } catch(e) {

                        }
                    });
                }
            }
        });
    }
    return rows;
}
module.exports.hashColumns = hashColumns;