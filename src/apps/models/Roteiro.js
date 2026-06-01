'use strict';
const { Model, Sequelize } = require('sequelize');

class Roteiro extends Model {
  
  static init(sequelize) {
    super.init({
      user_id: Sequelize.INTEGER,
      cidade_id: Sequelize.INTEGER,
      titulo: Sequelize.STRING,
      descricao: Sequelize.TEXT,
      duracao_dias: Sequelize.INTEGER,
      data_inicio: Sequelize.DATEONLY,
      numero_pessoas: Sequelize.INTEGER,
      horario_preferencial: Sequelize.STRING,
      orcamento_total: Sequelize.DECIMAL,
      moeda: Sequelize.STRING,
      status: Sequelize.ENUM('planejado', 'em_andamento', 'concluido', 'cancelado'),
      e_publico: Sequelize.BOOLEAN,
      permitir_comentarios: Sequelize.BOOLEAN,
      permitir_copia: Sequelize.BOOLEAN,
      mostrar_custos: Sequelize.BOOLEAN,
      url_imagem_capa: Sequelize.TEXT,
      contagem_visualizacoes: Sequelize.INTEGER,
      contagem_compartilhamentos: Sequelize.INTEGER,
      contagem_copias: Sequelize.INTEGER,
      avaliacao: Sequelize.INTEGER,
    }, {
      sequelize,
      modelName: 'Roteiro',
      tableName: 'roteiros',
      timestamps: true,
      createdAt: 'criado_em',
      updatedAt: 'atualizado_em',
    });
    return this;
  }

  static associate(models) {
      this.belongsTo(models.Users, { foreignKey: 'user_id', as: 'usuario' });
      this.belongsTo(models.Cidade, { foreignKey: 'cidade_id', as: 'cidade' });

      this.hasMany(models.RoteiroAtracoes, { foreignKey: 'roteiro_id', as: 'roteiroAtracoes', onDelete: 'CASCADE' });
      this.hasMany(models.RoteiroTags, { foreignKey: 'roteiro_id', as: 'tags', onDelete: 'CASCADE' });
      this.hasMany(models.RoteiroCurtida, { foreignKey: 'roteiro_id', as: 'curtidas', onDelete: 'CASCADE' });
      this.hasMany(models.RoteiroComentarios, { foreignKey: 'roteiro_id', as: 'comentarios', onDelete: 'CASCADE' });
      this.hasMany(models.UserCupom, { foreignKey: 'roteiro_id', as: 'cuponsUsados', onDelete: 'CASCADE' });
      this.hasMany(models.RoteiroDespesas, { foreignKey: 'roteiro_id', as: 'despesas', onDelete: 'CASCADE' });
      this.hasMany(models.RoteirosSalvos, { foreignKey: 'roteiro_id', as: 'salvosPor', onDelete: 'CASCADE' });
      this.hasMany(models.TransacoesReceita, { foreignKey: 'roteiro_id', as: 'transacoes', onDelete: 'CASCADE' });

      this.belongsToMany(models.AtracoesTuristicas, {
        through: models.RoteiroAtracoes,
        foreignKey: 'roteiro_id',
        otherKey: 'atracao_id',
        as: 'atracoes',
      });
      this.belongsToMany(models.Users, {
        through: models.RoteiroCurtida,
        foreignKey: 'roteiro_id',
        otherKey: 'user_id',
        as: 'curtidoPorUsuarios',
      });
      this.belongsToMany(models.Users, {
        through: models.RoteirosSalvos,
        foreignKey: 'roteiro_id',
        otherKey: 'user_id',
        as: 'salvoPorUsuarios',
      });
    }
}

module.exports = Roteiro;
