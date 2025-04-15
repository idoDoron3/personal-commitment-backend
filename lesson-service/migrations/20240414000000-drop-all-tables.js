'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // This migration is only for dropping tables, so up is empty
    },

    async down(queryInterface, Sequelize) {
        // Drop tables in the correct order to respect foreign key constraints
        await queryInterface.dropTable('tutees_lessons');
        await queryInterface.dropTable('tutees');
        await queryInterface.dropTable('lessons');
    }
}; 