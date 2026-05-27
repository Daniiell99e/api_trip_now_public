'use strict';
const { Model, Sequelize } = require('sequelize');

class RoteiroAtracoes extends Model {
  
  static init(sequelize) {
    super.init({
      // 1. Declarar o ID explicitamente para o Sequelize não ignorar
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },  
      roteiro_id: Sequelize.INTEGER,
      atracao_id: Sequelize.INTEGER,
      numero_dia: Sequelize.INTEGER,
      horario_inicio: Sequelize.STRING,
      horario_fim: Sequelize.STRING,
      ordem_no_dia: Sequelize.INTEGER,
      anotacoes: Sequelize.TEXT,
      // 2. Avisar ao modelo que a coluna fotos agora existe no banco
      fotos: Sequelize.ARRAY(Sequelize.STRING),
    }, {
      sequelize,
      modelName: 'RoteiroAtracoes',
      tableName: 'roteiro_atracoes',
      timestamps: true,
      createdAt: 'criado_em',
      updatedAt: false,
    });
    return this;
  }
  
  static associate(models) {
      this.belongsTo(models.Roteiro, { foreignKey: 'roteiro_id', as: 'roteiro' });
      this.belongsTo(models.AtracoesTuristicas, { foreignKey: 'atracao_id', as: 'atracao' });
  }
}

module.exports = RoteiroAtracoes;
