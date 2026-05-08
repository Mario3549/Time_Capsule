module.exports = (sequelize, DataTypes) => {
  const PasswordReset = sequelize.define('PasswordReset', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    token: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true,
        notEmpty: true
      }
    },
    isUsed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true
      }
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    ipAddress: {
      type: DataTypes.STRING(45), // IPv6 compatible
      allowNull: true
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    newPasswordHash: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'password_resets',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['token']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['email']
      },
      {
        fields: ['isUsed']
      },
      {
        fields: ['expiresAt']
      },
      {
        fields: ['createdAt']
      }
    ],
    hooks: {
      beforeCreate: (reset) => {
        // Ensure email is lowercase
        if (reset.email) {
          reset.email = reset.email.toLowerCase().trim();
        }
      }
    }
  });

  // Instance methods
  PasswordReset.prototype.isExpired = function() {
    return new Date() > this.expiresAt;
  };

  PasswordReset.prototype.markAsUsed = async function(newPasswordHash, ipAddress = null, userAgent = null) {
    this.isUsed = true;
    this.usedAt = new Date();
    this.newPasswordHash = newPasswordHash;
    if (ipAddress) this.ipAddress = ipAddress;
    if (userAgent) this.userAgent = userAgent;
    await this.save();
  };

  // Class methods
  PasswordReset.cleanupExpired = async function() {
    const expiredCount = await this.destroy({
      where: {
        expiresAt: {
          [sequelize.Sequelize.Op.lt]: new Date()
        }
      }
    });
    return expiredCount;
  };

  return PasswordReset;
};

