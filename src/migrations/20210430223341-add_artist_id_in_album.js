'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.addColumn(
    'albums', // name of Source model //tabla
    'artistId', // name of the key we're adding //llave foranea que agrego
    {
      type: Sequelize.STRING,
      references: {
        model: 'artists', // name of Target model // tabla donde esta la llave foranea
        key: 'id', // key in Target model that we're referencing // y es el id
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
  ),

  down: (queryInterface, Sequelize) => queryInterface.removeColumn(
    'albums', // name of Source model
    'artistId', // key we want to remove
  ),
};
