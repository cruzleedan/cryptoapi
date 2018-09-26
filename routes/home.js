const HomeController = require('../controllers/home.controller');
module.exports = (router, passport) => {
  	router.get('/home/entities',
  		// Authenticate using HTTP Basic credentials, with session support disabled,
		// and allow anonymous requests.
		passport.authenticate(['jwt', 'anonymous'], { session: false }),
  		HomeController.getEntities);
}
