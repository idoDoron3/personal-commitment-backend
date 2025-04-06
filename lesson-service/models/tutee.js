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
            const { userId, firstName, lastName } = tuteeData;
            try {
                // Use 'this' to refer to the Tutee model within the static method
                const newTutee = await this.create({
                    user_id: userId, // Field names match definition
                    first_name: firstName,
                    last_name: lastName
                });
                console.log(`Tutee created successfully with ID: ${newTutee.tutee_id}`);
                return newTutee;
            } catch (error) {
                // Handle potential errors (validation, unique constraints, etc.)
                if (error instanceof ValidationError) {
                    console.error('Validation Error creating tutee:', error.errors.map(e => e.message));
                } else if (error.name === 'SequelizeUniqueConstraintError') {
                    console.error('Error creating tutee: User ID already exists.');
                    // Optionally throw a more specific error for unique constraint
                    throw new Error(`Tutee profile already exists for user ID: ${userId}`);
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
                foreignKey: 'tutee_id',    // Foreign key in junction table for Tutee
                otherKey: 'lesson_id',     // Foreign key in junction table for Lesson
                as: 'lessons'              // Alias for the association
            });
            // Add other associations here if needed (e.g., hypothetical link to User model if it were in same DB)
            // Tutee.belongsTo(models.User, { foreignKey: 'user_id' }); // Not applicable due to separate DBs
        }

        // --- CHANGE: Moved instance method inside the class ---
        getFullName() {
            return `${this.first_name} ${this.last_name}`;
        }
    }

    Tutee.init({
        tutee_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            // --- CHANGE: Added autoIncrement ---
            autoIncrement: true
            // allowNull is implicitly false for primary keys
        },
        // --- CHANGE: Added user_id field ---
        user_id: {
            type: DataTypes.STRING, // To store MongoDB ObjectId as string
            allowNull: false,       // Assuming a Tutee must be linked to a User
            unique: true            // Assuming one User account corresponds to only one Tutee profile
        },
        first_name: {
            type: DataTypes.STRING(50),
            allowNull: false,
            validate: { // Added basic validation
                notEmpty: { msg: 'First name cannot be empty.' },
                len: { args: [1, 50], msg: 'First name must be between 1 and 50 characters.' } // Added length validation
            }
        },
        last_name: {
            type: DataTypes.STRING(50),
            allowNull: false,
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
        // Add indexes if needed, e.g., on user_id
        // indexes: [ { unique: true, fields: ['user_id'] } ] // 'unique: true' on field definition handles this
    });

    return Tutee;
};
