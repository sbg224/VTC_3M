const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DB_PATH || path.join(__dirname, '../../database.sqlite'),
  logging: false,
});

const Driver = require('./Driver')(sequelize);
const Reservation = require('./Reservation')(sequelize);

module.exports = { sequelize, Driver, Reservation };
