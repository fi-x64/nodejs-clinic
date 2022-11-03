import db from "../models/index";
require('dotenv').config();
import emailService from "./emailService"

let postBookAppointment = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.email || !data.doctorId || !data.timeType || !data.date) {
                resolve({
                    errCode: 1,
                    errMessage: "Missing parameter"
                })
            } else {
                await emailService.sendSimpleEmail({
                    receiverEmail: data.email,
                    patientName: 'User Test',
                    time: '8:00 - 9:00 Chủ Nhật 3/11/2022',
                    doctorName: 'Doctor Test',
                    redirectLink: 'https://google.com',

                });

                let user = await db.User.findOrCreate({
                    where: { email: data.email },
                    defaults: {
                        email: data.email,
                        roleId: 'R3'
                    }
                });
                if (user && user[0]) {
                    await db.Booking.findOrCreate({
                        where: { patientId: user[0].id },
                        defaults: {
                            statusId: 'S1',
                            doctorId: data.doctorId,
                            patientId: user[0].id,
                            date: data.date,
                            timeType: data.timeType,
                        }
                    });
                }

                resolve({
                    data: user,
                    errCode: 0,
                    errMessage: 'Create new user succeeded'
                })
            }
        } catch (e) {
            console.log(e);
        }
    })
}

module.exports = {
    postBookAppointment: postBookAppointment
}