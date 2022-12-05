import db from "../models/index";
const config = require("../config/auth.config");
// import dateFormatfrom "dateformat";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import emailService from "./emailService";
import sequelize, { Op } from "sequelize";
import moment from "moment";

require('dotenv').config();

const salt = bcrypt.genSaltSync(10);

let buildUrlEmail = (userId, token) => {
    let result = `${process.env.URL_REACT}/verify-password-recover?token=${token}&userId=${userId}`

    return result;
}

let hashUserPassword = (password) => {
    return new Promise(async (resolve, reject) => {
        try {
            var hashPassword = bcrypt.hashSync(password, salt);
            resolve(hashPassword);
        } catch (e) {
            reject(e);
        }
    })
}

let handleUserLogin = (email, password) => {
    return new Promise(async (resolve, reject) => {
        try {
            let userData = {};

            let isExist = await checkUserEmail(email);
            if (isExist) {
                // user already exists
                // compare password
                let user = await db.User.findOne({
                    attributes: ['id', 'email', 'roleId', 'password', 'firstName', 'lastName'],
                    where: { email: email },
                    raw: true
                })
                if (user) {
                    let check = await bcrypt.compareSync(password, user.password);

                    if (check) {
                        userData.errCode = 0;
                        userData.errMessage = 'Ok';
                        var token = jwt.sign({ id: user.id }, config.secret, {
                            expiresIn: 86400 // 24 hours
                        });

                        delete user.password;
                        userData.user = user;
                        userData.accessToken = token;
                    } else {
                        userData.errCode = 3;
                        userData.errMessage = 'Wrong password';
                    }
                } else {
                    userData.errCode = 2;
                    userData.errMessage = `User's not found`
                }
                resolve(userData);
            } else {
                // return error
                userData.errCode = 1;
                userData.errMessage = `Your's Email isn't exist in your system. Please try other email!`;
                resolve(userData);
            }
        } catch (e) {
            reject(e);
        }
    })
}

let handleGoogleLogin = (googleResponse) => {
    return new Promise(async (resolve, reject) => {
        try {
            let userData = {};

            let user = await db.User.findOne({
                where: { email: googleResponse.profileObj.email }
            });

            if (user) {
                userData.errCode = 0;
                userData.errMessage = 'Ok';
                let accessToken = jwt.sign({ id: user.id }, config.secret, {
                    expiresIn: 86400 // 24 hours
                });

                userData.user = user;
                userData.accessToken = accessToken;
                resolve(userData);

            } else {
                let token = jwt.sign({ id: googleResponse.profileObj.googleId }, config.secret);
                let result = await db.User.create({
                    email: googleResponse.profileObj.email,
                    firstName: googleResponse.profileObj.givenName,
                    lastName: googleResponse.profileObj.familyName,
                    roleId: 'R3',
                    token: token,
                })
                let accessToken = jwt.sign({ id: user.id }, config.secret, {
                    expiresIn: 86400 // 24 hours
                });
                if (result) {
                    userData.errCode = 0;
                    userData.errMessage = 'Ok';
                    userData.user = result;
                    userData.accessToken = accessToken;
                }
                resolve(userData);
            }
        } catch (e) {
            reject(e);
        }
    })
}

let handleUserRegister = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            let check = await checkUserEmail(data.email);
            if (check) {
                resolve({
                    errCode: 1,
                    errMessage: 'Your email is already in use. Please try another email!'
                })
            } else {
                if (data.password === data.confirmPassword) {
                    let hashPasswordFromBcrypt = await hashUserPassword(data.password);
                    var token = jwt.sign({ id: data.id }, config.secret);
                    await db.User.create({
                        email: data.email,
                        password: hashPasswordFromBcrypt,
                        firstName: data.firstName,
                        lastName: data.lastName,
                        address: data.address,
                        roleId: 'R3',
                        token: token,
                    })
                    resolve({
                        errCode: 0,
                        errMessage: 'OK'
                    })
                } else {
                    resolve({
                        errCode: 1,
                        errMessage: 'Password does not match!'
                    })
                }
            }
        } catch (e) {
            reject(e);
        }
    });
}

