const ReviewController = require('../controllers/review.controller');
const { permit } = require('../middleware/permission');
const { validate, validateImageFile } = require('../middleware/validation');
const { check } = require('express-validator/check');
const { ReE } = require('../services/util.service');

const fs = require('fs');
const util = require('util');
const path = require('path');
const log_file = fs.createWriteStream(__dirname + '/debug.log', {flags : 'w'});
const log_stdout = process.stdout;

module.exports = (router, passport) => {
  	router.post('/error', (req, res) => {
  		const error = req.body['error'] || '';
  		log_file.write(util.format(error) + '\n');
  		log_stdout.write(util.format(error) + '\n');
  		res.status(200).json({success: true});
  	});
}
