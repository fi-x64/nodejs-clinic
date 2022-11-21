import db from '../models/index';
import sequelize, { Op } from "sequelize";

let handleSearchService = (searchData) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!searchData) {
                resolve({
                    errCode: 1,
                    errMessage: "Missing parameter"
                })
            } else {
                const Op = sequelize.Op;
                let clinics = await db.Clinic.findAll({
                    where: {
                        [Op.or]: [
                            { name: { [Op.like]: '%' + searchData + '%' } },
                            { address: { [Op.like]: '%' + searchData + '%' } },
                        ],
                    }
                })
                let specialties = await db.Specialty.findAll({
                    where: { name: { [Op.like]: '%' + searchData + '%' } }
                })
                let users = await db.User.findAll({
                    where: {
                        [Op.or]: [
                            { firstName: { [Op.like]: '%' + searchData + '%' } },
                            { lastName: { [Op.like]: '%' + searchData + '%' } },
                            { email: { [Op.like]: '%' + searchData + '%' } },
                        ],
                        roleId: 'R2',
                    }
                })
                let result = {
                    clinics,
                    specialties,
                    users,
                }
                resolve({
                    errCode: 0,
                    errMessage: "OK",
                    result
                })
            }
        } catch (e) {
            reject(e);
        }
    })
}

module.exports = {
    handleSearchService
}