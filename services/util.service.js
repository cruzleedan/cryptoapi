const { to } = require('await-to-js');
const pe = require('parse-error');

module.exports.to = async (promise) => {
    let err, res;
    [err, res] = await to(promise);
    if (err) return [pe(err)];

    return [null, res];
};

module.exports.ReE = (res, err, code) => { // Error Web Response
    let msg = '';
    
    if(typeof err == 'object') {
        if(err.original !== undefined && err.original.hasOwnProperty('code') && err.original.code === 'ER_DUP_ENTRY') {
            msg = 'Duplicate entry'
        } else if(typeof err.message != 'undefined') {
            msg = err.message;
        }
    }
    else if(typeof err == 'string') {
        msg = err;
    }
    if (typeof code !== 'undefined') res.statusCode = code;

    return res.json({
        success: false,
        error: msg
    });
};

module.exports.ReS = (res, data, code) => { // Success Web Response
    let send_data = {
        success: true
    };

    if (typeof data == 'object') {
        send_data = Object.assign(data, send_data); //merge the objects
    }

    if (typeof code !== 'undefined') res.statusCode = code;

    return res.json(send_data)
};

module.exports.TE = TE = (err_message, log) => { // TE stands for Throw Error
    if (log === true) {
        console.error(err_message);
    }

    throw new Error(err_message);
};