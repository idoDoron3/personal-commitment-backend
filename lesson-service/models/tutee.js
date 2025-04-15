const { Model, DataTypes, ValidationError } = require('sequelize');

module.exports = (sequelize) => {
    class Tutee extends Model {

        // --- CHANGE: Added static method for creating tutees ---
        /**
         * Static method to create a new Tutee.
         * Encapsulates creation logic.
         * @param {object} tuteeData - Data for the new tutee.
         * @param {string} tuteeData.userId - The user ID (MongoDB Doc ID) associated with this tutee.
         * @param {string} tuteeData.firstName - Tutee's first name.
         * @param {string} tuteeData.lastName - Tutee's last name.
         * @returns {Promise<Tutee|null>} The created Tutee instance or null if creation failed.
         * @throws {Error} Throws error if validation or database constraints fail.
         */
        static async addTutee(tuteeData) {
            const { tuteeUserId, firstName, lastName } = tuteeData;
            try {
                // Use 'this' to refer to the Tutee model within the static method
                const newTutee = await this.create({
                    tuteeUserId: tuteeUserId, // Field names match definition
                    firstName: firstName,
                    lastName: lastName
                });
                console.log(`Tutee created successfully with ID: ${newTutee.tuteeUserId}`);
                return newTutee;
            } catch (error) {
                // Handle potential errors (validation, unique constraints, etc.)
                if (error instanceof ValidationError) {
                    console.error('Validation Error creating tutee:', error.errors.map(e => e.message));
                } else if (error.name === 'SequelizeUniqueConstraintError') {
                    console.error('Error creating tutee: User ID already exists.');
                    // Optionally throw a more specific error for unique constraint
                    throw new Error(`Tutee profile already exists for user ID: ${tuteeUserId}`);
                }
                else {
                    console.error('Error creating tutee:', error);
                }
                // Re-throw the error or handle it as appropriate for your application
                throw error;
                // Alternatively, return null or a specific error object:
                // return null;
            }
        }

        // --- CHANGE: Moved associate method inside the class ---
        static associate(models) {
            // Define the many-to-many relationship with Lesson
            // Uses the TuteeLesson model (or table name) as the junction
            Tutee.belongsToMany(models.Lesson, {
                through: 'tutees_lessons', // Explicitly using table name string
                // Or use model: through: models.TuteeLesson, // If TuteeLesson is a defined Sequelize model
                foreignKey: 'tuteeUserId',    // Foreign key in junction table for Tutee
                otherKey: 'lessonId',     // Foreign key in junction table for Lesson
                as: 'lessons'              // Alias for the association
            });
            // Add other associations here if needed (e.g., hypothetical link to User model if it were in same DB)
            // Tutee.belongsTo(models.User, { foreignKey: 'tutee_user_id' }); // Not applicable due to separate DBs
        }

    }

    Tutee.init({
        tuteeUserId: {
            type: DataTypes.STRING, // To store MongoDB ObjectId as string
            primaryKey: true,       // Primary key instead of tutee_id
            unique: true,            // Assuming one User account corresponds to only one Tutee profile
            field: 'tutee_user_id'
        },
        firstName: {
            type: DataTypes.STRING(50),
            allowNull: false,
            field: 'first_name',
            validate: { // Added basic validation
                notEmpty: { msg: 'First name cannot be empty.' },
                len: { args: [1, 50], msg: 'First name must be between 1 and 50 characters.' } // Added length validation
            }
        },
        lastName: {
            type: DataTypes.STRING(50),
            allowNull: false,
            field: 'last_name',
            validate: { // Added basic validation
                notEmpty: { msg: 'Last name cannot be empty.' },
                len: { args: [1, 50], msg: 'Last name must be between 1 and 50 characters.' } // Added length validation
            }
        }
    }, {
        sequelize,
        modelName: 'Tutee',
        tableName: 'tutees',
        timestamps: true, // Keeps createdAt and updatedAt
        underscored: true // Uses snake_case for table and column names
        // Add indexes if needed, e.g., on tutee_user_id
        // indexes: [ { unique: true, fields: ['tutee_user_id'] } ] // 'unique: true' on field definition handles this
    });

    return Tutee;
};
