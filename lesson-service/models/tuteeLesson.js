const { Model, DataTypes, ValidationError } = require('sequelize'); // Added ValidationError for potential use

module.exports = (sequelize) => {
    class TuteeLesson extends Model {

        // --- NEW: Static method to update presence ---
        /**
         * Updates the presence status for a specific tutee in a specific lesson.
         * @param {number} lessonId - The ID of the lesson.
         * @param {number} tuteeId - The ID of the tutee.
         * @param {boolean} isPresent - The presence status to set (true or false).
         * @returns {Promise<TuteeLesson|null>} The updated TuteeLesson instance or null if not found.
         * @throws {Error} Throws error if the record is not found or update fails.
         */
        static async markAttendance(lessonId, tuteeId, isPresent) {
            // Basic input validation
            if (typeof lessonId !== 'number' || typeof tuteeId !== 'number' || typeof isPresent !== 'boolean') {
                throw new Error('Invalid input provided to markAttendance.');
            }

            try {
                // Find the specific association record
                const attendanceRecord = await this.findOne({
                    where: {
                        lesson_id: lessonId,
                        tutee_id: tuteeId
                    }
                });

                if (!attendanceRecord) {
                    // Handle case where the tutee wasn't signed up for the lesson
                    console.warn(`Attendance record not found for lesson ${lessonId}, tutee ${tuteeId}.`);
                    // Depending on requirements, either throw an error or return null/false
                    throw new Error(`Tutee ${tuteeId} is not registered for lesson ${lessonId}.`);
                    // return null;
                }

                // Update the presence field
                attendanceRecord.presence = isPresent;

                // Save the changes (this will trigger any relevant hooks if defined later)
                await attendanceRecord.save();

                console.log(`Attendance marked for lesson ${lessonId}, tutee ${tuteeId}: ${isPresent}`);
                return attendanceRecord; // Return the updated record

            } catch (error) {
                console.error(`Error marking attendance for lesson ${lessonId}, tutee ${tuteeId}:`, error);
                // Re-throw the error to be handled by the calling code
                throw error;
            }
        }


        // Static associate method moved inside class for consistency
        static associate(models) {
            TuteeLesson.belongsTo(models.Lesson, {
                foreignKey: 'lesson_id',
                as: 'lesson'
            });
            TuteeLesson.belongsTo(models.Tutee, {
                foreignKey: 'tutee_id',
                as: 'tutee'
            });
        }
    }

    TuteeLesson.init({
        lesson_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'lessons', // Table name of the Lesson model
                key: 'lesson_id'  // Primary key column in lessons table
            },
            primaryKey: true
        },
        tutee_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'tutees', // Table name of the Tutee model
                key: 'tutee_id'   // Primary key column in tutees table
            },
            primaryKey: true
        },
        presence: {
            type: DataTypes.BOOLEAN,
            // --- Sticking with original: Default is false, cannot be null ---
            defaultValue: false,
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'TuteeLesson',
        tableName: 'tutees_lessons', // Junction table name
        timestamps: true, // Keep track of creation/update times for the association record
        underscored: true,
        // Indexes help speed up queries involving these foreign keys
        indexes: [
            { fields: ['lesson_id'] },
            { fields: ['tutee_id'] }
        ]
    });

    return TuteeLesson;
};
