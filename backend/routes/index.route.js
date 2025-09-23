const actionHistoryRoutes = require('./actionHistory.route');
const dataSensorRoutes = require('./dataSensor.route');

module.exports = (app) => {
    const version = "/api";
    app.use(version + "/action-history", actionHistoryRoutes);
    app.use(version + "/data-sensor", dataSensorRoutes);
}