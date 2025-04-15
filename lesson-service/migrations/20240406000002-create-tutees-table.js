'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('tutees', {
            tutee_user_id: {
                type: Sequelize.STRING,
                primaryKey: true,
                unique: true
            },
            first_name: {
                type: Sequelize.STRING(50),
                allowNull: false
            },
            last_name: {
                type: Sequelize.STRING(50),
                allowNull: false
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false
            }
        });

    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('tutees');
    }
}; 