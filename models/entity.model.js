'use strict';
module.exports = (sequelize, DataTypes) => {
    var Model = sequelize.define('Entity', {
        id: {
            field: 'entity_id',
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        categoryId: {
            field: 'entity_category_id',
            type: DataTypes.INTEGER,
            references: {
                model: 'Category',
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
        name: {
            field: 'entity_name',
            type: DataTypes.STRING
        },
        desc: {
            field: 'entity_desc',
            type: DataTypes.TEXT
        },
        rating: {
            field: 'overall_rating',
            type: DataTypes.DECIMAL(10, 3)
        },
        reviewCount: {  
            field: 'review_count',
            type: DataTypes.INTEGER
        },
        links: {
            type: DataTypes.JSON
        },
        image: {
            type: DataTypes.STRING
        },
        address: {
            type: DataTypes.TEXT
        },
        phone: {
            type: DataTypes.STRING
        },
        email: {
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
        tableName: 'entity'
    });

    Model.associate = function(models){
        this.Category = this.belongsTo(models.Category, {
            foreignKey: 'categoryId'
        });
        this.User = this.belongsTo(models.User, {
            foreignKey: 'userId'
        });
        this.Reviews = this.hasMany(models.Review, {
            foreignKey: 'entityId'
        });
    };
    Model.prototype.toWeb = function (pw) {
        let json = this.toJSON();
        return json;
    };

    return Model;
};
