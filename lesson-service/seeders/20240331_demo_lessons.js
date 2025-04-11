'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // First, ensure we have some tutors
        const tutors = await queryInterface.sequelize.query(
            'SELECT tutor_id FROM tutors LIMIT 2',
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
                tutor_id: tutors[0].tutor_id,
                appointed_time: futureDate,
                status: 'created',
                summary: 'Advanced calculus concepts',
                location_or_link: 'https://zoom.us/j/123456789',
                created_at: now,
                updated_at: now
            },
            {
                subject_name: 'Physics',
                level: 'Advanced',
                tutor_id: tutors[1].tutor_id,
                appointed_time: new Date(futureDate.getTime() + 24 * 60 * 60 * 1000),
                status: 'created',
                summary: 'Newtonian mechanics review',
                location_or_link: 'Room 101, Science Building',
                created_at: now,
                updated_at: now
            },
            {
                subject_name: 'Chemistry',
                level: 'Beginner',
                tutor_id: tutors[0].tutor_id,
                appointed_time: new Date(futureDate.getTime() + 48 * 60 * 60 * 1000),
                status: 'created',
                summary: 'Introduction to atomic structure',
                location_or_link: null, // Example of a lesson without location/link
                created_at: now,
                updated_at: now
            }
        ], {});
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.bulkDelete('lessons', null, {});
    }
}; 