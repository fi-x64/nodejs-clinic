import userService from "../services/userService";

let handleLogin = async (req, res) => {
    let email = req.body.email;
    let password = req.body.password;

    if (!email || !password) {
        return res.status(500).json({
            errCode: 1,
            accessToken: null,
            message: 'Missing input parameters',
        })
    }

    let userData = await userService.handleUserLogin(email, password);
    // check email exists
    //compare password
    return res.status(200).json({
        errCode: userData.errCode,
        message: userData.errMessage,
        accessToken: userData.accessToken,
        user: userData.user ? userData.user : {}
    });
}

let handleGoogleLogin = async (req, res) => {
    if (!req.body.googleResponse) {
        return res.status(500).json({
            errCode: 1,
            accessToken: null,
            message: 'Missing input parameters',
        })
    }

    let userData = await userService.handleGoogleLogin(req.body.googleResponse);
    return res.status(200).json({
        errCode: userData.errCode,
        message: userData.errMessage,
        accessToken: userData.accessToken,
        googleId: req.body.googleResponse.googleId,
        imgGoogle: req.body.googleResponse.profileObj.imgUrl,
        user: userData.user ? userData.user : {}
    });
}

let handleRegister = async (req, res) => {
    let email = req.body.email;
    let password = req.body.password;
    let confirmPassword = req.body.confirmPassword;
    let address = req.body.address;
    let firstName = req.body.firstName;
    let lastName = req.body.lastName;

    if (!email || !password || !confirmPassword || !firstName || !lastName || !address) {
        return res.status(500).json({
            errCode: 1,
            accessToken: null,
            message: 'Missing input parameters',
        })
    }

    let userData = await userService.handleUserRegister({ email, password, confirmPassword, email, address, firstName, lastName });
    // check email exists
    //compare password
    return res.status(200).json({
        errCode: userData.errCode,
        message: userData.errMessage,
        user: userData.user ? userData.user : {}
    });
}

let handleGetAllUsers = async (req, res) => {
    let id = req.query.id; //ALL, id

    if (!id) {
        return res.status(200).json({
            errCode: 1,
            errMessage: 'Missing required parameter',
            users: []
        })
    }

    let users = await userService.getAllUsers(id);
    return res.status(200).json({
        errCode: 0,
        errMessage: 'OK',
        users
    })
}

let handleCreateNewUser = async (req, res) => {
    let message = await userService.createNewUser(req.body);
    return res.status(200).json(message);
}

let handleEditUser = async (req, res) => {
    let data = req.body;
    let message = await userService.updateUserData(data);
    return res.status(200).json(message);
}

let updateUserInfo = async (req, res) => {
    let data = req.body;
    let message = await userService.updateUserInfo(data);
    return res.status(200).json(message);
}

let handleDeleteUser = async (req, res) => {
    if (!req.body.id) {
        return res.status(200).json({
            errCode: 1,
            errMessage: 'Missing required parameters!'
        })
    }
    let message = await userService.deleteUser(req.body.id);
    return res.status(200).json(message);
}

let getAllCode = async (req, res) => {
    try {
        let data = await userService.getAllCodeService(req.query.type);
        return res.status(200).json(data);

    } catch (e) {
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server'
        });
    }
}

module.exports = {
    handleLogin: handleLogin,
    handleGetAllUsers: handleGetAllUsers,
    handleCreateNewUser: handleCreateNewUser,
    handleEditUser: handleEditUser,
    handleDeleteUser: handleDeleteUser,
    getAllCode: getAllCode,
    handleRegister: handleRegister,
    handleGoogleLogin: handleGoogleLogin,
    updateUserInfo: updateUserInfo,
}