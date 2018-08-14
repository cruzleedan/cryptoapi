'use strict';
module.exports = (sequelize, DataTypes) => {
    var Model = sequelize.define('Category', {
        id: {
            field: 'entity_category_id',
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        category: {
            type: DataTypes.STRING
        },
        icon: {
            type: DataTypes.STRING
        },
        deletedAt: {
            field: 'delete_time',
            type: DataTypes.DATE
        },
        createdAt: {
            field: 'create_time',
            type: DataTypes.DATE
        },
        updatedAt: {
            field: 'update_time',
            type: DataTypes.DATE
        }
    }, {
        timestamps: true,
        createdAt: 'create_time',
        updatedAt: 'update_time',
        deletedAt: 'delete_time',
        paranoid: true,

        freezeTableName: true,
        tableName: 'entity_category'
    });

    Model.associate = function (models) {
        this.Entities = this.hasMany(models.Entity, {
            foreignKey: 'categoryId'
        });
    }

    Model.prototype.toWeb = function (pw) {
        let json = this.toJSON();
        return json;
    };

    return Model;
};
