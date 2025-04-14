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
            subject_name: {
                type: Sequelize.STRING(20),
                allowNull: false
            },
            level: {
                type: Sequelize.STRING(20),
                allowNull: false
            },
            appointed_date_time: {
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
            location_or_link: {
                type: Sequelize.STRING(140),
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

        // Indexes improve query performance for common operations:
        // - tutor_id: Finding lessons by tutor
        // - status: Filtering lessons by status
        // - appointed_date_time: Finding upcoming/past lessons
        // ! Itay - not working due to double indexing in the original tables (because tutor_id is already indexed in the tutors table and status is already indexed in the lessons table
        // ! and appointed_date_time is already indexed in the lessons table)
        // await queryInterface.addIndex('lessons', ['tutor_id']);
        // await queryInterface.addIndex('lessons', ['status']);
        // await queryInterface.addIndex('lessons', ['appointed_date_time']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('lessons');
    }
}; 