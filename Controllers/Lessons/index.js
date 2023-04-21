const {CreateLessonInEnglish, TestVerifyInputs} = require('./CreateLessonEng')
const createLessonRuz = require('./CreateLessonRu')
const {getAllLessons} = require('./GetAllLessons')
const {getLesson} = require('./getLesson')
const {DeleteLesson} = require('./DeleteLesson')
module.exports = {
    createLessonRuz,
    CreateLessonInEnglish,
    getAllLessons,
    getLesson,
    DeleteLesson,
    TestVerifyInputs
}