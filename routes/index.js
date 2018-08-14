const authenticationRoutes = require('./auth');
const categoryRoutes = require('./category');
const entityRoutes = require('./entity');
const reviewRoutes = require('./review');
const homeRoutes = require('./home');
module.exports = (app) => {
    homeRoutes(app);
    authenticationRoutes(app);
    categoryRoutes(app);
    entityRoutes(app);
    reviewRoutes(app);
}
