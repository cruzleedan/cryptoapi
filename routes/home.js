const HomeController = require('../controllers/home.controller');
module.exports = (router, passport) => {
  	router.get('/home/entities', HomeController.getEntities);
}
