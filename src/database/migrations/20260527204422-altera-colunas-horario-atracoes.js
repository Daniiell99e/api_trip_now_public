'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('roteiro_atracoes', 'horario');
    
    await queryInterface.addColumn('roteiro_atracoes', 'horario_inicio', {
      type: Sequelize.STRING(50),
      allowNull: true
    });

    await queryInterface.addColumn('roteiro_atracoes', 'horario_fim', {
      type: Sequelize.STRING(50),
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('roteiro_atracoes', 'horario_inicio');
    await queryInterface.removeColumn('roteiro_atracoes', 'horario_fim');
    
    await queryInterface.addColumn('roteiro_atracoes', 'horario', {
      type: Sequelize.STRING(50),
      allowNull: true
    });
  }
};