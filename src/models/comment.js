'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Comment extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            Comment.belongsTo(models.User, { foreignKey: 'doctorId', targetKey: 'id', as: 'doctorDataComment' });
            Comment.belongsTo(models.User, { foreignKey: 'patientId', targetKey: 'id', as: 'patientDataComment' });
        }
    };
    Comment.init({
        content: DataTypes.STRING,
        doctorId: DataTypes.INTEGER,
        patientId: DataTypes.INTEGER,
        date: DataTypes.STRING,
    }, {
        sequelize,
        modelName: 'Comment',
    });
    return Comment;
};