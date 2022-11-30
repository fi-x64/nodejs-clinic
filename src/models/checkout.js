'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Checkout extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            Checkout.belongsTo(models.Booking, { foreignKey: 'bookingId' });
        }
    };
    Checkout.init({
        bookingId: DataTypes.INTEGER,
        paymentMethod: DataTypes.STRING,
        paymentStatus: DataTypes.STRING,
        paymentDate: DataTypes.STRING,
    }, {
        sequelize,
        modelName: 'Checkout',
    });
    return Checkout;
};