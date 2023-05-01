### Back-End API For Online School 
 ## DESCRIPTION 
 ..... 

 ## How to use the API?
 First, there are two types of routes, admin routes and user routes. Admin routes illustrate actions that ONLY admins can perform. For exampe, upload or delete a lesson. User routes, as the name suggest are for users ONLY.
   # Authorization
   - You need to include JWT token in the HEADERS of every request except for login or register. 
   # User Routes 
   - GET ALL COURSES, the request type = GET, body = none, returns = { courses, user }__
   courses = [
    {
        id: courseId,
        name: courseName,
        coursePicture: url for the course pictrue,
        minScore: min score to access the course,
        isCompleted: true/false shows if a user has completed the course
    }], 
    user = {
        profilePicture: url for a user avatar,
        progressScore: shows what courses a user can access and what they cannot,
        email,
        name
    } 
    - GET ALL LESSONS, the request type = GET, body = none, returns = {lessons, currentScore},
    lessons = [
        {
            lessonId,
            lessonPicture: url,
            isCompleted: show if a user already completed the course,
            title
        }
    ] 
    currentScore = shows a progress of a user in the given COURSE, it is NOT a general progress. DO NOT CONFUSE WITH progressScore
    - GET ONE LESSON, the request type = GET, body = none, returns {lesson},
    lesson = {

    }
 ...