const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');


//Load Person Model
const Person = require("../../models/Person");

//Load Profile Model
const Profile = require("../../models/Profile");

//Load Profile Model
const Question = require("../../models/Question");

// @type    GET
//@route    /api/questions/
// @desc    route for viewing questions
// @access  PUBLIC
router.get("/", (req, res) => {
    Question
        .find()
        .sort({ date: 'desc' })
        .then(questions => res.json(questions))
        .catch(e => res.json({noquestions: "No question to fetch for View"}));
});

// @type    POST
//@route    /api/questions/
// @desc    route for submitting Questions
// @access  PRIVATE
router.post("/", passport.authenticate('jwt', {session: false}), (req, res) => {
    const newQuestion = new Question({
        textone: req.body.textone,
        texttwo: req.body.texttwo,
        user: req.user.id,
        name: req.body.name
    });
    newQuestion
        .save()
        .then(question => res.json(question))
        .catch(e => console.log("Error in uploading Questions " +e))     //Pushing question to the Database
})

// @type    POST
//@route    /api/questions/answers/:id
// @desc    route for submitting Answers to Questions
// @access  PRIVATE
router.post('/answers/:id', passport.authenticate('jwt', {session:false}), (req, res) => {
    Question.findById(req.params.id)
        .then(question => {
            const myAnswer = {
                user: req.user.id,
                name: req.user.name,
                answer: req.body.answer
            };
            question.answers.push(myAnswer); //Answer is saved in array
            question
                .save()
                .then(question => res.json(question))
                .catch(e => console.log("Error in saving answer as a array in the Database " +e))
        })
        .catch(e => console.log("Error in Answers " +e))
})

// @type    POST
//@route    /api/questions/upvote/:questionid
// @desc    route for upvoting the Question
// @access  PRIVATE
router.post('/upvote/:id', passport.authenticate('jwt', {session: false}), (req, res) => {
    Profile.findOne({user: req.user.id})
        .then(profile => {
            Question.findById(req.params.id)
                .then(question => {
                    if (question.upvotes
                        .filter(upvote => 
                        upvote.user.toString() === req.user.id.toString()).length > 0) {
                            return res.status(400).json({upvoted: "You have Already Upvoted"})
                        }        //finding if user is already in the Upvoted list
                        question.upvotes.unshift({user: req.user.id});
                        question
                            .save()
                            .then(question => res.json(question))
                            .catch(e => console.log("Error in saving upvotes to database" +e))
                    })
                .catch(e => console.log("Error in finding the Question for Upvoting " +e))
        })
        .catch(e => console.log("Error in Upvoting " +e))
});


module.exports = router;
