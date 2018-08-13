'use strict';
module.exports = (sequelize, DataTypes) => {
    var Model = sequelize.define('Vote', {
        id: {
            field: 'vote_id',
            type: DataTypes.INTEGER,
            primaryKey: true
        },
        userId: {
            field: 'user_id',
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'User',
                key: 'id'
            }
        },
        reviewId: {
            field: 'review_id',
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'Review',
                key: 'id'
            }
        },
        voteType: {
            field: 'vote_type',
            type: DataTypes.BOOLEAN
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
        tableName: 'vote'
    });

    Model.associate = function(models){
        this.Review = this.belongsTo(models.Review, {
            foreignKey: 'reviewId'
        });
        this.User = this.belongsTo(models.User, {
            foreignKey: 'userId'
        });
    };
    Model.prototype.toWeb = function (pw) {
        let json = this.toJSON();
        return json;
    };

    return Model;
};
