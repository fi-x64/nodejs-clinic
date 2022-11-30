import db from "../models/index";
const config = require("../config/auth.config");
require('dotenv').config();
import emailService from "./emailService"
import { v4 as uuidv4 } from 'uuid';
import vnPayParams from "../utils/paymentParams";
import querystring from "qs";
import * as crypto from "crypto";
import sequelize, { Op } from "sequelize";
import moment from "moment";
import sortObject from "../utils/sortObject";
var jwt = require("jsonwebtoken");

let buildUrlEmail = (doctorId, token) => {
    let result = `${process.env.URL_REACT}/verify-booking?token=${token}&doctorId=${doctorId}`

    return result;
}

let postBookAppointment = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.email || !data.doctorId || !data.timeType ||
                !data.date || !data.fullName || !data.selectedGender || !data.address) {
                resolve({
                    errCode: 1,
                    errMessage: "Missing parameter"
                })
            } else {
                let token = uuidv4();

                let user = await db.User.findOrCreate({
                    where: { email: data.email },
                    defaults: {
                        email: data.email,
                        roleId: 'R3',
                        gender: data.selectedGender,
                        address: data.address,
                        firstName: data.fullName,
                        token: token
                    }
                });
                if (user && user[0]) {
                    var booking = await db.Booking.findOrCreate({
                        where: {
                            patientId: user[0].id,
                            timeType: data.timeType,
                            doctorId: data.doctorId,
                            date: data.date,
                        },
                        defaults: {
                            statusId: 'S1',
                            doctorId: data.doctorId,
                            patientId: user[0].id,
                            date: data.date,
                            timeType: data.timeType,
                            token: token,
                        }
                    });
                    console.log("Check booking: ", booking);
                    if (data.paymentMethod === "cash") {
                        if (booking && booking[1]) {
                            await emailService.sendSimpleEmail({
                                receiverEmail: data.email,
                                patientName: data.fullName,
                                time: data.timeString,
                                doctorName: data.doctorName,
                                language: data.language,
                                redirectLink: buildUrlEmail(data.doctorId, token),
                            })
                        } else {
                            resolve({
                                data: user,
                                errCode: 1,
                                errMessage: 'Create new user failed'
                            })
                        }
                    } else if (data.paymentMethod === 'vnpay') {
                        data.bookingId = booking[0].id;
                        var dataPayment = await processPayment(data);
                    }
                }

                resolve({
                    data: user,
                    dataPayment: dataPayment,
                    errCode: 0,
                    errMessage: 'Create new user succeeded'
                })
            }
        } catch (e) {
            console.log(e);
        }
    })
}

let postVerifyBookAppointment = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.token || !data.doctorId) {
                resolve({
                    errCode: 1,
                    errMessage: "Missing parameter"
                })
            } else {
                let appointment = await db.Booking.findOne({
                    where: {
                        doctorId: data.doctorId,
                        token: data.token,
                        statusId: 'S1',
                    },
                    raw: false
                })
                if (appointment) {
                    appointment.statusId = 'S2';
                    await appointment.save();

                    resolve({
                        errCode: 0,
                        errMessage: "Update the appointment succeeded!"
                    })
                } else {
                    resolve({
                        errCode: 2,
                        errMessage: "Appointment has been activated or does not exist"
                    })
                }
            }
        } catch (e) {
            reject(e);
        }
    })
}

