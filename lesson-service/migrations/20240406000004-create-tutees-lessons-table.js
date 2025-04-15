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
            tutee_user_id: {
                type: Sequelize.STRING,
                allowNull: false,
                references: {
                    model: 'tutees',
                    key: 'tutee_user_id'
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

        // Indexes improve query performance for:
        // - lesson_id: Finding all tutees in a lesson
        // - tutee_user_id: Finding all lessons for a tutee
        await queryInterface.addIndex('tutees_lessons', ['lesson_id']);
        await queryInterface.addIndex('tutees_lessons', ['tutee_user_id']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('tutees_lessons');
    }
}; 