import db from "../models/index";
const config = require("../config/auth.config");
require('dotenv').config();
import emailService from "./emailService"
import { v4 as uuidv4 } from 'uuid';
import vnPayParams from "../utils/paymentParams";
import * as crypto from "crypto";
import sequelize, { Op } from "sequelize";
import moment from "moment";
import querystring from "qs";
import sortObject from "../utils/sortObject";
import { reject } from "lodash";
var jwt = require("jsonwebtoken");

let buildUrlEmail = (doctorId, token, scheduleId) => {
    let result = `${process.env.URL_REACT}/verify-booking?token=${token}&doctorId=${doctorId}&scheduleId=${scheduleId}`;

    return result;
}

let postBookAppointment = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.email || !data.doctorId || !data.timeType ||
                !data.date || !data.firstName || !data.lastName || !data.selectedGender || !data.address) {
                resolve({
                    errCode: 1,
                    errMessage: "Missing parameter"
                })
            } else {
                var doctorSchedule = await db.Schedule.findOne({
                    where: {
                        id: data.scheduleId,
                    },
                    raw: false
                })
                if (doctorSchedule && doctorSchedule.currentNumber < doctorSchedule.maxNumber) {
                    let token = uuidv4();
                    var user = await db.User.findOrCreate({
                        where: { email: data.email },
                        defaults: {
                            email: data.email,
                            roleId: 'R3',
                            gender: data.selectedGender,
                            address: data.address,
                            firstName: data.firstName,
                            lastName: data.lastName,
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


                        if (data.paymentMethod === "cash") {

                            if (booking && booking[1]) {
                                const newCheckout = await db.Checkout.create({
                                    total: data.amount,
                                    bookingId: booking[0].id,
                                    paymentMethod: "cash",
                                    paymentDate: moment().format('YYYYMMDDHHmmss'),
                                })
                                if (newCheckout) {
                                    await emailService.sendSimpleEmail({
                                        receiverEmail: data.email,
                                        patientName: data.lastName + " " + data.firstName,
                                        time: data.timeString,
                                        doctorName: data.doctorName,
                                        language: data.language,
                                        redirectLink: buildUrlEmail(data.doctorId, token, data.scheduleId),
                                    })
                                }
                            } else {
                                resolve({
                                    data: user,
                                    errCode: 1,
                                    errMessage: 'Create new booking failed'
                                })
                            }
                        } else if (data.paymentMethod === 'vnpay') {
                            if (doctorSchedule) {
                                data.bookingId = booking[0].id;
                                var dataPayment = await processPayment(data);

                                if (dataPayment) {
                                    if (doctorSchedule.currentNumber) {
                                        doctorSchedule.currentNumber = doctorSchedule.currentNumber + 1;
                                    } else doctorSchedule.currentNumber = 1;
                                    await doctorSchedule.save();
                                }
                            }
                            else {
                                resolve({
                                    errCode: 2,
                                    errMessage: "Out of slot",
                                })
                            }
                        }
                    }
                }
                else {
                    resolve({
                        errCode: 2,
                        errMessage: "Out of slot",
                    })
                }

                resolve({
                    data: user,
                    dataPayment: dataPayment,
                    errCode: 0,
                    errMessage: 'Create new booking succeeded'
                })
            }
        } catch (e) {
            console.log(e);
        }
    })
}

let postVerifyBookAppointment = (data) => {
    console.log("Check data: ", data);
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

                    var doctorSchedule = await db.Schedule.findOne({
                        where: {
                            id: data.scheduleId,
                        },
                        raw: false
                    })

                    if (doctorSchedule) {
                        if (doctorSchedule.currentNumber)
                            if (doctorSchedule.currentNumber < doctorSchedule.maxNumber)
                                doctorSchedule.currentNumber = doctorSchedule.currentNumber + 1;
                            else {
                                resolve({
                                    errCode: 2,
                                    errMessage: "Out of slot",
                                })
                            }
                        else doctorSchedule.currentNumber = 1;
                        await doctorSchedule.save();
                    }

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
                let amount = data.amount * 100;
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

                const newCheckout = await db.Checkout.create({
                    total: amount,
                    bookingId: data.bookingId,
                    paymentMethod: "vnpay",
                    transactionId: orderId,
                })
                vnpUrl += "?" + querystring.stringify(vnp_Params, { encode: false });

                if (newCheckout) {
                    resolve({
                        errCode: 0,
                        checkoutId: newCheckout.id,
                        url: vnpUrl,
                        errMessage: "Update the appointment succeeded!"
                    })
                } else {
                    resolve({
                        errCode: 1,
                        errMessage: "Cann't create new checkout!"
                    })
                }
            }
        } catch (e) {
            reject(e);
        }
    })
}

let paymentReturn = async (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            var vnp_Params = data;
            var orderId = vnp_Params.vnp_TxnRef;

            let checkout = await db.Checkout.findOne({ where: { transactionId: orderId }, raw: false });
            if (checkout) {
                checkout.paymentStatus = "success";
                checkout.paymentDate = vnp_Params.vnp_PayDate;

                await checkout.save();

                let booking = await db.Booking.findOne({ where: { id: checkout.bookingId }, raw: false });
                booking.statusId = "S2";

                await booking.save();

                resolve({
                    errCode: 0,
                    errMessage: "Update the checkout succeeded!"
                })
            }
        } catch (e) {
            reject(e);
        }
    })
}

module.exports = {
    postBookAppointment: postBookAppointment,
    paymentReturn: paymentReturn,
    postVerifyBookAppointment: postVerifyBookAppointment,
}