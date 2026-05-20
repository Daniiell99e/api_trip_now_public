'use strict';

/**
 * Migration: 20260515000001-add-missing-indexes
 *
 * Adiciona os índices identificados como ausentes durante a análise de performance
 * documentada no RITS QA-20260515-PROJETO (Seção 5).
 *
 * Contexto:
 *  - users_idx_email:
 *      A tabela "users" já possui a UNIQUE CONSTRAINT "users_email_key" que cria
 *      internamente um índice btree em (email). Porém a convenção do projeto exige
 *      um índice de busca explícito e nomeado separadamente (tabela_idx_coluna).
 *      Este índice NÃO-ÚNICO complementa a constraint e segue o padrão adotado.
 *
 *  - roteiros_idx_id_user_id:
 *      A busca de atualização de roteiro filtra por (id + user_id) para validar
 *      a propriedade do recurso. Embora id seja PK, o filtro adicional de user_id
 *      impede o uso eficiente do índice primário sozinho. O índice composto elimina
 *      esse problema e foi identificado como completamente ausente.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ── Índice de busca por e-mail (complementa a UNIQUE CONSTRAINT existente) ──
    await queryInterface.addIndex('users', ['email'], {
      name: 'users_idx_email',
      unique: false,  // a unicidade já é garantida pela constraint users_email_key
    });

    // ── Índice composto para atualização/validação de propriedade do roteiro ──
    await queryInterface.addIndex('roteiros', ['id', 'user_id'], {
      name: 'roteiros_idx_id_user_id',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('users',    'users_idx_email');
    await queryInterface.removeIndex('roteiros', 'roteiros_idx_id_user_id');
  },
};
