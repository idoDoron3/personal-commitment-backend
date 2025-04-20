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
                primaryKey: true
            },
            tutee_full_name: {
                type: Sequelize.STRING(100),
                allowNull: false
            },
            tutee_email: {
                type: Sequelize.STRING(100),
                allowNull: false
            },
            presence: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
            clarity: {
                type: Sequelize.INTEGER,
                allowNull: true,
                validate: {
                    min: 1,
                    max: 5
                }
            },
            understanding: {
                type: Sequelize.INTEGER,
                allowNull: true,
                validate: {
                    min: 1,
                    max: 5
                }
            },
            focus: {
                type: Sequelize.INTEGER,
                allowNull: true,
                validate: {
                    min: 1,
                    max: 5
                }
            },
            helpful: {
                type: Sequelize.INTEGER,
                allowNull: true,
                validate: {
                    min: 1,
                    max: 5
                }
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
        await queryInterface.dropTable('tutees_lessons');
    }
}; 