const Sequelize = require('sequelize');
const Users = require('../apps/models/Users');
const Roteiro = require('../apps/models/Roteiro');
const TransacoesReceita = require('../apps/models/TransacoesReceita');
const RoteiroAtracao = require('../apps/models/RoteiroAtracao');
const RoteiroTags = require('../apps/models/RoteiroTags');
const RoteiroCurtida = require('../apps/models/RoteiroCurtida');
const RoteiroComentarios = require('../apps/models/RoteiroComentarios');
const UserCupom = require('../apps/models/UserCupom');
const RoteiroDespesas = require('../apps/models/RoteiroDespesas');
const RoteirosSalvos = require('../apps/models/RoteirosSalvos');
const UserSeguidores = require('../apps/models/UserSeguidores');
const Notificacoes = require('../apps/models/Notificacoes');
const LogsAtividades = require('../apps/models/LogsAtividades');
const PreferenciasUsuario = require('../apps/models/PreferenciasUsuario');
const InteressesUsuario = require('../apps/models/InteressesUsuario');
const Parceiro = require('../apps/models/Parceiro');
const Cupom = require('../apps/models/Cupom');
const AtracoesTuristicas = require('../apps/models/AtracaoTuristica');
const Cidade = require('../apps/models/Cidade');
const Pais = require('../apps/models/Pais');
const Conquista = require('../apps/models/Conquista');
const ConquistasUsuario = require('../apps/models/ConquistasUsuario');
const Relatorios = require('../apps/models/Relatorios');
const ConfiguracoesSistema = require('../apps/models/ConfiguracoesSistema');
const UserPaisesVisitados = require('../apps/models/UserPaisesVisitados');
const Assinatura = require('../apps/models/Assinatura');
const AnalyticsCupons = require('../apps/models/AnalyticsCupons');

const models = [
    Users, Roteiro, TransacoesReceita, RoteiroAtracao, RoteiroTags, RoteiroCurtida, RoteiroComentarios, UserCupom,
    RoteiroDespesas, RoteirosSalvos, UserSeguidores, Notificacoes, LogsAtividades,
    PreferenciasUsuario, InteressesUsuario, Parceiro, Cupom, AtracoesTuristicas, Cidade, Pais, Conquista, ConquistasUsuario,
    Relatorios, ConfiguracoesSistema, UserPaisesVisitados, Assinatura, AnalyticsCupons
];
const databaseConfig = require('../configs/db');


class Database {

    constructor() {
        this.init();
    }

    init() {
        //this.connection = new Sequelize(databaseConfig);
        this.connection = new Sequelize({
            ...databaseConfig,
            // logging: console.log, // Habilita o log de queries no terminal para análise de performance
        });


        models
          .map(model => model.init(this.connection))
          .map(model => model.associate && model.associate(this.connection.models));
    }
}

module.exports = new Database();