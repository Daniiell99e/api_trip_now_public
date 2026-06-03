require('dotenv').config();

module.exports = {
    dialect: process.env.DIALECT,
    host:process.env.HOST,
    username: process.env.DB_USERNAME,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    port: process.env.DB_PORT,
    pexelsApiKey: process.env.PEXELS_API_KEY,
    define: {
        timestamps: true,
        underscored: true,
        underscoredAll: true
    },

     // Adicione isso temporariamente para capturar o SQL:
  // logging: (sql, timing) => {
  //   console.log('=== SQL QUERY ===');
  //   console.log(sql);
  //   console.log(`Tempo: ${timing}ms`);
  //   console.log('=================');
  // },
  // benchmark: true  // mostra o tempo de execução de cada query
}