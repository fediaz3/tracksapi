module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('artists', {
    secondId: { //lo tendré porsiacaso, pero no lo voy a usar.
      allowNull: true,
      autoIncrement: true,
      type: Sequelize.INTEGER,
    },

    // de aqui para abajo, es lo relevante
    id: { // se lo tengo que dar en base 64, al crear el objeto artist.
      primaryKey: true,
      allowNull: false,
      type: Sequelize.STRING,
    },

    name: {
      type: Sequelize.STRING,
    },
    age: {
      type: Sequelize.INTEGER,
    },

    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
  }),

  down: (queryInterface) => queryInterface.dropTable('artists'),
};
