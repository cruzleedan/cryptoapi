Client does not support authentication protocol requested by server; consider upgrading MySQL client | NodeJs | MySQL Client v 2.12.0

A StackOverflow answer suggested to use the old password hash algorithm, and the following statement worked, enabling a NodeJS Sequelize client authenticate.

alter user 'USER'@'localhost' identified with mysql_native_password by 'PASSWORD'
