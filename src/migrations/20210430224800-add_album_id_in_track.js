'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.addColumn(
    'tracks', // name of Source model //tabla
    'albumId', // name of the key we're adding //llave foranea que agrego
    {
      type: Sequelize.STRING,
      references: {
        model: 'albums', // name of Target model // tabla donde esta la llave foranea
        key: 'id', // key in Target model that we're referencing // y es el id
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
  ),

  down: (queryInterface, Sequelize) => queryInterface.removeColumn(
    'tracks', // name of Source model
    'albumId', // key we want to remove
  ),
};
