const express 			= require('express');
const router 			= express.Router();


const HomeController 	= require('../controllers/home.controller');


const passport      	= require('passport');
// const path              = require('path');

require('./../middleware/passport')(passport)
/* GET home page. */
router.get('/', function(req, res, next) {
  res.json({success: false, error:"Parcel Pending API", data:{"version_number":"v1.0.0"}})
});


router.get('/dash', passport.authenticate('jwt', {session:false}),HomeController.Dashboard)

require('./home')(router, passport);
require('./user')(router, passport);
require('./category')(router, passport);
require('./entity')(router, passport);
require('./review')(router, passport);

//********* API DOCUMENTATION **********
// router.use('/docs/api.json',            express.static(path.join(__dirname, '/../public/v1/documentation/api.json')));
// router.use('/docs',                     express.static(path.join(__dirname, '/../public/v1/documentation/dist')));

module.exports = router;
