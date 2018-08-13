'use strict';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { TE, to } = require('../services/util.service');
const CONFIG = require('../config');
module.exports = (sequelize, DataTypes) => {
    var Model = sequelize.define('User', {
        id: {
            field: 'user_id',
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        facebookId: {
            field: 'facebook_id',
            type: DataTypes.STRING
        },
        firstname: {
            field: 'first_name',
            type: DataTypes.STRING
        },
        lastname: {
            field: 'last_name',
            type: DataTypes.STRING
        },
        username: {
            type: DataTypes.STRING
        },
        gender: {
            type: DataTypes.STRING
        },
        desc: {
            type: DataTypes.STRING
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
            validate: {
                isEmail: {
                    msg: "Email address invalid."
                }
            }
        },
        password: DataTypes.STRING,
        authMethod: {
            field: 'auth_method',
            type: DataTypes.STRING
        },
        roles: {
            type: DataTypes.JSON
        },
        score: {
            type: DataTypes.INTEGER
        },
        avatar: {
            type: DataTypes.STRING
        },
        blockFlag: {
            field: 'block_flag',
            type: DataTypes.BOOLEAN,
            defaultValue: 0
        },
        AcceptedTermsFlag: {
            field: 'acpt_terms_cond_flag',
            type: DataTypes.BOOLEAN,
            defaultValue: 0
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
        tableName: 'user'
    });
    Model.associate = function(models){
        this.Reviews = this.hasMany(models.Review, {
            foreignKey: 'userId'
        });
        this.Entities = this.hasMany(models.Entity, {
            foreignKey: 'userId'
        });
        this.Votes = this.hasMany(models.Vote, {
            foreignKey: 'userId'
        });
    };
    Model.beforeSave(async function(user, options){
        let err;
        if (user.changed('password')) {
            let salt,hash;
            [err, salt] = await to(bcrypt.genSalt(10));
            if (err) TE(err.message, true);

            [err, hash] = await to(bcrypt.hash(user.password, salt));
            if (err) TE(err.message, true);

            user.password = hash;
        }
    });

    Model.prototype.comparePassword = async function(pw) {
        let err, pass;
        if (!this.password) TE('Password is not set');

        [err, pass] = await to(bcrypt.compare(pw, this.password));
        if (err) TE(err);

        if (!pass) TE('Invalid username or password');

        return this;
    }

    Model.prototype.getJWT = function(){
        let expiration_time = parseInt(CONFIG.jwt_expiration);
        return "Bearer " + jwt.sign({
            user_id: this.id
        }, CONFIG.jwt_encryption, {
            expiresIn: expiration_time
        });
    };

    Model.prototype.toWeb = function(pw){
        let json = this.toJSON();
        return json;
    };

    return Model;
};
