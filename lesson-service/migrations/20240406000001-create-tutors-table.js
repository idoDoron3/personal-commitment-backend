'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('tutors', {
            tutor_id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            user_id: {
                type: Sequelize.STRING,
                allowNull: false,
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

        // Index on user_id improves lookup performance for user-tutor associations
        await queryInterface.addIndex('tutors', ['user_id']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('tutors');
    }
}; 