require('dotenv').config();
import nodemailer from 'nodemailer';

let sendSimpleEmail = async (dataSend) => {
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_APP, // generated ethereal user
            pass: process.env.EMAIL_APP_PASSWORD, // generated ethereal password
        },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: 'Email from BookingCare" <yummyrestaurantmail@gmail.com>', // sender address
        to: dataSend.receiverEmail, // list of receivers
        subject: "Thông tin đặt lịch khám bệnh", // Subject line
        html: getBodyHTMLEmail(dataSend), // html body
    });
}

let getBodyHTMLEmail = (dataSend) => {
    let result = '';
    if (dataSend.language === 'vi') {
        result = `<h3>Xin chào ${dataSend.patientName}!</h3>
        <p>Bạn nhận được email này vì đã đặt lịch khám bệnh online trên website BookingCare</p>
        <p>Thông tin đặt lịch khám bệnh:</p>
        <div><b>Thời gian: ${dataSend.time}</b></div>
        <div><b>Bác sĩ: ${dataSend.doctorName}</b></div>
        <p>Nếu các thông tin trên là đúng sự thật. Vui lòmg click vào đường link bên dưới 
            để xác nhận và hoàn tất thủ tục đặt lịch khám bệnh</p>
        <div>
        <a href=${dataSend.redirectLink} target="_blank">Bấm vào đây</a>
        </div>
        <div>Xin chân thành cảm ơn!</div>
        `
    }
    if (dataSend.language === 'en') {
        result = `<h3>Hello ${dataSend.patientName}!</h3>
        <p>You received this email because you booked an online medical appointment on the BookingCare website</p>
        <p>Information about a medical appointment's schedule:</p>
        <div><b>Time: ${dataSend.time}</b></div>
        <div><b>Doctor: ${dataSend.doctorName}</b></div>
        <p>If the above information is true. Please click on the link below
        to confirm and complete the medical appointment booking procedure</p>
        <div>
        <a href=${dataSend.redirectLink} target="_blank">Click here</a>
        </div>
        <div>Sincerely thank!</div>
        `
    }
    return result;
}

let sendAttachment = async (dataSend) => {
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_APP, // generated ethereal user
            pass: process.env.EMAIL_APP_PASSWORD, // generated ethereal password
        },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: 'Test Send Email" <yummyrestaurantmail@gmail.com>', // sender address
        to: dataSend.email, // list of receivers
        subject: "Thông tin đặt lịch khám bệnh", // Subject line
        html: getBodyHTMLEmailRemedy(dataSend), // html body
        attachments: [
            {
                filename: `remedy-${dataSend.patientId}-${new Date().getTime()}.png`,
                content: dataSend.imageBase64.split("base64,")[1],
                encoding: 'base64'
            }
        ],
    });
}

let sendRecoverPasswordEmail = async (dataSend) => {
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_APP, // generated ethereal user
            pass: process.env.EMAIL_APP_PASSWORD, // generated ethereal password
        },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: 'Password Recover email" <yummyrestaurantmail@gmail.com>', // sender address
        to: dataSend.email, // list of receivers
        subject: "Thông tin đổi mật khẩu cho tài khoản", // Subject line
        html: getBodyHTMLEmailRecoverPassword(dataSend), // html body
    });
}

let getBodyHTMLEmailRecoverPassword = (dataSend) => {
    let result = '';
    if (dataSend.language === 'vi') {
        result = `<h3>Xin chào ${dataSend.firstName + " " + dataSend.lastName}!</h3>
        <p>Đây là email để xác nhận đổi mật khẩu cho tài khoản của bạn trên website BookingCare</p>
        <p>Vui lòng click vào đường <a href=${dataSend.redirectLink} target="_blank" style={color:"blue"}>link</a> này để tiến hành đổi mật khẩu</p>
        
        <div>Xin chân thành cảm ơn!</div>
        `
    }
    if (dataSend.language === 'en') {
        result = `<h3>Hello ${dataSend.lastName + " " + dataSend.firstName}!</h3>
        <p>This is the email to confirm the password change for your account on the BookingCare website</p>
        <p>Please click on this <a href=${dataSend.redirectLink} target="_blank" style={color:"blue"}>here</a> to change your password</p>
        
        <div>Sincerely thank!</div>
        `
    }
    return result;
}

let getBodyHTMLEmailRemedy = (dataSend) => {
    let result = '';
    if (dataSend.language === 'vi') {
        result = `<h3>Xin chào ${dataSend.patientName}!</h3>
        <p>Đây là hoán đơn của bạn đã hoàn thành quá trình khám bệnh khi đặt lịch online trên website BookingCare</p>
        <p>Thông tin đơn thuốc/hoá đơn được gửi trong file đính kèm:</p>
        
        <div>Xin chân thành cảm ơn!</div>
        `
    }
    if (dataSend.language === 'en') {
        result = `<h3>Hello ${dataSend.patientName}!</h3>
        <p>This is your invoice after completing the medical examination process when booking an online appointment on the BookingCare website</p>
        <p>Prescription/invoice information is sent in the attached file:</p>
        
        <div>Sincerely thank!</div>
        `
    }
    return result;
}

module.exports = {
    sendSimpleEmail: sendSimpleEmail,
    sendAttachment: sendAttachment,
    sendRecoverPasswordEmail: sendRecoverPasswordEmail,
}