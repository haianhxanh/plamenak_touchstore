"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const db_connect_1 = require("../database_connection/db_connect");
class Orders extends sequelize_1.Model {
}
Orders.init({
    order_id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        allowNull: false,
    },
    carrier: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    carrier_product: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    carrier_branch_id: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    extra_branch_id: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    priority: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    recipient_name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    recipient_contact: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    recipient_street: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    recipient_city: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    recipient_state: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    recipient_zip: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    recipient_country_code: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    recipient_phone: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    recipient_email: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    weight: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
    },
    ic: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    dic: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    note: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    driver_note: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    services: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.JSONB),
        allowNull: true,
    },
    ref: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    label: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    barcode: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    cod_vs: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    cod_amount: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    cod_currency: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    cod_card_payment: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
    },
    ins_amount: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
    },
    ins_currency: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    date_delivery: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    date_source: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    products: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.JSONB),
        allowNull: false,
    },
}, {
    sequelize: db_connect_1.db,
    tableName: "Orders",
    modelName: "Orders",
});
exports.default = Orders;
