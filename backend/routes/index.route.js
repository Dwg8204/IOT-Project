const actionHistoryRoutes = require('./actionHistory.route');
const dataSensorRoutes = require('./dataSensor.route');
const homeRoutes = require('./home.route');
module.exports = (app) => {
    const version = "/api";
    app.use(version + "/action-history", actionHistoryRoutes);
    app.use(version + "/data-sensor", dataSensorRoutes);
    app.use(version + "/", homeRoutes);
}