const db = require('../../database');
const RoteiroAtracao = require('../models/RoteiroAtracao'); 
const Roteiro = require('../models/Roteiro');
const AtracoesTuristicas = require('../models/AtracaoTuristica');
const LogsAtividades = require('../models/LogsAtividades');
const { cloudinary } = require('../../configs/cloudinary');

class RoteiroAtracaoController {

  /**
   * Adiciona uma nova atração a um roteiro existente.
   */
  async create(req, res) {
    const t = await db.connection.transaction();
    try {
      const { roteiroId } = req.params;
      const { userId } = req;
      const {
        atracao_id,
        nova_atracao,
        numero_dia,
        horario_inicio, 
        horario_fim,
        ordem_no_dia,
        anotacoes
      } = req.body;

      // 1. Verifica roteiro e permissão
      const roteiro = await Roteiro.findOne({
        where: { id: roteiroId, user_id: userId },
        transaction: t
      });

      if (!roteiro) {
        await t.rollback();
        return res.status(404).json({ message: 'Roteiro não encontrado ou sem permissão.' });
      }

      let atracaoInstance;

      // Define ou Cria a Atração
      if (atracao_id) {
        // Se veio ID, buscamos a instância para ter os dados completos (nome, imagem, etc)
        atracaoInstance = await AtracoesTuristicas.findByPk(atracao_id, { transaction: t });
      } else if (nova_atracao && nova_atracao.nome) {
        const [atracao] = await AtracoesTuristicas.findOrCreate({
          where: { nome: nova_atracao.nome, cidade_id: roteiro.cidade_id },
          defaults: {
            ...nova_atracao,
            cidade_id: roteiro.cidade_id,
            latitude: nova_atracao.latitude || 0,
            longitude: nova_atracao.longitude || 0,
            preco_estimado: nova_atracao.valor || nova_atracao.price || 0
          },
          transaction: t
        });
        atracaoInstance = atracao;
      } else {
        await t.rollback();
        return res.status(400).json({ message: 'Forneça "atracao_id" ou "nova_atracao".' });
      }
      // Validação básica de horário
      if (horario_inicio && horario_fim && horario_fim < horario_inicio) {
        await t.rollback();
        return res.status(400).json({ message: 'O horário de término não pode ser anterior ao horário de início.' });
      }

      // Cria o vínculo
      const novaAtividade = await RoteiroAtracao.create({
        roteiro_id: roteiroId,
        atracao_id: atracaoInstance.id,
        horario_inicio, 
        horario_fim,
        ordem_no_dia: ordem_no_dia || 1,
        anotacoes,
        status: 'pendente'
      }, { transaction: t });

      await t.commit();

      const respostaSegura = {
          id: novaAtividade.id,
          roteiro_id: roteiroId,
          numero_dia: numero_dia,
          horario_inicio: horario_inicio,
          horario_fim: horario_fim,
          atracao: atracaoInstance
      };

      return res.status(201).json(respostaSegura);

    } catch (error) {
      await t.rollback();
      console.error('Erro ao adicionar atração:', error);
      return res.status(500).json({ message: 'Falha ao adicionar atração.', details: error.message });
    }
  }

  /* Atualiza uma atividade (dia, horário, ordem).*/
  async update(req, res) {
    try {
      const { roteiroAtracaoId } = req.params;
      const { userId } = req;
      const { numero_dia, horario_inicio, horario_fim, ordem_no_dia, anotacoes } = req.body;

      const atividade = await RoteiroAtracao.findOne({
        where: { id: roteiroAtracaoId },
        include: [{
          model: Roteiro,
          as: 'roteiro', // Verifique se o alias no Model RoteiroAtracao é 'roteiro'
          attributes: ['user_id']
        }]
      });

      if (!atividade) return res.status(404).json({ message: 'Atividade não encontrada.' });
      
      if (atividade.roteiro.user_id !== userId) {
        return res.status(403).json({ message: 'Sem permissão.' });
      }
      // Validação: garante que não gravem o fim antes do início
      if (horario_inicio && horario_fim && horario_fim < horario_inicio) {
        return res.status(400).json({ message: 'O horário de término não pode ser anterior ao horário de início.' });
      }


      const atividadeAtualizada = await atividade.update({
        numero_dia, horario_inicio, horario_fim, ordem_no_dia, anotacoes
      });

      return res.status(200).json(atividadeAtualizada);
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      return res.status(500).json({ message: 'Falha ao atualizar.', details: error.message });
    }
  }

