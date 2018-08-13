const { Sequelize } = require('../models');
const Op = Sequelize.Op;
const { to, ReE, ReS }  = require('../services/util.service');
const { decodeHash }  = require('../services/hash.service');
const CONFIG = require('../config');
const Hashids = require('hashids');
const hashids = new Hashids(CONFIG.hashids_salt, 10);

module.exports.hashids = hashids


const getFieldDataType = (type) => {
    const isString = ['STRING', 'TEXT'].includes(type),
          isNumber = ['INTEGER', 'DECIMAL', 'BIGINT'].includes(type),
          isDate = ['DATE'].includes(type);
    if (isString) {
        return 'STRING';
    } else if(isNumber) {
        return 'NUMBER';
    } else if (isDate) {
        return 'DATE';
    }
    return;
}
const getKeywordDataType = (keyword) => {
    if((new Date(keyword) !== "Invalid Date") && !isNaN(new Date(keyword))) {
        return 'DATE';
    }
    return (typeof (isNaN(+keyword) ? keyword : +keyword)).toUpperCase();
}
/**
 * @param  {SequelizeModel}
 * @param  {STRING | NUMBER | DATE}
 * @param  {Array}
 * @return {Array}
 */
const getFieldsOfKeywordDataType = (model, keywordDataType, filterFields) => {
    let fields = Object.keys(model.tableAttributes || {}) || [];
    let fieldsOfSameDataType = [];
    let field;
    if(filterFields.length){
        fieldsOfSameDataType = fields.filter(key => {
            field = model.tableAttributes[key];
            return filterFields.includes(key) && field.type.constructor.key === keywordDataType;
        });
    }
    else {
        fieldsOfSameDataType = fields.filter(key => {
            field = model.tableAttributes[key];
            return field.type.constructor.key === keywordDataType;
        });
    }
    return fieldsOfSameDataType;
}
/**
 * @param  {Object}
 * @return {Object}
 */
const filterFn = (res, param) => {
    if(!param.hasOwnProperty('filter') || !param.hasOwnProperty('model')) return ReE(res, 'Filter is required', 422);
    let cfg = {};
    const filter = param.filter,
    model = param.model,
    config = param.config || {},
    count = param.count,
    tblAttr = model.tableAttributes,
    filterFields = param.filterFields || [];
    hashColumns = param.hashColumns || [];
    if(typeof filter === 'object') {
        /*------------------------------ START ------------------------------
        | 1. Column Search - Search one column containing the keyword
        */
        /*
            filter = {
                name: 'Dan',
                age: 22
            }
            cfg = {
                {name: {[Op.like]: 'Dan'}},
                {age: 22}
            }
        */
        let fieldExists, 
            type, 
            fieldDT,
            filterValue;
        Object.keys(filter).forEach((filterField) => {
            filterValue = filter[filterField];
            if(!filterValue) return;

            fieldExists = tblAttr.hasOwnProperty(filterField),
            type = fieldExists ? tblAttr[filterField].type.constructor.key: '',
            fieldDT = getFieldDataType(type);

            if(filterValue && fieldDT == 'STRING') {
                cfg[filterField] = { [Op.like]: `%${filterValue}%` };
            } else if(filterValue && fieldDT == 'NUMBER') {
                if(typeof filterValue !== 'number' && 
                    (tblAttr[filterField].hasOwnProperty('references') || tblAttr[filterField].primaryKey)
                ){
                    filterValue = decodeHash(filterValue);
                }
                cfg[filterField] = filterValue;
            } else if(filterValue && fieldDT == 'DATE') {
                let dayBefore = new Date(filterValue);
                dayBefore.setDate(dayBefore.getDate() + 1);
                cfg[filterField] = { [Op.between]: [new Date(filterValue), dayBefore]};
            }
        });
    }
    else if(typeof filter === 'string') {
        /*------------------------------ START ------------------------------
        | General Search - search multiple fields containing the keyword
        */
        /*  
            filter = 'Dan';
            filterFields = []; // If not specified then search all columns with the same data type as the keyword
            cfg = {
                $or: [
                    {name: {[Op.like]: 'Dan'}},
                    {username: {[Op.like]: 'Dan'}}
                ]
            }
        */
        const keywordDataType = getKeywordDataType(filter);
        const fields = getFieldsOfKeywordDataType(model, keywordDataType, filterFields);
        const where = fields
                        .map(field => {
                            const ob = {},
                            filterValue = filter;
                            let cond;

                            if(keywordDataType === 'STRING') {
                                cond = {[Op.like]: `%${filterValue}%`}
                            } else if(keywordDataType === 'NUMBER') {
                                cond = +filterValue;
                            } else if(keywordDataType === 'DATE') {
                                let dayBefore = new Date(filterValue);
                                dayBefore.setDate(dayBefore.getDate() + 1);
                                cond = { [Op.between]: [new Date(filterValue), dayBefore]};
                            }
                            ob[field] = cond;
                            return ob;
                        });
        if(where.length){
            cfg = {
                $or: where
            };
        }
    }
    if(Object.keys(cfg).length){
        config.where = Object.assign(cfg, config.where);
    }
    if(count){
        model.findAndCountAll(config)
        .then(result => {
            result.rows = hashColumnsFn(hashColumns, result.rows);
            return ReS(res, {data: result.rows, count: result.count}, 200);
        }).catch(err => {
            return ReE(res, err, 422);
        });
    }
    else {
        model.findAll(config)
        .then(result => {
            result = hashColumnsFn(hashColumns, result);
            return ReS(res, {data: result}, 200);
        }).catch(err => {
            return ReE(res, err, 422);
        });
    }
};
module.exports.filterFn = filterFn;

const hashColumnsFn = (columns, rows) => {
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
                            row[key][c] = hashids.encode(row[key][c]);
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