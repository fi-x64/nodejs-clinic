import express from "express";
import homeController from "../controller/homeController";

let router = express.Router();

let initWebRoutes = (app) => {
    router.get('/', homeController.getHomePage);
    router.get('/about', homeController.getAboutPage);

    router.get('/phiho', (req, res) => {
        return res.send('Hello world with Phi Ho');
    });

    return app.use("/", router)
}

module.exports = initWebRoutes;