let checkUserEmail = (userEmail) => {
    return new Promise(async (resolve, reject) => {
        try {
            let user = await db.User.findOne({
                where: { email: userEmail }
            })
            if (user) {
                resolve(true);
            } else {
                resolve(false);
            }
        } catch (e) {
            reject(e);
        }
    })
}

let getAllUsers = (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            let users = '';
            if (userId === 'ALL') {
                users = await db.User.findAll({
                    attributes: {
                        exclude: ['password']
                    }
                });
            }
            if (userId && userId !== 'ALL') {
                users = await db.User.findOne({
                    where: { id: userId },
                    attributes: {
                        exclude: ['password']
                    }
                })
            }
            resolve(users);
        } catch (e) {
            reject(e);
        }
    })
}

let createNewUser = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            let check = await checkUserEmail(data.email);
            if (check) {
                resolve({
                    errCode: 1,
                    errMessage: 'Your email is already in use. Please try another email!'
                })
            } else {
                let hashPasswordFromBcrypt = await hashUserPassword(data.password);
                await db.User.create({
                    email: data.email,
                    password: hashPasswordFromBcrypt,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    address: data.address,
                    phonenumber: data.phonenumber,
                    gender: data.gender,
                    image: data.image,
                    roleId: data.roleId,
                    positionId: data.positionId,
                    image: data.avatar,
                })
                resolve({
                    errCode: 0,
                    message: 'OK'
                })
            }
        } catch (e) {
            reject(e);
        }
    });
}

let updateUserData = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.id || !data.roleId || !data.positionId || !data.gender) {
                resolve({
                    errCode: 2,
                    errMessage: 'Missing required parameters'
                })
            }
            let user = await db.User.findOne({
                where: { id: data.id },
                raw: false
            })
            if (user) {
                user.firstName = data.firstName;
                user.lastName = data.lastName;
                user.address = data.address;
                user.roleId = data.roleId;
                user.positionId = data.positionId;
                user.phonenumber = data.phonenumber;
                user.gender = data.gender;
                user.image = data.avatar;

                await user.save();

                resolve({
                    errCode: 0,
                    message: 'Update user succeeds!'
                });
            } else {
                resolve({
                    errCode: 1,
                    errMessage: `User's not found!`
                });
            }
        } catch (e) {
            console.log(e);
        }
    })
}

let updateUserInfo = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.id || !data.firstName || !data.phonenumber || !data.lastName || !data.address || !data.gender) {
                resolve({
                    errCode: 2,
                    errMessage: 'Missing required parameters'
                })
            }
            let user = await db.User.findOne({
                where: { id: data.id },
                raw: false
            })
            if (user) {
                user.firstName = data.firstName;
                user.lastName = data.lastName;
                user.address = data.address;
                user.phonenumber = data.phonenumber;
                user.gender = data.gender;
                if (user.image) {
                    user.image = data.avatar;
                }
                await user.save();

                resolve({
                    errCode: 0,
                    message: 'Update user succeeds!'
                });
            } else {
                resolve({
                    errCode: 1,
                    errMessage: `User's not found!`
                });
            }
        } catch (e) {
            console.log(e);
        }
    })
}

let deleteUser = (userId) => {
    return new Promise(async (resolve, reject) => {
        let user = await db.User.findOne({
            where: { id: userId }
        })
        if (!user) {
            resolve({
                errCode: 2,
                errMessage: `The user ${userId} does not exist`
            });
        }

        await db.User.destroy({
            where: { id: userId },
        });

        resolve({
            errCode: 0,
            message: 'The user is now deleted successfully',
        });
    })
}

let getAllCodeService = (typeInput) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!typeInput) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing parameter ',
                })
            } else {
                let res = {};
                let allCode = await db.Allcode.findAll({
                    where: { type: typeInput },
                });
                res.errCode = 0;
                res.data = allCode;
                resolve(res);
            }
        } catch (e) {
            reject(e);
        }
    })
}

let checkEmail = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing parameter ',
                })
            } else {
                let res = {};
                let user = await db.User.findOne({
                    where: { email: data.email },
                    attributes: {
                        exclude: ['password']
                    }
                });

                if (user) {
                    let dataEmail = user;
                    dataEmail.language = data.language;
                    dataEmail.redirectLink = buildUrlEmail(user.id, user.token);
                    await emailService.sendRecoverPasswordEmail(dataEmail);
                }
                res.errCode = 0;
                res.user = user;
                resolve(res);
            }
        } catch (e) {
            reject(e);
        }
    })
}

