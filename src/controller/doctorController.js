import doctorService from '../services/doctorService';

let getTopDoctorHome = async (req, res) => {
    let limit = 10;
    
    if(req.query.limit){
        limit = req.query.limit;
    }

    try {
        let response = await doctorService.getTopDoctorHomeService(+limit);
        return res.status(200).json(response);
    } catch(e) {
        console.log(e);
        return res.status(200).json({
            errCode: -1,
            message: 'Error code from server...'
        });
    }
}

module.exports = {
    getTopDoctorHome: getTopDoctorHome
}