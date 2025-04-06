'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('tutees_lessons', {
            lesson_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'lessons',
                    key: 'lesson_id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                primaryKey: true
            },
            tutee_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'tutees',
                    key: 'tutee_id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                primaryKey: true
            },
            presence: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
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

        // Add indexes for faster lookups
        await queryInterface.addIndex('tutees_lessons', ['lesson_id']);
        await queryInterface.addIndex('tutees_lessons', ['tutee_id']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('tutees_lessons');
    }
}; 