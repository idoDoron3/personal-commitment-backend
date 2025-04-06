'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // First, ensure we have some tutors
        const tutors = await queryInterface.sequelize.query(
            'SELECT id FROM tutors LIMIT 2',
            { type: Sequelize.QueryTypes.SELECT }
        );

        if (tutors.length === 0) {
            console.log('No tutors found. Skipping lesson seeding.');
            return;
        }

        const now = new Date();
        const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow

        await queryInterface.bulkInsert('lessons', [
            {
                subject_name: 'Mathematics',
                level: 'Intermediate',
                tutor_id: tutors[0].id,
                appointed_time: futureDate,
                status: 'created',
                available_slots: 2,
                summary: 'Advanced calculus concepts',
                created_at: now,
                updated_at: now
            },
            {
                subject_name: 'Physics',
                level: 'Advanced',
                tutor_id: tutors[1].id,
                appointed_time: new Date(futureDate.getTime() + 24 * 60 * 60 * 1000),
                status: 'created',
                available_slots: 2,
                summary: 'Newtonian mechanics review',
                created_at: now,
                updated_at: now
            }
        ], {});
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.bulkDelete('lessons', null, {});
    }
}; 