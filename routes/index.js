const authenticationRoutes = require('./auth');
const categoryRoutes = require('./category');
const entityRoutes = require('./entity');
const reviewRoutes = require('./review');
module.exports = (app) => {
    authenticationRoutes(app);
    categoryRoutes(app);
    entityRoutes(app);
    reviewRoutes(app);
}
