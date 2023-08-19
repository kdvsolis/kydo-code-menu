const DBConfig = JSON.parse(process.env.DB);
const Sequelize = require("sequelize");
const initModels = require("./../models/init-models");

const sequelize = new Sequelize(
  DBConfig.database,
  DBConfig.user,
  DBConfig.password,
  DBConfig
);

const db = initModels(sequelize);
(async () => {
  await db.users.sync({ force: false });
})();

module.exports = db;