let processPayment = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing parameter',
                })
            } else {
                var ipAddr = data.ipAddr;

                var tmnCode = vnPayParams["vnp_TmnCode"];
                var secretKey = vnPayParams["vnp_HashSecret"];
                var vnpUrl = vnPayParams["vnp_Url"];
                var returnUrl = vnPayParams["vnp_ReturnUrl"];

                var createDate = moment().format('YYYYMMDDHHmmss')
                var orderId = moment().format('HHmmss')
                let amount = data.amount;
                var bankCode = data.bankCode;

                var orderInfo = "Online payment";
                var orderType = "billpayment";
                var locale = "vn";
                if (locale === null || locale === "") {
                    locale = "vn";
                }

                var currCode = "VND";
                var vnp_Params = {};
                vnp_Params["vnp_Version"] = "2.1.0";
                vnp_Params["vnp_Command"] = "pay";
                vnp_Params["vnp_TmnCode"] = tmnCode;
                // vnp_Params['vnp_Merchant'] = ''
                vnp_Params["vnp_Locale"] = locale;
                vnp_Params["vnp_CurrCode"] = currCode;
                vnp_Params["vnp_TxnRef"] = orderId;
                vnp_Params["vnp_OrderInfo"] = orderInfo;
                vnp_Params["vnp_OrderType"] = orderType;
                vnp_Params["vnp_Amount"] = amount;
                vnp_Params["vnp_ReturnUrl"] = returnUrl;
                vnp_Params["vnp_IpAddr"] = ipAddr;
                vnp_Params["vnp_CreateDate"] = createDate;
                if (bankCode !== null && bankCode !== "") {
                    vnp_Params["vnp_BankCode"] = bankCode;
                }

                vnp_Params = sortObject(vnp_Params);

                var signData = querystring.stringify(vnp_Params, { encode: false });
                var hmac = crypto.createHmac("sha512", secretKey);
                var signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
                vnp_Params["vnp_SecureHash"] = signed;
                vnpUrl += "?" + querystring.stringify(vnp_Params, { encode: false });

                const newCheckout = await db.Checkout.create({
                    total: amount,
                    bookingId: data.bookingId,
                    paymentMethod: "vnpay",
                    transactionId: orderId,
                })
                console.log("Check data: ", data);

                console.log(vnpUrl)
                resolve({
                    errCode: 0,
                    url: vnpUrl,
                    errMessage: "Update the appointment succeeded!"
                })
            }
        } catch (e) {
            reject(e);
        }
    })
}

let paymentReturn = async (req, res, next) => {
    var vnp_Params = req.query;

    var secureHash = vnp_Params["vnp_SecureHash"];

    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    vnp_Params = sortObject(vnp_Params);

    // var config = require('config');
    // var tmnCode = config.get('vnp_TmnCode');
    var secretKey = vnPayParams.vnp_HashSecret;

    var signData = querystring.stringify(vnp_Params, { encode: false });
    var hmac = crypto.createHmac("sha512", secretKey);
    var signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    if (secureHash === signed) {
        var orderId = vnp_Params["vnp_TxnRef"];
        var rspCode = vnp_Params["vnp_ResponseCode"];
        //Kiem tra du lieu co hop le khong, cap nhat trang thai don hang va gui ket qua cho VNPAY theo dinh dang duoi
        const checkout = await db.Checkout.findOne({ where: { transactionId: orderId } });
        if (!order) return res.json({ success: false, message: "Order not exist" });
        if (rspCode !== "00")
            // return res.json({ success: false, message: 'Transaction failed' })
            return res.redirect("/payment/failed");
        order.transactionId = req.query.vnp_TransactionNo;
        order.paymentStatus = "paid";
        order.paymentDate = req.query.vnp_PayDate;
        await order.save();
        // let resData = await Order.create({
        //     total: vnp_Params.vnp_Amount,
        //     paymentStatus: vnp_Params.vnp_TransactionStatus,
        //     transactionId: vnp_Params.vnp_TransactionNo,
        //     paymentMethod: vnp_Params.vnp_CardType,
        //     transdate: vnp_Params.vnp_PayDate,

        // });

        // if (resData) {
        // }


        res.redirect("http://localhost:3000/payment-infor", { errCode: 0, data: vnp_Params, payDate: order.updatedAt });
    } else {
        res.render("guest/cart/payment_infor", { errCode: -1 });
    }
}

module.exports = {
    postBookAppointment: postBookAppointment,
    paymentReturn: paymentReturn,
    postVerifyBookAppointment: postVerifyBookAppointment,
}