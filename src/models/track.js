module.exports = (sequelize, DataTypes) => {
  const track = sequelize.define('track', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: DataTypes.STRING,
    duration: DataTypes.FLOAT,
    timesPlayed: DataTypes.INTEGER,
  }, {});

  track.associate = function associate(models) {
    // associations can be defined here. This method receives a models parameter.
    track.belongsTo(models.album)
  };

  return track;
};
