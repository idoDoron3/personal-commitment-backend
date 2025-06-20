const { Model, DataTypes } = require('sequelize'); // Added ValidationError for potential use
const appError = require('../utils/errors/appError');

module.exports = (sequelize) => {
    class TuteeLesson extends Model {

        // Static associate method moved inside class for consistency
        static associate(models) {
            TuteeLesson.belongsTo(models.Lesson, {
                foreignKey: 'lessonId',
                as: 'lesson'
            });
        }

        toJSON() {
            const values = { ...this.get() };
            // Remove the snake_case version of lessonId
            delete values.lesson_id;
            return values;
        }

        static async updatePresenceForLesson(lessonId, tuteesPresence, transaction) {
            // Get all enrolled tutees for this lesson
            const enrolledTutees = await this.findAll({
                where: { lessonId: lessonId },
                transaction
            });

            // Create a map of tuteeUserId to presence status for quick lookup
            const presenceMap = new Map(
                tuteesPresence.map(tp => [tp.tuteeUserId, tp.presence])
            );

            // Verify all tutees in presence list are enrolled
            for (const tp of tuteesPresence) {
                const isEnrolled = enrolledTutees.some(t => t.tuteeUserId === tp.tuteeUserId);
                if (!isEnrolled) {
                    throw new appError(
                        `Tutee ${tp.tuteeUserId} is not enrolled in this lesson`,
                        400,
                        'INVALID_TUTEE',
                        'tuteeLesson-model:updatePresenceForLesson'
                    );
                }
            }

            // Verify that all enrolled tutees have presence information
            const missingTutees = enrolledTutees.filter(tutee => !presenceMap.has(tutee.tuteeUserId));
            if (missingTutees.length > 0) {
                const missingTuteeIds = missingTutees.map(t => t.tuteeUserId).join(', ');
                throw new appError(
                    `Missing presence information for enrolled tutees: ${missingTuteeIds}`,
                    400,
                    'MISSING_PRESENCE_INFO',
                    'tuteeLesson-model:updatePresenceForLesson'
                );
            }

            // Update presence status for all enrolled tutees
            for (const tutee of enrolledTutees) {
                const presence = presenceMap.get(tutee.tuteeUserId);
                tutee.presence = presence;
                await tutee.save({ transaction });
            }
        }

        static async hasEnrolledTutees(lessonId) {
            try {
                const count = await this.count({
                    where: { lessonId: lessonId }
                });
                return count > 0;
            } catch (error) {
                throw new appError(
                    'Failed to check for enrolled tutees',
                    500,
                    'CHECK_ENROLLED_ERROR',
                    'tuteeLesson-model:hasEnrolledTutees'
                );
            }
        }

        static async addReview(tuteeLessonToReview, clarity, understanding, focus, helpful) {
            const transaction = await sequelize.transaction();
            try {
                await tuteeLessonToReview.reload({
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });

                tuteeLessonToReview.clarity = clarity;
                tuteeLessonToReview.understanding = understanding;
                tuteeLessonToReview.focus = focus;
                tuteeLessonToReview.helpful = helpful;
                await tuteeLessonToReview.save({ transaction });
                await transaction.commit();
                return tuteeLessonToReview;

            } catch (error) {
                await transaction.rollback();
                if (error instanceof appError) {
                    throw error;
                }
                throw new appError('Failed to add review', 500, 'ADD_REVIEW_ERROR', 'tuteeLesson-model:addReview');
            }
        }
    }

    TuteeLesson.init({
        lessonId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'lesson_id',
            references: {
                model: sequelize.models.Lesson, // Table name of the Lesson model
                key: 'lesson_id'  // Primary key column in lessons table
            },
            primaryKey: true
        },
        tuteeUserId: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'tutee_user_id',
            primaryKey: true
        },
        tuteeFullName: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: 'tutee_full_name',
        },
        tuteeEmail: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: 'tutee_email',
            validate: {
                notEmpty: {
                    msg: 'Tutee email cannot be empty'
                },
                isEmail: {
                    msg: 'Tutee email must be a valid email address'
                },
                len: {
                    args: [1, 100],
                    msg: 'Tutee email must be between 1 and 100 characters'
                }
            }
        },
        presence: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        clarity: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: {
                    args: [1],
                    msg: 'Clarity rating must be at least 1'
                },
                max: {
                    args: [5],
                    msg: 'Clarity rating must not be more than 5'
                }
            }
        },
        understanding: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: {
                    args: [1],
                    msg: 'Understanding rating must be at least 1'
                },
                max: {
                    args: [5],
                    msg: 'Understanding rating must not be more than 5'
                }
            }
        },
        focus: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: {
                    args: [1],
                    msg: 'Focus rating must be at least 1'
                },
                max: {
                    args: [5],
                    msg: 'Focus rating must not be more than 5'
                }
            }
        },
        helpful: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: {
                    args: [1],
                    msg: 'Helpful rating must be at least 1'
                },
                max: {
                    args: [5],
                    msg: 'Helpful rating must not be more than 5'
                }
            }
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
            { fields: ['tutee_user_id'] },
            { fields: ['lesson_id', 'tutee_user_id'], unique: true }
        ]
    });

    return TuteeLesson;
};
