import doctorService from '../services/doctorService';

let getTopDoctorHome = async (req, res) => {
    let limit = 10;

    if (req.query.limit) {
        limit = req.query.limit;
    }

    try {
        let response = await doctorService.getTopDoctorHome(+limit);
        return res.status(200).json(response);
    } catch (e) {
        console.log(e);
        return res.status(200).json({
            errCode: -1,
            message: 'Error code from server...'
        });
    }
}

let getAllDoctors = async (req, res) => {
    try {
        let doctors = await doctorService.getAllDoctors();
        return res.status(200).json(doctors);
    } catch (e) {
        console.log(e);
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error code from server...'
        })
    }
}

let postInforDoctor = async (req, res) => {
    try {
        let response = await doctorService.saveDetailInforDoctor(req.body);
        return res.status(200).json(response);
    } catch (e) {
        console.log(e);
    }
}

let getDetailDoctorById = async (req, res) => {
    try {
        let infor = await doctorService.getDetailDoctorById(req.query.id);
        return res.status(200).json(
            infor
        )
    } catch (e) {
        console.log(e);
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from the server'
        })
    }
}

let bulkCreateSchedule = async (req, res) => {
    console.log("Check req.body: ", req.body);
    try {
        let infor = await doctorService.bulkCreateSchedule(req.body);
        return res.status(200).json({
            infor
        })
    } catch (e) {
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from the server'
        })
    }
}

module.exports = {
    getTopDoctorHome: getTopDoctorHome,
    getAllDoctors: getAllDoctors,
    postInforDoctor: postInforDoctor,
    getDetailDoctorById: getDetailDoctorById,
    bulkCreateSchedule: bulkCreateSchedule,
}