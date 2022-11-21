import db from "../models/index";
const config = require("../config/auth.config");
import bcrypt from "bcrypt";
var jwt = require("jsonwebtoken");

const salt = bcrypt.genSaltSync(10);

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
    console.log('Check data: ', data);
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
}