let verifyPasswordRecover = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing parameter ',
                })
            } else {
                let res = await db.User.findOne({
                    where: {
                        id: data.userId,
                        token: data.token
                    },
                    attributes: {
                        exclude: ['password']
                    }
                });

                res.errCode = 0;
                resolve(res);
            }
        } catch (e) {
            reject(e);
        }
    })
}

let handleChangePassword = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing parameter ',
                })
            } else {
                let res = await db.User.findOne({
                    where: {
                        id: data.userId,
                    },
                    raw: false
                });
                console.log("Check res: ", res);
                if (res) {
                    let hashPasswordFromBcrypt = await hashUserPassword(data.password);
                    var token = jwt.sign({ id: data.userId }, config.secret);
                    res.password = hashPasswordFromBcrypt;
                    res.token = token;
                    await res.save();

                    resolve({
                        errCode: 0,
                        message: 'Update user succeeds!'
                    });
                }
            }
        } catch (e) {
            reject(e);
        }
    })
}

let getDoctorComment = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing parameter ',
                })
            } else {
                let res = await db.Comment.findAll({
                    where: {
                        doctorId: data.doctorId,
                    },
                    include: [
                        {
                            model: db.User, as: 'patientDataComment',
                            attributes: ['id', 'firstName', 'lastName'],
                        },
                    ],
                    order: [
                        ['id', 'DESC'],
                    ],
                    raw: true,
                    nest: true,
                });
                if (res) {
                    resolve({
                        errCode: 0,
                        data: res,
                        message: 'Get comment succeeded!'
                    });
                }
            }
        } catch (e) {
            reject(e);
        }
    })
}

let checkUserComment = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing parameter ',
                })
            } else {
                let res = await db.Booking.findOne({
                    where: {
                        doctorId: data.doctorId,
                        patientId: data.patientId,
                        statusId: 'S3',
                    },
                    order: [
                        ['date', 'DESC'],
                    ],
                    raw: true
                });

                if (res.id) {
                    resolve({
                        errCode: 0,
                        data: res,
                        message: 'Check success!'
                    });
                } else {
                    resolve({
                        errCode: 1,
                        message: 'Check success user has not book yet!'
                    })
                }
            }
        } catch (e) {
            reject(e);
        }
    })
}

let handleComment = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing parameter ',
                })
            } else {
                var res = await db.Comment.create({
                    doctorId: data.doctorId,
                    patientId: data.patientId,
                    content: data.content,
                    date: moment().format('YYYYMMDDHHmmss').toString(),
                })

                if (res) {
                    resolve({
                        errCode: 0,
                        data: {
                            id: res.id,
                            content: res.content,
                            doctorId: res.doctorId,
                            patientId: res.patientId,
                        },
                        message: 'Create comment success!'
                    });
                }

            }
        } catch (e) {
            reject(e);
        }
    })
}

let handleDeleteComment = (commentId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!commentId) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing parameter ',
                })
            } else {
                if (!commentId) {
                    resolve({
                        errCode: 2,
                        errMessage: `The ${commentId} does not exist`
                    });
                }

                let res = await db.Comment.destroy({
                    where: { id: commentId },
                });

                if (res) {
                    resolve({
                        errCode: 0,
                        message: 'The comment is now deleted successfully',
                    });
                }
            }
        } catch (e) {
            reject(e);
        }
    })
}

let getDoctorPayment = (doctorId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!doctorId) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing parameter ',
                })
            } else {
                let res = await db.Doctor_Infor.findOne({
                    where: { doctorId: doctorId },
                    attributes: ['paymentId'],
                });

                if (res) {
                    resolve({
                        errCode: 0,
                        data: res,
                        message: 'The payment is now loaded successfully',
                    });
                }
            }
        } catch (e) {
            reject(e);
        }
    })
}

