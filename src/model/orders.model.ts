import {DataTypes, Model} from 'sequelize'
import { db } from '../database_connection/db_connect'

interface Products{
    item_id:string,
    sku: string,
    name: string,
    ean: string,
    qty: string,
    image_url: string,
    unit: string,
    location: string,
    note: string
}

export type ORDERS = {
    id:string,
    order_id:number,
    carrier:string,
    carrier_product:string,
    carrier_branch_id:string,
    extra_branch_id:string,
    priority:number,
    status:string,
    recipient_name:string,
    recipient_contact:string,
    recipient_street:string,
    recipient_city:string,
    recipient_state:string,
    recipient_zip:string,
    recipient_country_code:string,
    recipient_phone:string,
    recipient_email:string,
    weight:number,
    ic:string,
    dic:string,
    note:string,
    driver_note:string,
    services:[],
    ref:number,
    label:number,
    barcode:number,
    cod_vs:number,
    cod_amount:number,
    cod_currency:string,
    cod_card_payment:boolean,
    ins_amount:number,
    ins_currency:string,
    date_delivery:string,
    date_source:string,
    products:Products[],
}

class Orders extends Model<ORDERS>{}

Orders.init({
    id:{
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false
    },
    order_id:{
        type: DataTypes.BIGINT,
        allowNull:false,
    },
    carrier:{
        type: DataTypes.STRING,
        allowNull:false
    },
    carrier_product:{
        type: DataTypes.STRING,
        allowNull:true
    },
    carrier_branch_id:{
        type: DataTypes.STRING,
        allowNull:true
    },
    extra_branch_id:{
        type: DataTypes.STRING,
        allowNull:true
    },
    priority:{
        type: DataTypes.INTEGER,
        allowNull:false
    },
    status:{
        type: DataTypes.STRING,
        allowNull:false
    },
    recipient_name:{
        type: DataTypes.STRING,
        allowNull:false
    },
    recipient_contact:{
        type: DataTypes.STRING,
        allowNull:false
    },
    recipient_street:{
        type: DataTypes.STRING,
        allowNull:false
    },
    recipient_city:{
        type: DataTypes.STRING,
        allowNull:false
    },
    recipient_state:{
        type: DataTypes.STRING,
        allowNull:false
    },
    recipient_zip:{
        type: DataTypes.STRING,
        allowNull:false
    },
    recipient_country_code:{
        type: DataTypes.STRING,
        allowNull:false
    },
    recipient_phone:{
        type: DataTypes.STRING,
        allowNull:true
    },
    recipient_email:{
        type: DataTypes.STRING,
        allowNull:true
    },
    weight:{
        type: DataTypes.FLOAT,
        allowNull:false
    },
    ic:{
        type: DataTypes.STRING,
        allowNull:true
    },
    dic:{
        type: DataTypes.STRING,
        allowNull:true
    },
    note:{
        type: DataTypes.STRING,
        allowNull:true
    },
    driver_note:{
        type: DataTypes.STRING,
        allowNull:true
    },
    services:{
        type: DataTypes.ARRAY(DataTypes.JSONB),
        allowNull:true
    },
    ref:{
        type: DataTypes.INTEGER,
        allowNull:false
    },
    label:{
        type: DataTypes.INTEGER,
        allowNull:false
    },
    barcode:{
        type: DataTypes.INTEGER,
        allowNull:false
    },
    cod_vs:{
        type: DataTypes.INTEGER,
        allowNull:false
    },
    cod_amount:{
        type: DataTypes.INTEGER,
        allowNull:true
    },
    cod_currency:{
        type: DataTypes.STRING,
        allowNull:false
    },
    cod_card_payment:{
        type: DataTypes.BOOLEAN,
        allowNull:false
    },
    ins_amount:{
        type: DataTypes.FLOAT,
        allowNull:false
    },
    ins_currency:{
        type: DataTypes.STRING,
        allowNull:false
    },
    date_delivery:{
        type: DataTypes.STRING,
        allowNull:true
    },
    date_source:{
        type: DataTypes.STRING,
        allowNull:true
    },
    products:{
        type: DataTypes.ARRAY(DataTypes.JSONB),
        allowNull:false
    },
}, {
    sequelize:db,
    tableName: "Orders",
    modelName: "Orders"
})

export default Orders






