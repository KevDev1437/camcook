const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Question = sequelize.define('Question', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  menuItemId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'menu_items',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Question cannot be empty' },
      len: {
        args: [5, 500],
        msg: 'Question must be between 5 and 500 characters'
      }
    }
  },
  answer: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Answer from CamCook staff'
  },
  answeredBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID of staff member who answered'
  },
  answeredAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the question was answered'
  },
  status: {
    type: DataTypes.ENUM('unanswered', 'answered'),
    defaultValue: 'unanswered'
  },
  helpfulCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of people who found this question/answer helpful'
  }
}, {
  tableName: 'questions',
  timestamps: true,
  indexes: [
    { fields: ['menuItemId'] },
    { fields: ['userId'] },
    { fields: ['status'] }
  ]
});

module.exports = Question;
