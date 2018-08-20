const { validationResult } = require('express-validator/check');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pify = require('pify');

const validate = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).json({ errors: errors.array() });
	}
	return next();
};
module.exports.validate = validate;


const validateImageFile = (imageField) => {
    
    return async function (req, res, next) {
    	var tmpStorage = multer.diskStorage({ //multers disk storage settings
	        destination: function (req, file, cb) {
	            cb(null, './tmp/uploads')
	        },
	        filename: function (req, file, cb) {
	            var datetimestamp = Date.now();
	            cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length -1])
	        },
	        onFileUploadStart: function (file) {
	        	console.log(file.name + ' is starting ...');
		    },
		    onFileUploadComplete: function (file, req, res) {
		        console.log(file.name + ' uploading is ended ...');
		        console.log("File name : "+ file.name +"\n"+ "FilePath: "+ file.path)
		    },
		    onError: function (error, _next) {
		        console.log("File uploading error: => "+error)
		        // _next(error)
		    },
		    onFileSizeLimit: function (file) {
		        console.log('Failed: ', file.originalname +" in path: "+file.path)
		        fs.unlink(path.join(__dirname, './tmp/uploads/') + file.path) // delete the partially written file
		    }
	    });

	    var upload = pify(
	    	multer({ //multer settings
		        storage: tmpStorage,
		        fileFilter: function (req, file, callback) {
		            var ext = path.extname(file.originalname);
		            if(ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
		                return callback(new Error('Only images are allowed'))
		            }
		            callback(null, true)
		        },
		        limits:{
		            fileSize: 1024 * 1024
		        }
		    }).single(imageField)
	    );
    	try {
    		console.log('---------------------- TRY STARTED ----------------------');
    		
    		console.log('---------------------- AWAIT STARTED ----------------------');
    		await upload(req, res);
    		console.log('---------------------- AWAIT ENDED ----------------------');
    		return next();
    	} catch (err) {
    		console.log('ERROR!!', err);
    		return res.status(422).json({ errors: err });
    	}
    }
}
module.exports.validateImageFile = validateImageFile;