const { Model, DataTypes, ValidationError } = require('sequelize');

module.exports = (sequelize) => {
    class Tutor extends Model {

        // --- CHANGE: Added static method for creating tutors ---
        /**
         * Static method to create a new Tutor.
         * Encapsulates creation logic.
         * @param {object} tutorData - Data for the new tutor.
         * @param {string} tutorData.userId - The user ID associated with this tutor.
         * @param {string} tutorData.firstName - Tutor's first name.
         * @param {string} tutorData.lastName - Tutor's last name.
         * @returns {Promise<Tutor|null>} The created Tutor instance or null if creation failed.
         * @throws {Error} Throws error if validation or database constraints fail.
         */
        static async addTutor(tutorData) {
            const { userId, firstName, lastName } = tutorData;
            try {
                // Use 'this' to refer to the Tutor model within the static method
                const newTutor = await this.create({
                    user_id: userId, // Ensure field names match definition
                    first_name: firstName,
                    last_name: lastName
                });
                console.log(`Tutor created successfully with ID: ${newTutor.tutor_id}`);
                return newTutor;
            } catch (error) {
                // Handle potential errors (validation, unique constraints, etc.)
                if (error instanceof ValidationError) {
                    console.error('Validation Error creating tutor:', error.errors.map(e => e.message));
                } else {
                    console.error('Error creating tutor:', error);
                }
                // Re-throw the error or handle it as appropriate for your application
                throw error;
                // Alternatively, return null or a specific error object:
                // return null;
            }
        }

        // Instance method (unchanged)
        getFullName() {
            return `${this.first_name} ${this.last_name}`;
        }

        // Static associate method (unchanged definition location)
        static associate(models) {
            Tutor.hasMany(models.Lesson, {
                foreignKey: 'tutor_id', // Column name in the Lesson table
                as: 'lessons'
            });
            // Add other associations here if neded
            // e.g., Tutor.belongsTo(models.User, { foreignKey: 'user_id', targetKey: 'user_id_in_user_table' });
        }
    }

    Tutor.init({
        tutor_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.STRING, // As requested
            allowNull: false,       // Assuming a Tutor must be linked to a User
            unique: true            // Assuming one User account corresponds to only one Tutor profile
        },
        first_name: {
            type: DataTypes.STRING(50),
            allowNull: false,
            validate: { // Added basic validation
                notEmpty: { msg: 'First name cannot be empty.' }
            }
        },
        last_name: {
            type: DataTypes.STRING(50),
            allowNull: false,
            validate: { // Added basic validation
                notEmpty: { msg: 'Last name cannot be empty.' }
            }
        }
    }, {
        sequelize,
        modelName: 'Tutor',
        tableName: 'tutors',
        timestamps: true, // Keeps createdAt and updatedAt
        underscored: true // Uses snake_case for table and column names
        // Add indexes if needed, e.g., on user_id if frequently queried
        // indexes: [ { unique: true, fields: ['user_id'] } ] // 'unique: true' on field definition handles this
    });


    return Tutor;
};
