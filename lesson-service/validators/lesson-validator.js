// validators/lesson-validator.js
const Joi = require('joi');


const createLessonSchema = Joi.object({
    // Subject Name validation
    subjectName: Joi.string()
        .min(1)
        .max(20)
        .required()
        .messages({
            'string.empty': 'Subject name cannot be empty',
            'string.min': 'Subject name must be at least {#limit} character long',
            'string.max': 'Subject name cannot be longer than {#limit} characters',
            'any.required': 'Subject name is required'
        }),

    // Level validation
    level: Joi.string()
        .min(1)
        .max(20)
        .required()
        .messages({
            'string.empty': 'Level cannot be empty',
            'string.min': 'Level must be at least {#limit} character long',
            'string.max': 'Level cannot be longer than {#limit} characters',
            'any.required': 'Level is required'
        }),

    // User ID validation
    userId: Joi.string()
        .required()
        .messages({
            'string.empty': 'User ID cannot be empty',
            'any.required': 'User ID is required'
        }),

    // First Name validation
    userFirstName: Joi.string()
        .min(1)
        .max(20)
        .required()
        .messages({
            'string.empty': 'First name cannot be empty',
            'string.min': 'First name must be at least {#limit} character long',
            'string.max': 'First name cannot be longer than {#limit} characters',
            'any.required': 'First name is required'
        }),

    // Last Name validation
    userLastName: Joi.string()
        .min(1)
        .max(20)
        .required()
        .messages({
            'string.empty': 'Last name cannot be empty',
            'string.min': 'Last name must be at least {#limit} character long',
            'string.max': 'Last name cannot be longer than {#limit} characters',
            'any.required': 'Last name is required'
        }),

    // Date/Time validation
    appointedDateTime: Joi.date()
        .iso()
        .min('now')
        .required()
        .messages({
            'date.base': 'Appointed date/time must be a valid date',
            'date.format': 'Appointed date/time must be in ISO format',
            'date.min': 'Appointed date/time must be in the future',
            'any.required': 'Appointed date/time is required'
        }),

    // Location/Link validation (optional)
    locationOrLink: Joi.string()
        .max(140)
        .allow('')
        .allow(null)
        .optional()
        .messages({
            'string.max': 'Location or link cannot be longer than {#limit} characters'
        })
});

const cancelLessonSchema = Joi.object({
    // Lesson ID validation
    lessonId: Joi.number()
        .integer()
        .required()
        .messages({
            'number.base': 'Lesson ID must be a number',
            'number.integer': 'Lesson ID must be an integer',
            'any.required': 'Lesson ID is required'
        }),

    // Tutor ID validation
    tutorId: Joi.number()
        .integer()
        .required()
        .messages({
            'number.base': 'Tutor ID must be a number',
            'number.integer': 'Tutor ID must be an integer',
            'any.required': 'Tutor ID is required'
        })
});

const getLessonsByTutorSchema = Joi.object({
    tutorId: Joi.number()
        .integer()
        .required()
        .messages({
            'number.base': 'Tutor ID must be a number',
            'number.integer': 'Tutor ID must be an integer',
            'any.required': 'Tutor ID is required'
        }),
    userId: Joi.string()
        .required()
        .messages({
            'string.empty': 'User ID cannot be empty',
            'any.required': 'User ID is required'
        })
});

module.exports = {
    createLessonSchema,
    cancelLessonSchema,
    getLessonsByTutorSchema
};
