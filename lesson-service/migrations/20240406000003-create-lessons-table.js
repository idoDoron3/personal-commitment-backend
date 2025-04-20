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
            subject_name: {
                type: Sequelize.STRING(20),
                allowNull: false
            },
            grade: {
                type: Sequelize.STRING(10),
                allowNull: false
            },
            level: {
                type: Sequelize.STRING(10),
                allowNull: false
            },
            description: {
                type: Sequelize.STRING(100),
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
            tutor_user_id: {
                type: Sequelize.STRING,
                allowNull: false
            },
            tutor_full_name: {
                type: Sequelize.STRING(100),
                allowNull: false
            },
            tutor_email: {
                type: Sequelize.STRING(100),
                allowNull: false
            },
            summary: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            format: {
                type: Sequelize.ENUM('online', 'in-person'),
                allowNull: false
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
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('lessons');
    }
}; 