let handleStatisticBookingWeek = () => {
    return new Promise(async (resolve, reject) => {
        try {
            let res = await db.Booking.findAll({
                group: ["date"],
                attributes: ['date', [sequelize.fn('COUNT', 'date'), 'dateCount']],
            })

            if (res) {
                resolve({
                    errCode: 0,
                    data: res,
                    message: 'Statistic is now loaded successfully',
                });
            }

        } catch (e) {
            reject(e);
        }
    })
}

let handleStatisticPatientAddress = () => {
    return new Promise(async (resolve, reject) => {
        try {
            let res = await db.User.findAll({
                where: {
                    roleId: 'R3', address: {
                        [Op.ne]: null
                    }
                },
                group: ["address"],
                attributes: ['address', [sequelize.fn('COUNT', 'address'), 'addressCount']],
            })

            if (res) {
                resolve({
                    errCode: 0,
                    data: res,
                    message: 'Statistic is now loaded successfully',
                });
            }

        } catch (e) {
            reject(e);
        }
    })
}

let handleStatisticCheckoutSuccess = () => {
    return new Promise(async (resolve, reject) => {
        try {
            let res = await db.Checkout.findAll({
                where: {
                    paymentStatus: 'success',
                },
                group: ["paymentDate"],
                attributes: ['paymentDate', [sequelize.fn('COUNT', 'paymentDate'), 'paymentCount']],
            })
            if (res) {
                resolve({
                    errCode: 0,
                    data: res,
                    message: 'Statistic is now loaded successfully',
                });
            }

        } catch (e) {
            reject(e);
        }
    })
}

let getAllBookingUser = (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!userId) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing parameter ',
                })
            } else {
                let res = await db.Booking.findAll({
                    where: {
                        patientId: userId
                    },
                    attributes: ['timeType', 'statusId', 'doctorId', 'date'],
                    include: [
                        {
                            model: db.User,
                            as: 'doctorBookingData',
                            where: {
                                id: { [Op.col]: 'Booking.doctorId' }
                            },
                            attributes: ['firstName', 'lastName'],
                        },
                        {
                            model: db.User,
                            as: 'patientData',
                            where: {
                                id: { [Op.col]: 'Booking.patientId' }
                            },
                            attributes: ['firstName', 'lastName', 'gender', 'address'],
                        },
                        {
                            model: db.Checkout,
                            attributes: ['paymentMethod', 'paymentStatus', 'paymentDate'],
                        },
                        {
                            model: db.Allcode, as: 'timeTypeDataPatient', attributes: ['valueEn', 'valueVi'],
                        }
                    ],
                    raw: false,
                    nest: true
                })

                if (res) {
                    resolve({
                        errCode: 0,
                        data: res,
                        message: 'Statistic is now loaded successfully',
                    });
                }
            }
        } catch (e) {
            console.log(e);
            reject(e);
        }
    })
}

let handleCheckOldPassword = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            let res = await db.User.findOne({
                where: {
                    id: data.userId,
                },
            });

            let check = await bcrypt.compareSync(data.oldPassword, res.password);

            if (check) {
                resolve({
                    errCode: 0,
                    check: check,
                    message: 'Password match',
                });
            }

        } catch (e) {
            console.log(e);
            reject(e);
        }
    })
}

module.exports = {
    handleUserLogin: handleUserLogin,
    getAllUsers: getAllUsers,
    createNewUser: createNewUser,
    updateUserData: updateUserData,
    deleteUser: deleteUser,
    getAllCodeService: getAllCodeService,
    handleUserRegister: handleUserRegister,
    handleGoogleLogin: handleGoogleLogin,
    updateUserInfo: updateUserInfo,
    checkEmail: checkEmail,
    verifyPasswordRecover: verifyPasswordRecover,
    handleChangePassword: handleChangePassword,
    getDoctorComment: getDoctorComment,
    checkUserComment: checkUserComment,
    handleComment: handleComment,
    handleDeleteComment: handleDeleteComment,
    getDoctorPayment: getDoctorPayment,
    handleStatisticBookingWeek: handleStatisticBookingWeek,
    handleStatisticPatientAddress: handleStatisticPatientAddress,
    getAllBookingUser: getAllBookingUser,
    handleCheckOldPassword: handleCheckOldPassword,
    handleStatisticCheckoutSuccess: handleStatisticCheckoutSuccess
}