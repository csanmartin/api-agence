const Sequelize = require('sequelize');
const config = require('./config.json');

const sequelize = new Sequelize(
    config.database.database,
    config.database.user,
    config.database.password,
    {
        host: config.database.host,
        dialect: 'mysql',
        logging: false,
        operatorsAliases: false
    }
);

module.exports = sequelize;