const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('users', {
    department: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    employee_id: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    employee_name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    users_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    employee_email: {
      type: DataTypes.STRING(50),
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'users',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "users_pkey",
        unique: true,
        fields: [
          { name: "users_id" },
        ]
      },
    ]
  });
};