  /* Deleta uma atividade.*/
  async delete(req, res) {
    try {
      const { roteiroAtracaoId } = req.params;
      const { userId } = req;

      const atividade = await RoteiroAtracao.findOne({
        where: { id: roteiroAtracaoId },
        include: [{
          model: Roteiro,
          as: 'roteiro',
          attributes: ['user_id']
        }]
      });

      if (!atividade) return res.status(404).json({ message: 'Atividade não encontrada.' });

      if (atividade.roteiro.user_id !== userId) {
        return res.status(403).json({ message: 'Sem permissão.' });
      }

      await atividade.destroy();

      return res.status(200).json({ message: 'Atividade removida.' });
    } catch (error) {
      console.error('Erro ao deletar:', error);
      return res.status(500).json({ message: 'Falha ao deletar.', details: error.message });
    }
  }
  /**
   * Faz o upload de uma foto para uma atividade específica e registra no log.
   */
  async uploadFoto(req, res) {
    try {
      const { id } = req.params; // ID da RoteiroAtracao (atividade)
      const { userId } = req;

      // 1. Validar se o arquivo foi processado pelo Multer/Cloudinary
      if (!req.file) {
        return res.status(400).json({ message: 'Nenhuma imagem foi enviada.' });
      }

      // 2. Localizar a atividade e verificar se o roteiro pertence ao usuário logado
      const atividade = await RoteiroAtracao.findOne({
        where: { id },
        include: [{
          model: Roteiro,
          as: 'roteiro',
          attributes: ['user_id']
        }]
      });

      if (!atividade) {
        return res.status(404).json({ message: 'Atividade não encontrada.' });
      }

      if (atividade.roteiro.user_id !== userId) {
        return res.status(403).json({ message: 'Você não tem permissão para alterar este roteiro.' });
      }

      const imageUrl = req.file.path; // URL gerada pelo Cloudinary

      // 3. Atualizar o banco de dados (Adicionando ao ARRAY do Postgres)
      // Usamos array_append para manter as fotos anteriores
      await atividade.update({
        fotos: db.connection.fn('array_append', db.connection.col('fotos'), imageUrl)
      });

      // 4. Registrar a ação no LogsAtividades
      await LogsAtividades.create({
        user_id: userId,
        tipo_acao: 'UPLOAD_FOTO',
        tipo_entidade: 'ROTEIRO_ATRACAO',
        entidade_id: id,
        descricao: `Usuário adicionou uma nova foto ao passeio no roteiro.`,
        endereco_ip: req.ip,
        user_agent: req.headers['user-agent']
      });

      return res.status(200).json({
        message: 'Foto adicionada com sucesso!',
        url: imageUrl
      });

    } catch (error) {
      console.error('Erro ao fazer upload de foto:', error);
      return res.status(500).json({ 
        message: 'Falha ao processar upload.', 
        details: error.message 
      });
    }
  }
  /**
   * Remove uma foto específica de uma atividade, tanto do Cloudinary quanto do banco de dados.
   */
  async removerFoto(req, res) {
    try {
      const { id } = req.params; // ID da RoteiroAtracao (atividade)
      const { userId } = req;
      const { fotoUrl } = req.body; // URL da imagem enviada pelo frontend

      if (!fotoUrl) {
        return res.status(400).json({ message: 'A URL da foto é obrigatória para exclusão.' });
      }

      // 1. Localizar a atividade e verificar se o roteiro pertence ao usuário logado
      const atividade = await RoteiroAtracao.findOne({
        where: { id },
        include: [{
          model: Roteiro,
          as: 'roteiro',
          attributes: ['user_id']
        }]
      });

      if (!atividade) {
        return res.status(404).json({ message: 'Atividade não encontrada.' });
      }

      if (atividade.roteiro.user_id !== userId) {
        return res.status(403).json({ message: 'Você não tem permissão para alterar este roteiro.' });
      }

      // 2. Extrair o Public ID do Cloudinary a partir da URL
      const urlParts = fotoUrl.split('/');
      const arquivoComExtensao = urlParts.pop(); // ex: "imagem.jpg"
      const pasta = urlParts.pop(); // ex: "fotos"
      const nomeArquivo = arquivoComExtensao.split('.')[0]; // ex: "imagem"
      
      const publicId = `${pasta}/${nomeArquivo}`;

      // 3. Deletar a imagem fisicamente do Cloudinary
      await cloudinary.uploader.destroy(publicId);

      // 4. Atualizar o banco de dados (Removendo a URL específica do ARRAY do Postgres)
      await atividade.update({
        fotos: db.connection.fn('array_remove', db.connection.col('fotos'), fotoUrl)
      });

      // 5. Registrar a ação no LogsAtividades
      await LogsAtividades.create({
        user_id: userId,
        tipo_acao: 'EXCLUIR_FOTO',
        tipo_entidade: 'ROTEIRO_ATRACAO',
        entidade_id: id,
        descricao: `Usuário removeu uma foto do passeio no roteiro.`,
        endereco_ip: req.ip,
        user_agent: req.headers['user-agent']
      });

      // Retorna 204 No Content (Padrão de sucesso para DELETE, sem corpo na resposta)
      return res.status(204).send();

    } catch (error) {
      console.error('Erro ao excluir foto:', error);
      return res.status(500).json({ 
        message: 'Falha ao processar a exclusão da foto.', 
        details: error.message 
      });
    }
  }

}


module.exports = new RoteiroAtracaoController();