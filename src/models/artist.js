module.exports = (sequelize, DataTypes) => {
  const artist = sequelize.define('artist', {
    id: DataTypes.STRING,
    name: DataTypes.STRING,
    age: DataTypes.INTEGER,
  }, {});

  artist.associate = function associate() {
    // associations can be defined here. This method receives a models parameter.
  };

  return artist;
};
