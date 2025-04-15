// Added Op for time comparisons
const { Model, DataTypes, ValidationError, Op } = require('sequelize');
const { appError } = require('../utils/errors/appError');
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


const MAX_TUTEES_PER_LESSON = 2;
const MAX_OPEN_LESSONS_PER_TUTOR = 2;
const MAX_SIGNEDUP_LESSONS_PER_TUTEE = 2;

module.exports = (sequelize) => {
    class Lesson extends Model {
        static associate(models) {
            this.belongsTo(models.Tutor, { foreignKey: 'tutorId', as: 'tutor' });
            this.belongsToMany(models.Tutee, {
                through: 'tutees_lessons',
                foreignKey: 'lessonId',
                otherKey: 'tuteeId',
                as: 'tutees'
            });
            this.hasMany(models.TuteeLesson, { foreignKey: 'lesson_id', as: 'attendanceRecords' });
        }

        // Static method for Tutor to record lesson outcome
        static async recordOutcome(lessonId, tutorId, outcomeData) {
            const transaction = await sequelize.transaction();
            try {
                const lesson = await Lesson.findByPk(lessonId, { transaction, lock: transaction.LOCK.UPDATE });
                if (!lesson) { throw new Error('Lesson not found'); }
                if (lesson.tutorId !== tutorId) { throw new Error('Unauthorized: Only the assigned tutor can record the outcome.'); }
                const now = new Date();
                if (lesson.status !== LESSON_STATUS.CREATED || lesson.appointedDateTime > now) { throw new Error(`Cannot record outcome. Lesson status must be '${LESSON_STATUS.CREATED}' and appointed time must have passed. Current status: ${lesson.status}`); }
                const { status: newStatus, summary, attendance } = outcomeData;
                if (newStatus !== LESSON_STATUS.COMPLETED && newStatus !== LESSON_STATUS.UNATTENDED) { throw new ValidationError('Invalid outcome status provided.', [{ message: `Outcome status must be '${LESSON_STATUS.COMPLETED}' or '${LESSON_STATUS.UNATTENDED}'.`, path: 'status', value: newStatus }]); }
                lesson.status = newStatus;
                lesson.summary = summary || lesson.summary;
                if (Array.isArray(attendance)) {
                    for (const att of attendance) { await sequelize.models.TuteeLesson.markAttendance(lessonId, att.tuteeId, att.isPresent, { transaction }); }
                } else { console.warn(`Attendance data not provided or invalid format for lesson ${lessonId}.`); }
                await lesson.save({ transaction });
                await transaction.commit();
                console.log(`Outcome recorded for lesson ${lessonId} by tutor ${tutorId}. New status: ${newStatus}`);
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
                        as: 'attendanceRecords',
                        attributes: ['tutee_id'] // Only need tutee_id for the deletion step
                    }]
                });
                if (!lesson) {
                    throw new AppError('Lesson not found', 404, 'NOT_FOUND');
                }
                lesson.status = LESSON_STATUS.CANCELED;
                await lesson.save({ transaction });

                // Get affected tutees before deleting their records
                const affectedTutees = lesson.attendanceRecords.map(record => record.tutee_id);
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
                if (error instanceof AppError) {
                    throw error; // Custom application error
                }
                // General DB error handling
                throw new AppError('Database error while canceling lesson', 500, 'DB_ERROR', [{ originalError: error.message }]);
            }
        }

        static async getUpcomingLessonsByTutor(tutorId, options = {}) {
            // Validate input
            if (!tutorId || typeof tutorId !== 'number' || !Number.isInteger(tutorId)) {
                throw new Error('Invalid or missing tutorId provided. Must be an integer.');
            }

            const { transaction, includeTutees = true } = options; // Option to include tutee details

            try {
                const now = new Date();
                const queryOptions = {
                    where: {
                        tutorId: tutorId,
                        // Focus on lessons that are still scheduled and haven't reached a terminal state
                        status: LESSON_STATUS.CREATED,
                        appointedDateTime: {
                            [Op.gte]: now // Appointed time is now or in the future
                        }
                    },
                    attributes: [
                        'lessonId', 'subjectName', 'level', 'tutorId',
                        'appointedDateTime', 'status', 'summary', 'locationOrLink'
                    ],
                    order: [
                        ['appointedDateTime', 'ASC'] // Order by the soonest lesson first
                    ],
                    transaction // Pass transaction if provided
                };

                if (includeTutees) {
                    queryOptions.include = [
                        {
                            model: sequelize.models.Tutee,
                            as: 'tutees',
                            // Select only necessary tutee attributes to avoid over-fetching
                            attributes: ['tuteeId', 'firstName', 'lastName'], // Adjust attributes as needed
                            through: { attributes: [] } // Don't include attributes from the join table
                        }
                    ];
                }

                const upcomingLessons = await Lesson.findAll(queryOptions);

                console.log(`Found ${upcomingLessons.length} upcoming lessons for tutor ${tutorId}.`);
                return upcomingLessons;

            } catch (error) {
                console.error(`Error fetching upcoming lessons for tutor ${tutorId}:`, error);
                // Re-throw the error so the calling code can handle it
                throw error;
            }
        }

        static async countLessonsForTutorByStatusType(tutorId, countType, options = {}) {
            if (!tutorId || typeof tutorId !== 'number' || !Number.isInteger(tutorId)) {
                throw new Error('Invalid or missing tutorId provided. Must be an integer.');
            }

            const validCountTypes = ['approved', 'notapproved', 'pendingApproval']; // Define valid types
            if (!validCountTypes.includes(countType)) {
                throw new Error(`Invalid countType specified: ${countType}. Must be one of: ${validCountTypes.join(', ')}`);
            }

            const { transaction } = options;
            let statusWhereClause;

            // Map countType to the status condition
            switch (countType) {
                case 'approved':
                    statusWhereClause = LESSON_STATUS.APPROVED;
                    break;
                case 'notapproved':
                    statusWhereClause = LESSON_STATUS.NOTAPPROVED;
                    break;
                case 'pendingApproval':
                    statusWhereClause = { [Op.in]: [LESSON_STATUS.COMPLETED, LESSON_STATUS.UNATTENDED] };
                    break;
                // Add more cases here if needed in the future
                default:
                    // This case should theoretically not be reached due to validation above
                    throw new Error(`Unhandled countType: ${countType}`);
            }

            try {
                const count = await Lesson.count({
                    where: {
                        tutorId: tutorId,
                        status: statusWhereClause
                    },
                    transaction
                });
                console.log(`Found ${count} lessons of type '${countType}' for tutor ${tutorId}.`);
                return count;
            } catch (error) {
                console.error(`Error counting lessons of type '${countType}' for tutor ${tutorId}:`, error);
                throw error;
            }
        }
        static async getUpcomingLessonsByTutee(tuteeId, options = {}) {
            // Validate input
            if (!tuteeId || typeof tuteeId !== 'number' || !Number.isInteger(tuteeId)) {
                throw new Error('Invalid or missing tuteeId provided. Must be an integer.');
            }

            // Default option to include tutor details, can be overridden
            const { transaction, includeTutor = true } = options;

            try {
                // Use the current date and time based on the server's clock
                // Note: Current date is Sunday, April 6, 2025 11:32:42 AM IDT
                const now = new Date();

                const queryOptions = {
                    // 1. Define conditions for the Lesson itself
                    where: {
                        status: LESSON_STATUS.CREATED, // Only lessons that haven't started/finished/canceled
                        appointedDateTime: {
                            [Op.gte]: now // Appointed time is now or in the future
                        }
                    },
                    attributes: [
                        'lessonId', 'subjectName', 'level', 'tutorId',
                        'appointedDateTime', 'status', 'summary', 'locationOrLink'
                    ],
                    // 2. Define how to link to the Tutee to filter
                    include: [
                        {
                            model: sequelize.models.Tutee,
                            as: 'tutees', // Use the alias defined in Lesson.associate
                            where: { tuteeId: tuteeId }, // Filter by the specific tutee ID *within* the include
                            attributes: [], // We don't need the tutee details returned per lesson, just using for filtering
                            through: { attributes: [] }, // Don't need attributes from the join table (tutees_lessons)
                            required: true // Crucial: Makes this an INNER JOIN. Only returns Lessons that HAVE this tutee associated.
                        }
                    ],
                    order: [
                        ['appointedDateTime', 'ASC'] // Show the soonest lessons first
                    ],
                    transaction // Pass transaction if provided
                };

                // 3. Optionally add Tutor details to the result
                if (includeTutor) {
                    queryOptions.include.push({ // Add another object to the include array
                        model: sequelize.models.Tutor,
                        as: 'tutor', // Use the alias defined in Lesson.associate
                        attributes: ['tutorId', 'firstName', 'lastName'] // Specify desired tutor attributes
                    });
                }

                const upcomingLessons = await Lesson.findAll(queryOptions);

                console.log(`Found ${upcomingLessons.length} upcoming lessons for tutee ${tuteeId}.`);
                return upcomingLessons;

            } catch (error) {
                console.error(`Error fetching upcoming lessons for tutee ${tuteeId}:`, error);
                // Re-throw the error so the calling code can handle it
                throw error;
            }
        }

        // Static method to update location or link for a lesson
        static async updateLocationOrLink(lessonId, tutorId, locationOrLink) {
            const transaction = await sequelize.transaction();
            try {
                const lesson = await Lesson.findByPk(lessonId, { transaction, lock: transaction.LOCK.UPDATE });
                if (!lesson) {
                    throw new Error('Lesson not found');
                }
                if (lesson.tutorId !== tutorId) {
                    throw new Error('Unauthorized: Only the assigned tutor can update the location or link.');
                }
                if (lesson.status !== LESSON_STATUS.CREATED) {
                    throw new Error(`Cannot update location/link. Lesson status must be '${LESSON_STATUS.CREATED}'. Current status: ${lesson.status}`);
                }

                lesson.locationOrLink = locationOrLink;
                await lesson.save({ transaction });
                await transaction.commit();

                console.log(`Location/link updated for lesson ${lessonId} by tutor ${tutorId}.`);
                return lesson;
            } catch (error) {
                await transaction.rollback();
                console.error(`Error updating location/link for lesson ${lessonId}:`, error);
                throw error;
            }
        }

        static async getAvailableLessonsBySubject(subjects = [], options = {}) {
            const now = new Date();
          
            const { transaction } = options;
          
            // Normalize subject filtering
            const subjectFilter = Array.isArray(subjects) && subjects.length > 0
              ? { subjectName: { [Op.in]: subjects } }
              : {};
          
            try {
              const lessons = await Lesson.findAll({
                where: {
                  status: LESSON_STATUS.CREATED,
                  appointedDateTime: { [Op.gte]: now },
                  ...subjectFilter,
                },
                include: [
                  {
                    model: sequelize.models.Tutor,
                    as: 'tutor',
                    attributes: ['tutor_id', 'first_name', 'last_name']
                  }
                ],
                attributes: [
                  'lessonId', 'subjectName', 'level', 'appointedDateTime', 'locationOrLink'
                ],
                order: [['appointedDateTime', 'ASC']],
                transaction
              });
          
              return lessons;
            } catch (error) {
              console.error('Error in getAvailableLessonsBySubject:', error);
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
        level: {
            type: DataTypes.STRING(20),
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Level cannot be empty.'
                },
                len: {
                    args: [1, 20],
                    msg: 'Level must be between 1 and 20 characters.'
                }
            }
        },
        tutorId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'tutor_id',
            references: {
                model: 'tutors',
                key: 'tutor_id'
            },
            validate: {
                isInt: {
                    msg: 'Tutor ID must be an integer.'
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
            type: DataTypes.STRING(220),
            allowNull: true,
            validate: {
                len: {
                    args: [0, 220],
                    msg: 'Summary must be between 0 and 220 characters.'
                }
            }
        },

    }, { // Options object for Lesson.init
        sequelize,
        modelName: 'Lesson',
        tableName: 'lessons',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['tutor_id'] },
            { fields: ['appointed_date_time'] },
            { fields: ['status'] }
        ]
    });

    // Hooks
    Lesson.addHook('beforeCreate', 'validateLessonLimits', async (lesson, options) => {
        // Ensure the tutor doesn't exceed the open lesson limit
        const openLessonCount = await Lesson.count({
            where: {
                tutorId: lesson.tutorId,
                status: LESSON_STATUS.CREATED,
                appointedDateTime: { [Op.gte]: new Date() },
            },
            transaction: options.transaction
        });

        if (openLessonCount >= MAX_OPEN_LESSONS_PER_TUTOR) {
            const errorDetails = {
                message: `Tutor ${lesson.tutorId} has reached the maximum limit of ${MAX_OPEN_LESSONS_PER_TUTOR} open future lessons.`,
                type: 'ValidationError',
                path: 'tutorId',
                value: lesson.tutorId,
            };

            // Log the limit issue for monitoring purposes
            console.warn(`Tutor ${lesson.tutorId} has reached the lesson limit (${openLessonCount}/${MAX_OPEN_LESSONS_PER_TUTOR})`);
            throwValidationError('Tutor open lesson limit reached', errorDetails, 505);
        }
    });


    Lesson.addHook('beforeCreate', 'validateNoOverlappingLessons', async (lesson, options) => {
        const { appointedDateTime, tutorId } = lesson;

        // Define the time window (one hour before and after the appointed time)
        const oneHourBefore = new Date(appointedDateTime.getTime() - 60 * 60 * 1000); // One hour before
        const oneHourAfter = new Date(appointedDateTime.getTime() + 60 * 60 * 1000); // One hour after

        // Check if there are any existing lessons within this one-hour window
        const overlappingLessons = await Lesson.findAll({
            where: {
                tutorId,
                appointedDateTime: {
                    [Op.between]: [oneHourBefore, oneHourAfter],
                },
                status: LESSON_STATUS.CREATED,  // Make sure we're checking only "created" lessons, not completed ones
            },
            transaction: options.transaction
        });

        if (overlappingLessons.length > 0) {
            const errorDetails = {
                message: `Tutor ${tutorId} already has a lesson scheduled within one hour of the appointed time.`,
                type: 'ValidationError',
                path: 'appointedDateTime',
                value: appointedDateTime,
            };

            // Log the overlapping lesson issue for monitoring purposes
            console.warn(`Tutor ${tutorId} has overlapping lessons at ${appointedDateTime}`);

            // Throw the validation error
            throwValidationError('Tutor already has a lesson within the same time window.', errorDetails, 506);
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
    Lesson.signUpTutee = async function (lessonId, tuteeId) {
        const transaction = await sequelize.transaction();
        try {
            const lesson = await Lesson.findByPk(lessonId, { transaction, lock: transaction.LOCK.UPDATE });
            if (!lesson) { throw new Error('Lesson not found'); }
            if (lesson.status !== LESSON_STATUS.CREATED) { throw new Error(`Lesson cannot be signed up for in status: ${lesson.status}`); }
            if (lesson.appointedDateTime <= new Date()) { throw new Error(`Cannot sign up for a lesson whose time has passed.`); }
            const signedUpCount = await sequelize.models.TuteeLesson.count({ where: { tutee_id: tuteeId }, include: [{ model: sequelize.models.Lesson, where: { status: LESSON_STATUS.CREATED, appointedDateTime: { [Op.gte]: new Date() } }, required: true }], transaction });
            if (signedUpCount >= MAX_SIGNEDUP_LESSONS_PER_TUTEE) { throw new Error(`Tutee ${tuteeId} has reached the maximum limit of ${MAX_SIGNEDUP_LESSONS_PER_TUTEE} active future lessons.`); }
            const currentLessonTuteeCount = await sequelize.models.TuteeLesson.count({ where: { lesson_id: lessonId }, transaction });
            if (currentLessonTuteeCount >= MAX_TUTEES_PER_LESSON) { throw new Error(`Lesson is full. Maximum capacity of ${MAX_TUTEES_PER_LESSON} reached.`); }
            const tutee = await sequelize.models.Tutee.findByPk(tuteeId, { transaction });
            if (!tutee) { throw new Error(`Tutee with ID ${tuteeId} not found.`); }
            const existingSignup = await sequelize.models.TuteeLesson.findOne({ where: { lesson_id: lessonId, tutee_id: tuteeId }, transaction });
            if (existingSignup) { throw new Error(`Tutee ${tuteeId} is already signed up for lesson ${lessonId}.`); }
            await sequelize.models.TuteeLesson.create({ lesson_id: lessonId, tutee_id: tuteeId, presence: false }, { transaction });
            await transaction.commit();
            return lesson;
        } catch (error) {
            await transaction.rollback();
            console.error("Error signing up tutee:", error);
            throw error;
        }
    };

    // Class method for tutee cancellation
    Lesson.handleTuteeCancellation = async function (lessonId, tuteeId) {
        const transaction = await sequelize.transaction();
        try {
            const lesson = await Lesson.findByPk(lessonId, { transaction });
            if (!lesson) { throw new Error('Lesson not found'); }
            if (lesson.status !== LESSON_STATUS.CREATED) { throw new Error(`Lesson cancellation not allowed in status: ${lesson.status}`); }
            if (lesson.appointedDateTime <= new Date()) { throw new Error(`Cannot cancel a lesson whose time has passed.`); }
            const signup = await sequelize.models.TuteeLesson.findOne({ where: { lesson_id: lessonId, tutee_id: tuteeId }, transaction });
            if (!signup) { throw new Error(`Tutee ${tuteeId} is not signed up for lesson ${lessonId}.`); }
            await signup.destroy({ transaction });
            await transaction.commit();
            return lesson;
        } catch (error) {
            await transaction.rollback();
            console.error("Error handling tutee cancellation:", error);
            throw error;
        }
    };

    const throwValidationError = (message, errorDetails, statusCode) => {
        const errorToThrow = new ValidationError(message, [errorDetails]);
        errorToThrow.statusCode = statusCode;
        throw errorToThrow;
    };

    return Lesson;
};
