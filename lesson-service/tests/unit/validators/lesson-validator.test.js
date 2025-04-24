// lesson-service/tests/unit/validators/lesson-validator.test.js

const {
    createLessonSchema,
    cancelLessonSchema,
    getLessonsByTutorSchema,
    availableLessonsSchema,
    enrollLessonSchema,
    withdrawLessonSchema,
    editLessonSchema,
    uploadLessonReportSchema,
    addReviewSchema,
    updateLessonVerdictSchema
} = require('../../../validators/lesson-validator');

describe('Lesson Validator Schemas', () => {
    describe('createLessonSchema', () => {
        it('should validate a valid lesson creation payload', () => {
            const validPayload = {
                subjectName: 'Mathematics',
                grade: '10th',
                level: 'Advanced',
                description: 'Advanced calculus lesson',
                appointedDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // tomorrow
                format: 'online',
                locationOrLink: 'https://zoom.us/j/123456789'
            };

            const { error } = createLessonSchema.validate(validPayload);
            expect(error).toBeUndefined();
        });

        it('should reject invalid subject name', () => {
            const invalidPayload = {
                subjectName: '', // empty string
                grade: '10th',
                level: 'Advanced',
                description: 'Advanced calculus lesson',
                appointedDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                format: 'online',
                locationOrLink: 'https://zoom.us/j/123456789'
            };

            const { error } = createLessonSchema.validate(invalidPayload);
            expect(error).toBeDefined();
            expect(error.details[0].message).toBe('Subject name cannot be empty');
        });

        it('should reject invalid format', () => {
            const invalidPayload = {
                subjectName: 'Mathematics',
                grade: '10th',
                level: 'Advanced',
                description: 'Advanced calculus lesson',
                appointedDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                format: 'hybrid', // invalid format
                locationOrLink: 'https://zoom.us/j/123456789'
            };

            const { error } = createLessonSchema.validate(invalidPayload);
            expect(error).toBeDefined();
            expect(error.details[0].message).toBe('Format must be either online or in-person');
        });

        it('should reject past appointedDateTime', () => {
            const invalidPayload = {
                subjectName: 'Mathematics',
                grade: '10th',
                level: 'Advanced',
                description: 'Advanced calculus lesson',
                appointedDateTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // yesterday
                format: 'online',
                locationOrLink: 'https://zoom.us/j/123456789'
            };

            const { error } = createLessonSchema.validate(invalidPayload);
            expect(error).toBeDefined();
            expect(error.details[0].message).toBe('Appointed date/time must be in the future');
        });

        it('should reject subject name longer than 20 characters', () => {
            const invalidPayload = {
                subjectName: 'This is a very very long subject name',
                grade: '10th',
                level: 'Advanced',
                description: 'Advanced calculus lesson',
                appointedDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                format: 'online',
                locationOrLink: 'https://zoom.us/j/123456789'
            };
            const { error } = createLessonSchema.validate(invalidPayload);
            expect(error.details[0].message).toBe('Subject name cannot be longer than 20 characters');
        });

        it('should reject appointedDateTime more than 14 days in future', () => {
            const invalidPayload = {
                subjectName: 'Mathematics',
                grade: '10th',
                level: 'Advanced',
                description: 'Advanced calculus lesson',
                appointedDateTime: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
                format: 'online',
                locationOrLink: 'https://zoom.us/j/123456789'
            };
            const { error } = createLessonSchema.validate(invalidPayload);
            expect(error.details[0].message).toBe('Appointed date/time cannot be more than 14 days in the future');
        });
    });

    describe('uploadLessonReportSchema', () => {
        it('should validate a valid lesson report payload', () => {
            const validPayload = {
                lessonId: 1,
                lessonSummary: 'This is a detailed summary of what was covered in the lesson.',
                tuteesPresence: [
                    { tuteeUserId: 'user123', presence: true },
                    { tuteeUserId: 'user456', presence: false }
                ]
            };

            const { error } = uploadLessonReportSchema.validate(validPayload);
            expect(error).toBeUndefined();
        });

        it('should reject invalid lesson summary length', () => {
            const invalidPayload = {
                lessonId: 1,
                lessonSummary: 'Too short', // less than 10 characters
                tuteesPresence: [
                    { tuteeUserId: 'user123', presence: true }
                ]
            };

            const { error } = uploadLessonReportSchema.validate(invalidPayload);
            expect(error).toBeDefined();
            expect(error.details[0].message).toBe('Lesson summary must be at least 10 characters long');
        });

        it('should reject empty tutees presence array', () => {
            const invalidPayload = {
                lessonId: 1,
                lessonSummary: 'This is a valid summary of the lesson',
                tuteesPresence: []
            };
            const { error } = uploadLessonReportSchema.validate(invalidPayload);
            expect(error).toBeDefined();
        });
    });

    describe('addReviewSchema', () => {
        it('should validate a valid review payload', () => {
            const validPayload = {
                lessonId: 1,
                clarity: 5,
                understanding: 4,
                focus: 4,
                helpful: 5
            };

            const { error } = addReviewSchema.validate(validPayload);
            expect(error).toBeUndefined();
        });

        it('should reject invalid rating values', () => {
            const invalidPayload = {
                lessonId: 1,
                clarity: 6, // greater than max allowed (5)
                understanding: 4,
                focus: 4,
                helpful: 5
            };

            const { error } = addReviewSchema.validate(invalidPayload);
            expect(error).toBeDefined();
            expect(error.details[0].message).toBe('Clarity rating cannot be more than 5');
        });

        it('should return all validation errors when multiple fields are invalid', () => {
            const invalidPayload = {
                lessonId: 'invalid',
                clarity: 6,
                understanding: -1,
                focus: 10,
                helpful: 0
            };
            const { error } = addReviewSchema.validate(invalidPayload, { abortEarly: false });
            expect(error.details.length).toBeGreaterThan(1);
        });
    });


    describe('cancelLessonSchema', () => {
        it('should validate a valid cancel lesson payload', () => {
            const { error } = cancelLessonSchema.validate({ lessonId: 1 });
            expect(error).toBeUndefined();
        });

        it('should reject missing lessonId', () => {
            const { error } = cancelLessonSchema.validate({});
            expect(error).toBeDefined();
        });
    });

    describe('getLessonsByTutorSchema', () => {
        it('should validate a valid tutor user ID', () => {
            const { error } = getLessonsByTutorSchema.validate({ tutorUserId: 'tutor123' });
            expect(error).toBeUndefined();
        });

        it('should reject empty tutor user ID', () => {
            const { error } = getLessonsByTutorSchema.validate({ tutorUserId: '' });
            expect(error).toBeDefined();
        });
    });

    describe('availableLessonsSchema', () => {
        it('should validate a valid filter payload', () => {
            const valid = {
                subjectName: 'Math',
                grade: '10',
                level: 'Advanced'
            };
            const { error } = availableLessonsSchema.validate(valid);
            expect(error).toBeUndefined();
        });

        it('should reject missing subject name', () => {
            const { error } = availableLessonsSchema.validate({
                grade: '10',
                level: 'Advanced'
            });
            expect(error).toBeDefined();
        });
    });

    describe('enrollLessonSchema', () => {
        it('should validate a valid enrollment payload', () => {
            const { error } = enrollLessonSchema.validate({ lessonId: 5 });
            expect(error).toBeUndefined();
        });

        it('should reject missing lessonId', () => {
            const { error } = enrollLessonSchema.validate({});
            expect(error).toBeDefined();
        });
    });

    describe('withdrawLessonSchema', () => {
        it('should validate a valid withdrawal payload', () => {
            const { error } = withdrawLessonSchema.validate({ lessonId: 5 });
            expect(error).toBeUndefined();
        });

        it('should reject invalid lessonId type', () => {
            const { error } = withdrawLessonSchema.validate({ lessonId: 'abc' });
            expect(error).toBeDefined();
        });
    });

    describe('editLessonSchema', () => {
        it('should validate valid editable fields', () => {
            const valid = {
                lessonId: 1,
                description: 'Updated desc',
                format: 'online',
                locationOrLink: 'New link'
            };
            const { error } = editLessonSchema.validate(valid);
            expect(error).toBeUndefined();
        });

        it('should reject missing lessonId', () => {
            const { error } = editLessonSchema.validate({
                description: 'desc'
            });
            expect(error).toBeDefined();
        });

        it('should allow null values for optional fields', () => {
            const valid = {
                lessonId: 1,
                description: null,
                format: null,
                locationOrLink: null
            };
            const { error } = editLessonSchema.validate(valid);
            expect(error).toBeUndefined();
        });
    });

    describe('updateLessonVerdictSchema', () => {
        it('should validate a valid verdict payload', () => {
            const { error } = updateLessonVerdictSchema.validate({
                lessonId: 2,
                isApproved: true
            });
            expect(error).toBeUndefined();
        });

        it('should reject non-boolean isApproved', () => {
            const { error } = updateLessonVerdictSchema.validate({
                lessonId: 2,
                isApproved: 'yes'
            });
            expect(error).toBeDefined();
        });
    });
});