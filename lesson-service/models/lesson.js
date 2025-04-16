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

        // Static method for Tutor to record lesson outcome
        static async recordOutcome(lessonId, tutorUserId, outcomeData) {
            const transaction = await sequelize.transaction();
            try {
                const lesson = await Lesson.findByPk(lessonId, { transaction, lock: transaction.LOCK.UPDATE });
                if (!lesson) { throw new Error('Lesson not found'); }
                if (lesson.tutorUserId !== tutorUserId) { throw new Error('Unauthorized: Only the assigned tutor can record the outcome.'); }
                const now = new Date();
                if (lesson.status !== LESSON_STATUS.CREATED || lesson.appointedDateTime > now) { throw new Error(`Cannot record outcome. Lesson status must be '${LESSON_STATUS.CREATED}' and appointed time must have passed. Current status: ${lesson.status}`); }
                const { status: newStatus, summary, attendance } = outcomeData;
                if (newStatus !== LESSON_STATUS.COMPLETED && newStatus !== LESSON_STATUS.UNATTENDED) { throw new ValidationError('Invalid outcome status provided.', [{ message: `Outcome status must be '${LESSON_STATUS.COMPLETED}' or '${LESSON_STATUS.UNATTENDED}'.`, path: 'status', value: newStatus }]); }
                lesson.status = newStatus;
                lesson.summary = summary || lesson.summary;
                if (Array.isArray(attendance)) {
                    for (const att of attendance) { await sequelize.models.TuteeLesson.markAttendance(lessonId, att.tuteeUserId, att.isPresent, { transaction }); }
                } else { console.warn(`Attendance data not provided or invalid format for lesson ${lessonId}.`); }
                await lesson.save({ transaction });
                await transaction.commit();
                console.log(`Outcome recorded for lesson ${lessonId} by tutor ${tutorUserId}. New status: ${newStatus}`);
                return lesson;
            } catch (error) {
                await transaction.rollback();
                console.error(`Error recording outcome for lesson ${lessonId}:`, error);
                throw error;
            }
        }
        // Static method for Admin to approve lesson outcome
        static async lessonVerdict(lessonId, adminUserId, verdict) {
            const transaction = await sequelize.transaction();
            try {
                const lesson = await Lesson.findByPk(lessonId, { transaction, lock: transaction.LOCK.UPDATE });
                if (!lesson) { throw new Error('Lesson not found'); }
                if (lesson.status !== LESSON_STATUS.COMPLETED && lesson.status !== LESSON_STATUS.UNATTENDED) { throw new Error(`Lesson status must be '${LESSON_STATUS.COMPLETED}' or '${LESSON_STATUS.UNATTENDED}' for approval. Current status: ${lesson.status}`); }
                switch (verdict) {
                    case 'approved':
                        finalStatus = LESSON_STATUS.APPROVED;
                        break;
                    case 'notapproved':
                        finalStatus = LESSON_STATUS.NOTAPPROVED;
                        break;
                }
                lesson.status = finalStatus;
                await lesson.save({ transaction });
                await transaction.commit();
                console.log(`Lesson ${lessonId} ${finalStatus} by admin ${adminUserId}.`);
                return lesson;
            } catch (error) {
                await transaction.rollback();
                console.error(`Error approving lesson ${lessonId}:`, error);
                throw error;
            }
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
                // Re-throw the error, ensuring it is formatted consistently
                if (error instanceof appError) {
                    throw error; // Custom application error
                }
                // General DB error handling
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

        // Static method to update location or link for a lesson
        static async updateLocationOrLink(lessonId, tutorUserId, locationOrLink) {
            const transaction = await sequelize.transaction();
            try {
                const lesson = await Lesson.findByPk(lessonId, { transaction, lock: transaction.LOCK.UPDATE });
                if (!lesson) {
                    throw new Error('Lesson not found');
                }
                if (lesson.tutorUserId !== tutorUserId) {
                    throw new Error('Unauthorized: Only the assigned tutor can update the location or link.');
                }
                if (lesson.status !== LESSON_STATUS.CREATED) {
                    throw new Error(`Cannot update location/link. Lesson status must be '${LESSON_STATUS.CREATED}'. Current status: ${lesson.status}`);
                }

                lesson.locationOrLink = locationOrLink;
                await lesson.save({ transaction });
                await transaction.commit();

                console.log(`Location/link updated for lesson ${lessonId} by tutor ${tutorUserId}.`);
                return lesson;
            } catch (error) {
                await transaction.rollback();
                console.error(`Error updating location/link for lesson ${lessonId}:`, error);
                throw error;
            }
        }
    } // End of Lesson class

    // --- CHANGE: Standardized indentation within Lesson.init ---
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
        const transaction = await sequelize.transaction();
        try {
            const lesson = await Lesson.findByPk(lessonId, { transaction, lock: transaction.LOCK.UPDATE });
            if (!lesson) { throw new Error('Lesson not found'); }
            if (lesson.status !== LESSON_STATUS.CREATED) { throw new Error(`Lesson cannot be signed up for in status: ${lesson.status}`); }
            if (lesson.appointedDateTime <= new Date()) { throw new Error(`Cannot sign up for a lesson whose time has passed.`); }

            // Check if tutee has reached the maximum number of active lessons
            const signedUpCount = await sequelize.models.TuteeLesson.count({
                where: { tutee_user_id: tuteeUserId },
                include: [{
                    model: sequelize.models.Lesson,
                    where: {
                        status: LESSON_STATUS.CREATED,
                        appointedDateTime: { [Op.gte]: new Date() }
                    },
                    required: true
                }],
                transaction
            });

            if (signedUpCount >= MAX_SIGNEDUP_LESSONS_PER_TUTEE) {
                throw new Error(`Tutee ${tuteeUserId} has reached the maximum limit of ${MAX_SIGNEDUP_LESSONS_PER_TUTEE} active future lessons.`);
            }

            // Check if lesson has reached maximum capacity
            const currentLessonTuteeCount = await sequelize.models.TuteeLesson.count({
                where: { lesson_id: lessonId },
                transaction
            });

            if (currentLessonTuteeCount >= MAX_TUTEES_PER_LESSON) {
                throw new Error(`Lesson is full. Maximum capacity of ${MAX_TUTEES_PER_LESSON} reached.`);
            }

            // Check if tutee is already signed up
            const existingSignup = await sequelize.models.TuteeLesson.findOne({
                where: {
                    lesson_id: lessonId,
                    tutee_user_id: tuteeUserId
                },
                transaction
            });

            if (existingSignup) {
                throw new Error(`Tutee ${tuteeUserId} is already signed up for lesson ${lessonId}.`);
            }

            // Create the new signup record
            await sequelize.models.TuteeLesson.create({
                lesson_id: lessonId,
                tutee_user_id: tuteeUserId,
                tutee_full_name: tuteeFullName,
                presence: false
            }, { transaction });

            await transaction.commit();
            return lesson;
        } catch (error) {
            await transaction.rollback();
            console.error("Error signing up tutee:", error);
            throw error;
        }
    };

    // Class method for tutee cancellation
    Lesson.handleTuteeCancellation = async function (lessonId, tuteeUserId) {
        const transaction = await sequelize.transaction();
        try {
            const lesson = await Lesson.findByPk(lessonId, { transaction });
            if (!lesson) { throw new Error('Lesson not found'); }
            if (lesson.status !== LESSON_STATUS.CREATED) { throw new Error(`Lesson cancellation not allowed in status: ${lesson.status}`); }
            if (lesson.appointedDateTime <= new Date()) { throw new Error(`Cannot cancel a lesson whose time has passed.`); }

            const signup = await sequelize.models.TuteeLesson.findOne({
                where: {
                    lesson_id: lessonId,
                    tutee_user_id: tuteeUserId
                },
                transaction
            });

            if (!signup) { throw new Error(`Tutee ${tuteeUserId} is not signed up for lesson ${lessonId}.`); }

            await signup.destroy({ transaction });
            await transaction.commit();
            return lesson;
        } catch (error) {
            await transaction.rollback();
            console.error("Error handling tutee cancellation:", error);
            throw error;
        }
    };
    return Lesson;
};

// Export the constants
module.exports.LESSON_STATUS = LESSON_STATUS;
module.exports.LESSON_FORMAT = LESSON_FORMAT;
module.exports.MAX_TUTEES_PER_LESSON = MAX_TUTEES_PER_LESSON;
module.exports.MAX_OPEN_LESSONS_PER_TUTOR = MAX_OPEN_LESSONS_PER_TUTOR;
module.exports.MAX_SIGNEDUP_LESSONS_PER_TUTEE = MAX_SIGNEDUP_LESSONS_PER_TUTEE;
