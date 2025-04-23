const { Model, DataTypes, ValidationError, Op } = require('sequelize');
const appError = require('../utils/errors/appError');
const { TuteeLesson } = require('./tuteeLesson');

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

// !
// TODO: deciedd on agreed limits
const MAX_TUTEES_PER_LESSON = 2;
const MAX_OPEN_LESSONS_PER_TUTOR = 6;
const MAX_SIGNEDUP_LESSONS_PER_TUTEE = 3;

module.exports = (sequelize) => {
    class Lesson extends Model {
        static associate(models) {
            this.hasMany(models.TuteeLesson, {
                foreignKey: 'lessonId',
                as: 'enrolledTutees'
            });
        }
        //*Tutor

        static async cancelLesson(lessonToCancel) {
            const transaction = await sequelize.transaction();
            try {
                // re-fetch the lesson with enrolled tutees and lock to prevent race conditions
                await lessonToCancel.reload({
                    include: [{
                        model: sequelize.models.TuteeLesson,
                        as: 'enrolledTutees',
                        attributes: ['tuteeUserId']
                    }],
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });

                // Update the lesson status
                lessonToCancel.status = LESSON_STATUS.CANCELED;
                await lessonToCancel.save({ transaction });

                // Get affected tutees before deleting their records
                const affectedTutees = lessonToCancel.enrolledTutees.map(record => record.tuteeUserId);

                // Remove associated signups (TuteeLesson records)
                await sequelize.models.TuteeLesson.destroy({
                    where: { lessonId: lessonToCancel.lessonId },
                    transaction
                });

                await transaction.commit();
                return {
                    lesson: lessonToCancel,
                    affectedTutees
                };
            } catch (error) {
                await transaction.rollback();
                if (error instanceof appError) {
                    throw error;
                }
                throw new appError('Lesson cancellation failed', 500, 'CANCEL_ERROR', 'lesson-model:cancelLesson');
            }
        }

        static async editLesson(lessonToEdit, description, format, locationOrLink) {
            const transaction = await sequelize.transaction();
            try {
                await lessonToEdit.reload({
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });

                // Apply only non-null updates
                if (description !== null && description !== undefined) {
                    lessonToEdit.description = description;
                }

                if (format !== null && format !== undefined) {
                    lessonToEdit.format = format;
                }

                if (locationOrLink !== null && locationOrLink !== undefined) {
                    lessonToEdit.locationOrLink = locationOrLink;
                }
                await lessonToEdit.save({ transaction });
                await transaction.commit();
                return lessonToEdit;
            } catch (error) {
                await transaction.rollback();
                if (error instanceof appError) {
                    throw error;
                }
                throw new appError('Lesson editing failed', 500, 'EDIT_ERROR', 'lesson-model:editLesson');
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
                throw new appError('Fetching amount of approved lessons failed', 500, 'MODEL_ERROR', 'lesson-model:getAmountOfApprovedLessons');
            }
        }

        static async getLessonsOfTutor(tutorUserId, lessonCategory) {
            try {
                const now = new Date();
                const ONE_HOUR_AGO = new Date(now.getTime() - (1 * 60 * 60 * 1000)); // ensure lessons are finished before allowing a review.
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
                        [Op.lt]: ONE_HOUR_AGO // Older than 1 hour
                    };
                } else {
                    throw new appError('Fetching lessons failed', 400, 'INVALID_LESSON_CATEGORY', 'lesson-model:getLessonsOfTutor');
                }

                const lessons = await Lesson.findAll({
                    where: whereClause,
                    order: [['appointedDateTime', 'ASC']],
                    include: [
                        {
                            model: sequelize.models.TuteeLesson,
                            as: 'enrolledTutees',
                            attributes: ['tuteeFullName', 'tuteeUserId']
                        }
                    ]
                });

                // For summaryPending lessons, filter out those without enrolled tutees
                if (lessonCategory === 'summaryPending') {
                    const lessonsWithTutees = await Promise.all(
                        lessons.map(async (lesson) => {
                            const hasTutees = await sequelize.models.TuteeLesson.hasEnrolledTutees(lesson.lessonId);
                            return hasTutees ? lesson : null;
                        })
                    );
                    return lessonsWithTutees.filter(lesson => lesson !== null);
                }

                return lessons;
            } catch (error) {
                if (error instanceof appError) {
                    throw error;
                }
                throw new appError('Fetching lessons failed', 500, 'MODEL_ERROR', 'lesson-model:getLessonsOfTutor');
            }
        }

        static async uploadLessonReport(lessonToUpdate, lessonSummary, tuteesPresence) {
            const transaction = await sequelize.transaction();
            try {
                await lessonToUpdate.reload({
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });

                // Update lesson summary
                lessonToUpdate.summary = lessonSummary;

                // Check if any tutee was present
                const hasPresentTutees = Object.values(tuteesPresence).some(presence => presence === true);
                // Set status based on tutee presence
                lessonToUpdate.status = hasPresentTutees ? LESSON_STATUS.COMPLETED : LESSON_STATUS.UNATTENDED;

                await lessonToUpdate.save({ transaction });
                // Delegate presence verification and updates to TuteeLesson model
                await sequelize.models.TuteeLesson.updatePresenceForLesson(
                    lessonToUpdate.lessonId,
                    tuteesPresence,
                    transaction
                );
                await transaction.commit();

                // Fetch and return the updated lesson with all its data
                const updatedLesson = await Lesson.findByPk(lessonToUpdate.lessonId, {
                    include: [
                        {
                            model: sequelize.models.TuteeLesson,
                            as: 'enrolledTutees',
                            attributes: ['tuteeUserId', 'tuteeFullName', 'presence']
                        }
                    ]
                });

                return updatedLesson;
            } catch (error) {
                await transaction.rollback();
                if (error instanceof appError) {
                    throw error;
                }
                throw new appError(
                    'Uploading lesson report failed',
                    500,
                    'UPLOAD_REPORT_ERROR',
                    'lesson-model:uploadLessonReport'
                );
            }
        }

        //*Tutee

        static async searchAvailableLessons(subject, grade, level, tuteeUserId) {
            try {
                const now = new Date();
                const lessons = await this.findAll({
                    where: {
                        subjectName: subject,
                        grade,
                        level,
                        status: LESSON_STATUS.CREATED,
                        appointedDateTime: {
                            [Op.gte]: now
                        }
                    },
                    order: [['appointedDateTime', 'ASC']],
                    include: [
                        {
                            model: sequelize.models.TuteeLesson,
                            as: 'enrolledTutees', // use the correct alias from association
                            attributes: ['tuteeUserId'],
                        }
                    ]
                });

                const filteredLessons = lessons.filter(lesson => {
                    const attendees = lesson.enrolledTutees || []; // match alias here too
                    const alreadyEnrolled = attendees.some(t => t.tuteeUserId === tuteeUserId);
                    const isFull = attendees.length >= MAX_TUTEES_PER_LESSON;
                    return !alreadyEnrolled && !isFull;
                });

                return filteredLessons;
            } catch (error) {
                if (error instanceof appError) {
                    throw error;
                }
                throw new appError('Lesson search failed', 500, 'AVAILABLE_FETCH_ERROR', 'lesson-model:searchAvailableLessons');
            }
        }

        static async getLessonsOfTutee(tuteeUserId, lessonCategory) {
            try {
                const now = new Date();
                const ONE_HOUR_AGO = new Date(now.getTime() - (1 * 60 * 60 * 1000)); // ensure Lessons are finished before allowing a review.
                const SEVEN_DAYS_AGO = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)); // 7 days ago
                let whereClause = {
                    status: LESSON_STATUS.CREATED
                };

                if (lessonCategory === 'upcoming') {
                    whereClause.appointedDateTime = {
                        [Op.gte]: now // Future dates
                    };
                } else if (lessonCategory === 'reviewPending') {
                    whereClause.appointedDateTime = {
                        [Op.and]: [
                            { [Op.lt]: ONE_HOUR_AGO },         // Past dates
                            { [Op.gte]: SEVEN_DAYS_AGO } // But not older than 7 days
                        ]
                    };
                } else {
                    throw new appError('Fetching lessons failed', 400, 'INVALID_LESSON_CATEGORY', 'lesson-model:getLessonsOfTutee');
                }

                const lessons = await Lesson.findAll({
                    where: whereClause,
                    order: [['appointedDateTime', 'ASC']],
                    include: [
                        {
                            model: sequelize.models.TuteeLesson,
                            as: 'enrolledTutees',
                            where: { tuteeUserId: tuteeUserId },
                            attributes: ['tuteeFullName'],
                            required: true // Makes this an INNER JOIN
                        }
                    ]
                });

                return lessons;
            } catch (error) {
                if (error instanceof appError) {
                    throw error;
                }
                throw new appError('Fetching lessons failed', 500, 'MODEL_ERROR', 'lesson-model:getLessonsOfTutee');
            }
        }

        static async enrollToLesson(lessonToEnroll, tuteeUserId, tuteeFullName, tuteeEmail) {
            const transaction = await sequelize.transaction();
            try {
                await lessonToEnroll.reload({
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });

                // Check tutee limits with lock to prevent concurrent enrollments
                const signedUpCount = await sequelize.models.TuteeLesson.count({
                    where: { tuteeUserId: tuteeUserId },
                    include: [{
                        model: sequelize.models.Lesson,
                        as: 'lesson',
                        where: {
                            status: LESSON_STATUS.CREATED,
                            appointedDateTime: { [Op.gte]: new Date() }
                        },
                        required: true
                    }],
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });

                if (signedUpCount >= MAX_SIGNEDUP_LESSONS_PER_TUTEE) {
                    throw new appError(
                        'Maximum number of future lessons reached',
                        409,
                        'TUTEE_LIMIT_REACHED',
                        'LessonModel:signUpTutee'
                    );
                }

                // Check lesson capacity with lock to prevent concurrent enrollments
                const currentLessonTuteeCount = await sequelize.models.TuteeLesson.count({
                    where: { lessonId: lessonToEnroll.lessonId },
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });

                if (currentLessonTuteeCount >= MAX_TUTEES_PER_LESSON) {
                    throw new appError(
                        'Lesson is full',
                        409,
                        'LESSON_FULL',
                        'LessonModel:signUpTutee'
                    );
                }

                // Check for existing enrollment with lock
                const existingEnrollment = await sequelize.models.TuteeLesson.findOne({
                    where: {
                        lessonId: lessonToEnroll.lessonId,
                        tuteeUserId: tuteeUserId
                    },
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });

                if (existingEnrollment) {
                    throw new appError(
                        'Duplicate enrollment detected',
                        400,
                        'ALREADY_SIGNED_UP',
                        'LessonModel:signUpTutee'
                    );
                }

                // Create the enrollment
                await sequelize.models.TuteeLesson.create({
                    lessonId: lessonToEnroll.lessonId,
                    tuteeUserId: tuteeUserId,
                    tuteeFullName: tuteeFullName,
                    tuteeEmail: tuteeEmail,
                    presence: null,
                    clarity: null,
                    understanding: null,
                    focus: null,
                    helpful: null
                }, { transaction });

                await transaction.commit();

                // Fetch the updated lesson with all its data
                const updatedLesson = await Lesson.findByPk(lessonToEnroll.lessonId, {
                    include: [
                        {
                            model: sequelize.models.TuteeLesson,
                            as: 'enrolledTutees',
                            attributes: ['tuteeUserId', 'tuteeFullName', 'tuteeEmail']
                        }
                    ]
                });

                return updatedLesson;
            } catch (error) {
                await transaction.rollback();
                if (error instanceof appError) {
                    throw error;
                }
                throw new appError('Enrollment failed', 409, 'SIGNUP_CONFLICT', 'LessonModel:signUpTutee');
            }
        }

        static async withdrawFromLesson(lessonToWithdraw, lessonInTuteeLesson) {
            const transaction = await sequelize.transaction();
            try {
                await lessonToWithdraw.reload({
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });


                await lessonInTuteeLesson.destroy({ transaction });
                await transaction.commit();
                return lessonToWithdraw;
            } catch (error) {
                await transaction.rollback();
                if (error instanceof appError) {
                    throw error;
                }
                throw new appError('Withdrawal failed', 500, 'WITHDRAW_ERROR', 'lesson-model:withdrawFromLesson');
            }
        }


        //* ADMIN

        static async getVerdictPendingLessons() {
            try {
                const verdictPendingLessons = await Lesson.findAll({
                    where: {
                        status: {
                            [Op.or]: [LESSON_STATUS.COMPLETED, LESSON_STATUS.UNATTENDED]
                        }
                    }
                });
                return verdictPendingLessons;
            } catch (error) {
                throw new appError('Fetching verdict pending lessons failed', 500, 'GET_VERDICT_PENDING_LESSONS_ERROR', 'lesson-model:getVerdictPendingLessons');
            }
        }

        static async updateLessonVerdict(lessonId, isApproved) {
            const transaction = await sequelize.transaction();
            try {
                const lesson = await Lesson.findByPk(lessonId, {
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });

                if (!lesson) {
                    throw new appError('Lesson not found', 404, 'LESSON_NOT_FOUND', 'lesson-model:updateLessonVerdict');
                }

                lesson.status = isApproved ? LESSON_STATUS.APPROVED : LESSON_STATUS.NOTAPPROVED;
                await lesson.save({ transaction });

                await transaction.commit();
                return lesson;
            } catch (error) {
                await transaction.rollback();
                if (error instanceof appError) {
                    throw error;
                }
                throw new appError('Updating lesson verdict failed', 500, 'UPDATE_VERDICT_ERROR', 'lesson-model:updateLessonVerdict');
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
        tutorEmail: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: 'tutor_email',
            validate: {
                notEmpty: {
                    msg: 'Tutor email cannot be empty.'
                },
                isEmail: {
                    msg: 'Tutor email must be a valid email address.'
                },
                len: {
                    args: [1, 100],
                    msg: 'Tutor email must be between 1 and 100 characters.'
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
                'Maximum limit of open future lessons reached',
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
        const timeWindow = '1 hour';

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
                `Conflict: another session within ${timeWindow} of this lesson.`,
                409,
                'OVERLAPPING_LESSON',
                'LessonModel:validateNoOverlappingLessonsHook'
            );
        }
    });
    // TODO: read again 
    Lesson.addHook('beforeUpdate', 'preventInvalidUpdates', async (lesson, options) => {
        // Prevent status changes if lesson is in a terminal state for updates
        if (lesson.changed('status')) {
            const previousStatus = lesson.previous('status');
            if (previousStatus === LESSON_STATUS.APPROVED || previousStatus === LESSON_STATUS.NOTAPPROVED || previousStatus === LESSON_STATUS.CANCELED) {
                throw new appError('Can not modify lesson in this stage', 409, 'INVALID_STATUS_UPDATE', 'lesson-model:preventInvalidUpdates');
            }
        }
    });

    return Lesson;
};

// Export the constants
module.exports.LESSON_STATUS = LESSON_STATUS;
module.exports.LESSON_FORMAT = LESSON_FORMAT;
module.exports.MAX_TUTEES_PER_LESSON = MAX_TUTEES_PER_LESSON;
module.exports.MAX_OPEN_LESSONS_PER_TUTOR = MAX_OPEN_LESSONS_PER_TUTOR;
module.exports.MAX_SIGNEDUP_LESSONS_PER_TUTEE = MAX_SIGNEDUP_LESSONS_PER_TUTEE;
