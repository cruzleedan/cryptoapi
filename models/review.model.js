'use strict';
module.exports = (sequelize, DataTypes) => {
    
    const Model = sequelize.define('Review', {
        id: {
            field: 'review_id',
            type: DataTypes.INTEGER,
            primaryKey: true
        },
        entityId: {
            field: 'entity_id',
            type: DataTypes.INTEGER,
            references: {
                model: 'Entity',
                key: 'id'
            }
        },
        userId: {
            field: 'user_id',
            type: DataTypes.INTEGER,
            references: {
                model: 'User',
                key: 'id'
            }
        },
        title: {
            field: 'review_title',
            type: DataTypes.STRING
        },
        review: {
            type: DataTypes.TEXT
        },
        upvoteTally: {
            field: 'upvote_tally',
            type: DataTypes.INTEGER
        },
        downvoteTally: {
            field: 'downvote_tally',
            type: DataTypes.INTEGER
        },
        rating: {
            type: DataTypes.DECIMAL(10, 0)
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

        freezeTableName: true
    });
    
    Model.associate = (models) => {
        this.Entity = Model.belongsTo(models.Entity, {
            foreignKey: 'entity_id'
        });
        this.User = Model.belongsTo(models.User, {
            foreignKey: 'user_id'
        });
    };

    Model.prototype.toWeb = (pw) => {
        let json = this.toJSON();
        return json;
    };
    
    return Model;
};