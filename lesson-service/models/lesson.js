// Added Op for time comparisons
const { Model, DataTypes, ValidationError, Op } = require('sequelize');
const appError = require('../utils/errors/appError');

// Define constants for status values
const LESSON_STATUS = {
    CREATED: 'created',
    COMPLETED: 'completed',
    UNATTENDED: 'unattended',
    APPROVED: 'approved',
    NOTAPPROVED: 'notapproved',
    CANCELED: 'canceled',
};
const lessonStatusValues = Object.values(LESSON_STATUS);

// Define constants for format values
const LESSON_FORMAT = {
    ONLINE: 'online',
    IN_PERSON: 'in-person',
};
const lessonFormatValues = Object.values(LESSON_FORMAT);

const MAX_TUTEES_PER_LESSON = 2;
const MAX_OPEN_LESSONS_PER_TUTOR = 2;
const MAX_SIGNEDUP_LESSONS_PER_TUTEE = 2;

module.exports = (sequelize) => {
    class Lesson extends Model {
        static associate(models) {
            this.hasMany(models.TuteeLesson, {
                foreignKey: 'lesson_id',
                as: 'enrolledTutees'
            });
        }

        // Static method for Tutor/System to cancel a lesson (in model layer)
        static async cancelLesson(lessonId, options = {}) {
            const transaction = options.transaction || await sequelize.transaction();
            try {
                // Find the lesson with lock to prevent race conditions
                const lesson = await Lesson.findByPk(lessonId, {
                    transaction,
                    lock: transaction.LOCK.UPDATE,
                    include: [{
                        model: sequelize.models.TuteeLesson,
                        as: 'enrolledTutees',
                        attributes: ['tutee_user_id'] // Only need tutee_user_id for the deletion step
                    }]
                });
                if (!lesson) {
                    throw new appError('Lesson not found', 404, 'NOT_FOUND', 'lesson-service:cancelLesson');
                }
                lesson.status = LESSON_STATUS.CANCELED;
                await lesson.save({ transaction });

                // Get affected tutees before deleting their records
                const affectedTutees = lesson.enrolledTutees.map(record => record.tutee_user_id);
                // Remove associated signups (TuteeLesson records)
                await sequelize.models.TuteeLesson.destroy({
                    where: { lesson_id: lessonId },
                    transaction
                });
                // Commit the transaction if it was not passed in the options
                if (!options.transaction) {
                    await transaction.commit();
                }
                return {
                    lesson,
                    affectedTutees
                };
            } catch (error) {
                // Rollback the transaction if something goes wrong
                if (!options.transaction && transaction) {
                    await transaction.rollback();
                }
                if (error instanceof appError) { throw error; }
                throw new appError(error.message, 500, 'Model Error', 'lesson-model:cancelLesson');
            }
        }

        static async getLessonsOfTutor(tutorUserId, lessonCategory) {
            try {
                const now = new Date();
                const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
                let whereClause = {
                    tutorUserId: tutorUserId
                };

                if (lessonCategory === 'upcoming') {
                    whereClause.status = LESSON_STATUS.CREATED;
                    whereClause.appointedDateTime = {
                        [Op.gte]: now // Future dates
                    };
                } else if (lessonCategory === 'summaryPending') {
                    whereClause.status = LESSON_STATUS.CREATED;
                    whereClause.appointedDateTime = {
                        [Op.lt]: new Date(now.getTime() - ONE_DAY_IN_MS) // Past dates with 24-hour buffer
                    };
                } else {
                    throw new appError(`Invalid lesson category: ${lessonCategory}`, 400, 'INVALID_LESSON_CATEGORY', 'lesson-model:getLessonsOfTutor');
                }

                const lessons = await Lesson.findAll({
                    where: whereClause,
                    order: [['appointedDateTime', 'ASC']],
                    include: [
                        {
                            model: sequelize.models.TuteeLesson,
                            as: 'enrolledTutees',
                            attributes: ['tutee_full_name']
                        }
                    ]
                });

                return lessons;
            } catch (error) {
                if (error instanceof appError) {
                    throw error;
                }
                throw new appError('Failed to get lessons of tutor', 500, 'MODEL_ERROR', 'lesson-model:getLessonsOfTutor');
            }
        }

        static async getLessonsOfTutee(tuteeUserId, lessonCategory) {
            try {
                const now = new Date();
                let whereClause = {
                    status: LESSON_STATUS.CREATED
                };

                if (lessonCategory === 'upcoming') {
                    whereClause.appointedDateTime = {
                        [Op.gte]: now // Future dates
                    };
                } else if (lessonCategory === 'reviewPending') {
                    whereClause.appointedDateTime = {
                        [Op.lt]: now // Past dates
                    };
                } else {
                    throw new appError(`Invalid lesson category: ${lessonCategory}`, 400, 'INVALID_LESSON_CATEGORY', 'lesson-model:getLessonsOfTutee');
                }

                const lessons = await Lesson.findAll({
                    where: whereClause,
                    order: [['appointedDateTime', 'ASC']],
                    include: [
                        {
                            model: sequelize.models.TuteeLesson,
                            as: 'enrolledTutees',
                            where: { tutee_user_id: tuteeUserId },
                            attributes: ['tutee_full_name'],
                            required: true // Makes this an INNER JOIN
                        }
                    ]
                });

                return lessons;
            } catch (error) {
                if (error instanceof appError) {
                    throw error;
                }
                throw new appError('Failed to get lessons of tutee', 500, 'MODEL_ERROR', 'lesson-model:getLessonsOfTutee');
            }
        }

        static async getAmountOfApprovedLessons(tutorUserId) {
            try {
                const amountOfApprovedLessons = await Lesson.count({
                    where: {
                        tutorUserId: tutorUserId,
                        status: LESSON_STATUS.APPROVED
                    }
                });
                return amountOfApprovedLessons;
            } catch (error) {
                throw new appError('Failed to get amount of approved lessons', 500, 'Model Error', 'lesson-model:getAmountOfApprovedLessons');
            }
        }

        static async getAvailableLessons(subjects = []) {
            try {
                const now = new Date();

                const queryOptions = {
                    where: {
                        status: LESSON_STATUS.CREATED,
                        appointedDateTime: {
                            [Op.gte]: now
                        }
                    },
                    order: [['appointedDateTime', 'ASC']],
                    include: [
                        {
                            model: sequelize.models.TuteeLesson,
                            as: 'attendanceRecords',
                            attributes: ['tutee_user_id', 'tutee_full_name'] // only what's needed
                        }
                    ]
                };

                if (subjects.length > 0) {
                    queryOptions.where.subjectName = { [Op.in]: subjects };
                }

                const lessons = await this.findAll(queryOptions);
                return lessons;
            } catch (error) {
                console.error('Error in Lesson.getAvailableLessons:', error);
                throw error;
            }
        }

        static async editLessonByTutor(lessonId, tutorUserId, updates) {
            const transaction = await sequelize.transaction();
            try {
                const lesson = await Lesson.findByPk(lessonId, {
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });

                if (!lesson) {
                    throw new appError('Lesson not found', 404, 'NOT_FOUND');
                }

                if (lesson.tutorUserId !== tutorUserId) {
                    throw new appError('Unauthorized: You are not the tutor of this lesson', 403, 'UNAUTHORIZED');
                }

                if (lesson.status !== LESSON_STATUS.CREATED) {
                    throw new appError(`Cannot edit lesson in current status: ${lesson.status}`, 400, 'INVALID_STATUS');
                }

                // Apply only non-null updates
                if (updates.description !== null && updates.description !== undefined) {
                    lesson.description = updates.description;
                }

                if (updates.format !== null && updates.format !== undefined) {
                    lesson.format = updates.format;
                }

                if (updates.locationOrLink !== null && updates.locationOrLink !== undefined) {
                    lesson.locationOrLink = updates.locationOrLink;
                }

                await lesson.save({ transaction });
                await transaction.commit();

                return lesson;
            } catch (error) {
                await transaction.rollback();
                console.error('Error updating lesson:', error);
                throw error;
            }
        }

        static async handleTuteeCancellation(lessonId, tuteeUserId) {
            const transaction = await sequelize.transaction();
            try {
                const lesson = await Lesson.findByPk(lessonId, { transaction });
                if (!lesson) {
                    throw new appError(
                        `Lesson ${lessonId} not found`,
                        404,
                        'LESSON_NOT_FOUND',
                        'LessonModel:handleTuteeCancellation'
                    );
                }
                if (lesson.status !== LESSON_STATUS.CREATED || lesson.appointedDateTime <= new Date()) {
                    throw new appError(
                        `Cannot cancel lesson ${lessonId} in status ${lesson.status}`,
                        400,
                        'TOO_LATE_TO_CANCEL',
                        'LessonModel:handleTuteeCancellation'
                    );
                }
                const tuteeInLesson = await sequelize.models.TuteeLesson.findOne({
                    where: {
                        lesson_id: lessonId,
                        tutee_user_id: tuteeUserId
                    },
                    transaction
                });
                if (!tuteeInLesson) {
                    throw new appError(
                        `Tutee ${tuteeUserId} is not enrolled in lesson ${lessonId}`,
                        404,
                        'NOT_ENROLLED',
                        'LessonModel:handleTuteeCancellation'
                    );
                }
                await tuteeInLesson.destroy({ transaction });
                await transaction.commit();
                return lesson;
            } catch (error) {
                await transaction.rollback();
                console.error("Error handling tutee cancellation:", error);
                throw error;
            }
        }
    }

    Lesson.init({
        lessonId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'lesson_id'
        },
        subjectName: {
            type: DataTypes.STRING(20),
            allowNull: false,
            field: 'subject_name',
            validate: {
                notEmpty: {
                    msg: 'Subject name cannot be empty.'
                },
                len: {
                    args: [1, 20],
                    msg: 'Subject name must be between 1 and 20 characters.'
                }
            }
        },
        grade: {
            type: DataTypes.STRING(10),
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Grade cannot be empty.'
                },
                len: {
                    args: [1, 10],
                    msg: 'Grade must be between 1 and 10 characters.'
                }
            }
        },
        level: {
            type: DataTypes.STRING(10),
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Level cannot be empty.'
                },
                len: {
                    args: [1, 10],
                    msg: 'Level must be between 1 and 10 characters.'
                }
            }
        },
        description: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Description cannot be empty.'
                },
                len: {
                    args: [1, 100],
                    msg: 'Description must be between 1 and 100 characters.'
                }
            }
        },
        tutorUserId: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'tutor_user_id'
        },
        tutorFullName: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: 'tutor_full_name',
            validate: {
                notEmpty: {
                    msg: 'Tutor full name cannot be empty.'
                },
                len: {
                    args: [1, 100],
                    msg: 'Tutor full name must be between 1 and 100 characters.'
                }
            }
        },
        appointedDateTime: {
            type: DataTypes.DATE,
            allowNull: false,
            field: 'appointed_date_time',
            validate: {
                isDate: {
                    msg: 'Appointed time must be a valid date.'
                },
                isFutureDate(value) {
                    if (new Date(value) <= new Date()) {
                        throw new ValidationError('Lesson date must be in the future', [{
                            message: 'Lesson date must be in the future',
                            type: 'Validation error',
                            path: 'appointedDateTime',
                            value: value
                        }]);
                    }
                }
            }
        },
        format: {
            type: DataTypes.ENUM(...lessonFormatValues),
            allowNull: false,
            validate: {
                isIn: {
                    args: [lessonFormatValues],
                    msg: `Format must be one of: ${lessonFormatValues.join(', ')}`
                }
            }
        },
        locationOrLink: {
            type: DataTypes.STRING(140),
            allowNull: true,
            field: 'location_or_link',
            validate: {
                len: {
                    args: [0, 140],
                    msg: 'Location or link must be between 0 and 140 characters.'
                }
            }
        },
        status: {
            type: DataTypes.ENUM(...lessonStatusValues),
            defaultValue: LESSON_STATUS.CREATED,
            allowNull: false,
            validate: {
                isIn: {
                    args: [lessonStatusValues],
                    msg: `Status must be one of: ${lessonStatusValues.join(', ')}`
                }
            }
        },
        summary: {
            type: DataTypes.TEXT,
            allowNull: true,
            validate: {
                len: {
                    args: [0, 250],
                    msg: `Summary must be between 0 and 250 characters.`
                }
            }
        }
    }, { // Options object for Lesson.init
        sequelize,
        modelName: 'Lesson',
        tableName: 'lessons',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['tutor_user_id'] },
            { fields: ['appointed_date_time'] },
            { fields: ['status'] }
        ]
    });

    // Hooks
    Lesson.addHook('beforeCreate', 'validateLessonLimits', async (lesson, options) => {
        // Ensure the tutor doesn't exceed the open lesson limit
        const openLessonCount = await Lesson.count({
            where: {
                tutorUserId: lesson.tutorUserId,
                status: LESSON_STATUS.CREATED,
                appointedDateTime: { [Op.gte]: new Date() },
            },
            transaction: options.transaction
        });

        if (openLessonCount >= MAX_OPEN_LESSONS_PER_TUTOR) {
            throw new appError(
                `Tutor ${lesson.tutorUserId} has reached the maximum limit of ${MAX_OPEN_LESSONS_PER_TUTOR} open future lessons.`,
                409,
                'LESSON_LIMIT_REACHED',
                'LessonModel:validateLessonLimitsHook'
            );
        }
    });

    Lesson.addHook('beforeCreate', 'validateNoOverlappingLessons', async (lesson, options) => {
        const { appointedDateTime, tutorUserId } = lesson;

        // Define the time window (one hour before and after the appointed time)
        const oneHourBefore = new Date(appointedDateTime.getTime() - 60 * 60 * 1000); // One hour before
        const oneHourAfter = new Date(appointedDateTime.getTime() + 60 * 60 * 1000); // One hour after

        // Check if there are any existing lessons within this one-hour window
        const overlappingLessons = await Lesson.findAll({
            where: {
                tutorUserId,
                appointedDateTime: {
                    [Op.between]: [oneHourBefore, oneHourAfter],
                },
                status: LESSON_STATUS.CREATED,  // Make sure we're checking only "created" lessons, not completed ones
            },
            transaction: options.transaction
        });

        if (overlappingLessons.length > 0) {
            throw new appError(
                `Tutor ${tutorUserId} already has a lesson scheduled within one hour of the appointed time.`,
                409,
                'OVERLAPPING_LESSON',
                'LessonModel:validateNoOverlappingLessonsHook'
            );
        }
    });

    Lesson.addHook('beforeUpdate', 'preventInvalidUpdates', async (lesson, options) => {
        // Prevent status changes if lesson is in a terminal state for updates
        if (lesson.changed('status')) {
            const previousStatus = lesson.previous('status');
            if (previousStatus === LESSON_STATUS.APPROVED || previousStatus === LESSON_STATUS.NOTAPPROVED || previousStatus === LESSON_STATUS.CANCELED) {
                throw new ValidationError(`Cannot modify a lesson with status: ${previousStatus}`, [{ message: `Cannot modify the status of a ${previousStatus} lesson.`, type: 'Validation error', path: 'status', value: lesson.status }]);
            }
        }
    });

    // Class methods for tutee sign-up
    Lesson.signUpTutee = async function (lessonId, tuteeUserId, tuteeFullName) {
        const maxRetries = 3;
        let attempts = 0;

        // Retry loop to handle race conditions (e.g., two tutees signing up at once)
        while (attempts < maxRetries) {
            const transaction = await sequelize.transaction();
            try {
                attempts++;

                // Lock the lesson row to prevent concurrent modifications
                const lesson = await Lesson.findByPk(lessonId, {
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });

                if (!lesson) {
                    throw new appError(
                        `Lesson ${lessonId} not found`,
                        404,
                        'LESSON_NOT_FOUND',
                        'LessonModel:signUpTutee'
                    );
                }

                if (lesson.status !== LESSON_STATUS.CREATED) {
                    throw new appError(
                        `Lesson ${lessonId} is in an invalid status: ${lesson.status}`,
                        400,
                        'INVALID_LESSON_STATUS',
                        'LessonModel:signUpTutee'
                    );
                }

                if (lesson.appointedDateTime <= new Date()) {
                    throw new appError(
                        `Cannot sign up for past lesson ${lessonId}`,
                        400,
                        'PAST_LESSON',
                        'LessonModel:signUpTutee'
                    );
                }

                // Check how many active lessons the tutee already has
                const signedUpCount = await sequelize.models.TuteeLesson.count({
                    where: { tutee_user_id: tuteeUserId },
                    include: [{
                        model: sequelize.models.Lesson,
                        as: 'lesson',
                        where: {
                            status: LESSON_STATUS.CREATED,
                            appointedDateTime: { [Op.gte]: new Date() }
                        },
                        required: true
                    }],
                    transaction
                });

                if (signedUpCount >= MAX_SIGNEDUP_LESSONS_PER_TUTEE) {
                    throw new appError(
                        `Tutee ${tuteeUserId} has reached the max of ${MAX_SIGNEDUP_LESSONS_PER_TUTEE} future lessons`,
                        409,
                        'TUTEE_LIMIT_REACHED',
                        'LessonModel:signUpTutee'
                    );
                }

                // Check how many tutees are already signed up to the lesson
                const currentLessonTuteeCount = await sequelize.models.TuteeLesson.count({
                    where: { lesson_id: lessonId },
                    transaction
                });

                if (currentLessonTuteeCount >= MAX_TUTEES_PER_LESSON) {
                    throw new appError(
                        `Lesson ${lessonId} is full (max ${MAX_TUTEES_PER_LESSON})`,
                        409,
                        'LESSON_FULL',
                        'LessonModel:signUpTutee'
                    );
                }

                // Prevent duplicate sign-up
                const existingSignup = await sequelize.models.TuteeLesson.findOne({
                    where: {
                        lesson_id: lessonId,
                        tutee_user_id: tuteeUserId
                    },
                    transaction
                });

                if (existingSignup) {
                    throw new appError(
                        `Tutee ${tuteeUserId} is already signed up for lesson ${lessonId}`,
                        400,
                        'ALREADY_SIGNED_UP',
                        'LessonModel:signUpTutee'
                    );
                }

                // Create new enrollment record
                await sequelize.models.TuteeLesson.create({
                    lessonId,
                    tuteeUserId,
                    tuteeFullName,
                    presence: false
                }, { transaction });

                await transaction.commit();

                // Fetch the updated lesson with attendance records
                const updatedLesson = await Lesson.findByPk(lessonId, {
                    include: [
                        {
                            model: sequelize.models.TuteeLesson,
                            as: 'attendanceRecords',
                            attributes: ['tuteeUserId', 'tuteeFullName', 'presence']
                        }
                    ]
                });

                return updatedLesson;

            } catch (error) {
                await transaction.rollback();

                // Retry if a race condition caused a temporary overbook
                const isRaceCondition =
                    error instanceof appError && error.type === 'LESSON_FULL';

                if (isRaceCondition && attempts < maxRetries) {
                    console.warn(
                        `Race condition detected on lesson ${lessonId}, retrying attempt ${attempts}...`
                    );
                    continue;
                }

                console.error('Error signing up tutee:', error);
                throw error;
            }
        }

        // Final fallback if all attempts fail
        throw new appError(
            `Failed to enroll tutee after ${maxRetries} attempts`,
            500,
            'ENROLL_RETRY_FAILED',
            'LessonModel:signUpTutee'
        );
    };


    return Lesson;
};

// Export the constants
module.exports.LESSON_STATUS = LESSON_STATUS;
module.exports.LESSON_FORMAT = LESSON_FORMAT;
module.exports.MAX_TUTEES_PER_LESSON = MAX_TUTEES_PER_LESSON;
module.exports.MAX_OPEN_LESSONS_PER_TUTOR = MAX_OPEN_LESSONS_PER_TUTOR;
module.exports.MAX_SIGNEDUP_LESSONS_PER_TUTEE = MAX_SIGNEDUP_LESSONS_PER_TUTEE;
