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

    // Grade validation
    grade: Joi.string()
        .min(1)
        .max(10)
        .required()
        .messages({
            'string.empty': 'Grade cannot be empty',
            'string.min': 'Grade must be at least {#limit} character long',
            'string.max': 'Grade cannot be longer than {#limit} characters',
            'any.required': 'Grade is required'
        }),

    // Level validation
    level: Joi.string()
        .min(1)
        .max(10)
        .required()
        .messages({
            'string.empty': 'Level cannot be empty',
            'string.min': 'Level must be at least {#limit} character long',
            'string.max': 'Level cannot be longer than {#limit} characters',
            'any.required': 'Level is required'
        }),

    // Description validation
    description: Joi.string()
        .min(1)
        .max(100)
        .required()
        .messages({
            'string.empty': 'Description cannot be empty',
            'string.min': 'Description must be at least {#limit} character long',
            'string.max': 'Description cannot be longer than {#limit} characters',
            'any.required': 'Description is required'
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

    // Format validation
    format: Joi.string()
        .valid('online', 'in-person')
        .required()
        .messages({
            'string.empty': 'Format cannot be empty',
            'any.only': 'Format must be either online or in-person',
            'any.required': 'Format is required'
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
    tutorUserId: Joi.string()
        .required()
        .messages({
            'string.empty': 'User ID cannot be empty',
            'any.required': 'User ID is required'
        })
});

const editLessonSchema = Joi.object({
    lessonId: Joi.number()
        .integer()
        .required()
        .messages({
            'number.base': 'Lesson ID must be a number',
            'number.integer': 'Lesson ID must be an integer',
            'any.required': 'Lesson ID is required',
        }),
    description: Joi.string()
        .max(100)
        .allow(null),
    format: Joi.string()
        .valid('online', 'in-person')
        .allow(null),
    locationOrLink: Joi.string()
        .max(140)
        .allow(null)
});

const getLessonsByTutorSchema = Joi.object({
    tutorUserId: Joi.string()
        .required()
        .messages({
            'string.empty': 'User ID cannot be empty',
            'any.required': 'User ID is required'
        })
});

// Tutee enrollment validation
const enrollLessonSchema = Joi.object({
    lessonId: Joi.number()
        .integer()
        .required()
        .messages({
            'number.base': 'Lesson ID must be a number',
            'any.required': 'Lesson ID is required'
        })
});

// Tutee withdrawal validation
const withdrawLessonSchema = Joi.object({
    lessonId: Joi.number()
        .integer()
        .required()
        .messages({
            'number.base': 'Lesson ID must be a number',
            'number.integer': 'Lesson ID must be an integer',
            'any.required': 'Lesson ID is required'
        })
});

// check if need to add strings also to the schema: Itay
// Get all available lessons by subject for tutee (can be empty)
const availableLessonsSchema = Joi.object({
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
  
    // Grade validation
    grade: Joi.string()
        .min(1)
        .max(10)
        .required()
        .messages({
            'string.empty': 'Grade cannot be empty',
            'string.min': 'Grade must be at least {#limit} character long',
            'string.max': 'Grade cannot be longer than {#limit} characters',
            'any.required': 'Grade is required'
        }),
  
    // Level validation
    level: Joi.string()
        .min(1)
        .max(10)
        .required()
        .messages({
            'string.empty': 'Level cannot be empty',
            'string.min': 'Level must be at least {#limit} character long',
            'string.max': 'Level cannot be longer than {#limit} characters',
            'any.required': 'Level is required'
        })
  });
  


module.exports = {
    createLessonSchema,
    cancelLessonSchema,
    getLessonsByTutorSchema,
    availableLessonsSchema,
    enrollLessonSchema,
    withdrawLessonSchema,
    editLessonSchema
};
