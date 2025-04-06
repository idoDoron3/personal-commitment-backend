'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('lessons', {
            lesson_id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            tutor_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'tutors',
                    key: 'tutor_id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            title: {
                type: Sequelize.STRING(100),
                allowNull: false
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            appointed_time: {
                type: Sequelize.DATE,
                allowNull: false
            },
            status: {
                type: Sequelize.ENUM('created', 'completed', 'approved', 'notapproved', 'canceled', 'unattended'),
                allowNull: false,
                defaultValue: 'created'
            },
            summary: {
                type: Sequelize.TEXT,
                allowNull: true
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
        await queryInterface.addIndex('lessons', ['tutor_id']);
        await queryInterface.addIndex('lessons', ['status']);
        await queryInterface.addIndex('lessons', ['appointed_time']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('lessons');
    }
}; 