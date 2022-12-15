import patientService from '../services/patientService'
import db from "../models/index";
import vnPayParams from "../utils/paymentParams";

let postBookAppointment = async (req, res) => {
    var ipAddr = req.headers["x-forwarded-for"] || req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
    req.body.ipAddr = ipAddr;
    try {
        let infor = await patientService.postBookAppointment(req.body);
        console.log("Check infor: ", infor);
        if (infor && infor.url) {
            res.redirect(infor.url);
        } else return res.status(200).json(infor)
    } catch (e) {
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from the server'
        })
    }
}

let postVerifyBookAppointment = async (req, res) => {
    try {
        let infor = await patientService.postVerifyBookAppointment(req.body);
        return res.status(200).json(infor)
    } catch (e) {
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from the server'
        })
    }
}

let paymentReturn = async (req, res) => {
    try {
        let infor = await patientService.paymentReturn(req.body);
        return res.status(200).json(infor)
    } catch (e) {
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from the server'
        })
    }
}

module.exports = {
    postBookAppointment: postBookAppointment,
    postVerifyBookAppointment: postVerifyBookAppointment,
    paymentReturn: paymentReturn,
}