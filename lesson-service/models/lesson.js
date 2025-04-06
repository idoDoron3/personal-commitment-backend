// Added Op for time comparisons
const { Model, DataTypes, ValidationError, Op } = require('sequelize');

// Define constants for status values
const LESSON_STATUS = {
    CREATED: 'created',
    COMPLETED: 'completed',
    APPROVED: 'approved', // State set by admin after lesson is completed
    NOTAPPROVED: 'notapproved', // State set by admin after lesson is completed / unattended
    CANCELED: 'canceled', // State set by tutor/system before appointed time
    UNATTENDED: 'unattended', // State set by tutor after appointed time
};
// Create an array of the status values for ENUM definition and validation
const lessonStatusValues = Object.values(LESSON_STATUS);

// Define global maximum tutee count per lesson
const MAX_TUTEES_PER_LESSON = 2;

// Define global limits for Tutors and Tutees
const MAX_OPEN_LESSONS_PER_TUTOR = 2; // Limit for lessons in 'created' state & future appointedTime per tutor
const MAX_SIGNEDUP_LESSONS_PER_TUTEE = 2; // Limit for how many 'created' & future lessons a tutee can be signed up for

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

        // Instance methods using status constants
        isEditable() {
            return this.status === LESSON_STATUS.CREATED;
        }
        canBeCanceled() {
            return this.status === LESSON_STATUS.CREATED && this.appointedTime > new Date();
        }
        canBeApproved() { // Checks if status IS approved (final admin state)
            return this.status === LESSON_STATUS.APPROVED;
        }
        isAwaitingAdminApproval() { // Checks if ready FOR admin approval
            return [LESSON_STATUS.COMPLETED, LESSON_STATUS.UNATTENDED].includes(this.status);
        }
        async getTuteeCount(options = {}) {
            try {
                return await sequelize.models.TuteeLesson.count({
                    where: { lesson_id: this.lessonId }, ...options
                });
            } catch (error) {
                console.error(`Error getting tutee count for lesson ${this.lessonId}:`, error);
                throw error;
            }
        }

        // Static method for Tutor to record lesson outcome
        static async recordOutcome(lessonId, tutorId, outcomeData) {
            const transaction = await sequelize.transaction();
            try {
                const lesson = await Lesson.findByPk(lessonId, { transaction, lock: transaction.LOCK.UPDATE });
                if (!lesson) { throw new Error('Lesson not found'); }
                if (lesson.tutorId !== tutorId) { throw new Error('Unauthorized: Only the assigned tutor can record the outcome.'); }
                const now = new Date();
                if (lesson.status !== LESSON_STATUS.CREATED || lesson.appointedTime > now) { throw new Error(`Cannot record outcome. Lesson status must be '${LESSON_STATUS.CREATED}' and appointed time must have passed. Current status: ${lesson.status}`); }
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
        // ! make sure to ADD the admin an option to address unattended lessons differently ? from completed lessons
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

        // Static method for Tutor/System to cancel a lesson
        static async cancelByTutor(lessonId, options = {}) {
            const transaction = options.transaction || await sequelize.transaction();
            try {
                const lesson = await Lesson.findByPk(lessonId, {
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });
                if (!lesson) { throw new Error('Lesson not found'); }
                if (lesson.status !== LESSON_STATUS.CREATED) { throw new Error(`Lesson cannot be canceled in its current status: ${lesson.status}`); }
                if (lesson.appointedTime <= new Date()) { throw new Error(`Cannot cancel a lesson whose appointed time has passed.`); }
                lesson.status = LESSON_STATUS.CANCELED;
                await lesson.save({ transaction });
                const deletedSignups = await sequelize.models.TuteeLesson.destroy({
                    where: { lesson_id: lessonId },
                    transaction
                });
                console.log(`Removed ${deletedSignups} sign-up(s) for canceled lesson ${lessonId}.`);
                if (!options.transaction) { await transaction.commit(); }
                console.log(`Lesson ${lessonId} canceled successfully.`);
                return lesson;
            } catch (error) {
                if (!options.transaction && transaction) { await transaction.rollback(); }
                console.error(`Error canceling lesson ${lessonId}:`, error);
                throw error;
            }
        }

        // Add this static method inside the Lesson class definition,
        // alongside other static methods like recordOutcome, approveLesson, etc.

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
                        appointedTime: {
                            [Op.gte]: now // Appointed time is now or in the future
                        }
                    },
                    order: [
                        ['appointedTime', 'ASC'] // Order by the soonest lesson first
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

        static async countLessonsByStatusType(tutorId, countType, options = {}) {
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
                        appointedTime: {
                            [Op.gte]: now // Appointed time is now or in the future
                        }
                    },
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
                        ['appointedTime', 'ASC'] // Show the soonest lessons first
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
        appointedTime: {
            type: DataTypes.DATE,
            allowNull: false,
            field: 'appointed_time',
            validate: {
                isDate: {
                    msg: 'Appointed time must be a valid date.'
                },
                isFutureDate(value) {
                    if (new Date(value) <= new Date()) {
                        throw new ValidationError('Lesson date must be in the future', [{
                            message: 'Lesson date must be in the future',
                            type: 'Validation error',
                            path: 'appointedTime',
                            value: value
                        }]);
                    }
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
            { fields: ['appointed_time'] },
            { fields: ['status'] }
        ]
    });

    // Hooks
    Lesson.addHook('beforeCreate', 'validateTutorAndLimits', async (lesson, options) => {
        const tutor = await sequelize.models.Tutor.findByPk(lesson.tutorId, { transaction: options.transaction });
        if (!tutor) { throw new ValidationError('Tutor not found', [{ message: `Tutor with ID ${lesson.tutorId} not found.`, type: 'Validation error', path: 'tutorId', value: lesson.tutorId }]); }
        const openLessonCount = await Lesson.count({ where: { tutorId: lesson.tutorId, status: LESSON_STATUS.CREATED, appointedTime: { [Op.gte]: new Date() } }, transaction: options.transaction });
        if (openLessonCount >= MAX_OPEN_LESSONS_PER_TUTOR) { throw new ValidationError('Tutor open lesson limit reached', [{ message: `Tutor ${lesson.tutorId} has reached the maximum limit of ${MAX_OPEN_LESSONS_PER_TUTOR} open future lessons.`, type: 'Validation error', path: 'tutorId', value: lesson.tutorId }]); }
    });

    Lesson.addHook('beforeUpdate', 'preventInvalidUpdates', async (lesson, options) => {
        // Prevent status changes if lesson is in a terminal state for updates
        if (lesson.changed('status')) {
            const previousStatus = lesson.previous('status');
            if (previousStatus === LESSON_STATUS.COMPLETED || previousStatus === LESSON_STATUS.APPROVED || previousStatus === LESSON_STATUS.CANCELED) {
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
            if (lesson.appointedTime <= new Date()) { throw new Error(`Cannot sign up for a lesson whose time has passed.`); }
            const signedUpCount = await sequelize.models.TuteeLesson.count({ where: { tutee_id: tuteeId }, include: [{ model: sequelize.models.Lesson, where: { status: LESSON_STATUS.CREATED, appointedTime: { [Op.gte]: new Date() } }, required: true }], transaction });
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
            if (lesson.appointedTime <= new Date()) { throw new Error(`Cannot cancel a lesson whose time has passed.`); }
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

    return Lesson;
};
