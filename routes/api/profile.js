const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");

//Load Person Model
const Person = require("../../models/Person");

//Load Profile Model
const Profile = require("../../models/Profile");

// @type    GET
//@route    /api/profile/
// @desc    route for personnal user profile
// @access  PRIVATE
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        if (!profile) {
          return res.status(404).json({ profilenotfound: "No profile Found" });
        }
        res.json(profile);
      })
      .catch(err => console.log("got some error in profile " + err));
  }
);

// @type    POST
//@route    /api/profile/
// @desc    route for UPDATING/SAVING personnal user profile
// @access  PRIVATE
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const profileValues = {};
    profileValues.user = req.user.id;
    if (req.body.username) profileValues.username = req.body.username;
    if (req.body.website) profileValues.website = req.body.website;
    if (req.body.country) profileValues.country = req.body.country;
    if (req.body.portfolio) profileValues.portfolio = req.body.portfolio;
    if (typeof req.body.languages !== undefined) {
      profileValues.languages = req.body.languages.split(",");
    }
    //get social links
    profileValues.social = {};

    if (req.body.youtube) profileValues.social.youtube = req.body.youtube;
    if (req.body.facebook) profileValues.social.facebook = req.body.facebook;
    if (req.body.instagram) profileValues.social.instagram = req.body.instagram;

    //Do database stuff
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        if (profile) {
          Profile.findOneAndUpdate(
            { user: req.user.id },
            { $set: profileValues },
            { new: true }
          )
            .then(profile => res.json(profile))
            .catch(err => console.log("problem in update" + err));
        } else {
          Profile.findOne({ username: profileValues.username })
            .then(profile => {
              //Username already exists
              if (profile) {
                res.status(400).json({ username: "Username already exists" });
              }
              //save user
              new Profile(profileValues)
                .save()
                .then(profile => res.json(profile))
                .catch(err => console.log(err));
            })
            .catch(err => console.log(err));
        }
      })
      .catch(err => console.log("Problem in fetching profile" + err));
  }
);

// @type    GET
//@route    /api/profile/:username
// @desc    route for getting user profile based on USERNAME
// @access  PUBLIC       //any parameter that is stored in database and we are gonna use that by using :idname
router.get('/:username', (req, res) => {
  Profile.findOne({ username: req.params.username })
  .populate('user', ['name', 'profilepic'])  
  .then( profile => {
      if(!profile){
        res.status(404).json({usernotFound: 'User not Found'})
      }
      res.json(profile); //if profile is found then send back profile
    })
    .catch(e => console.log("Error is in fetching Profile by username" +e))

})       

// @type    GET
//@route    /api/profile/everyone
// @desc    route for getting user profile of everyone
// @access  PUBLIC       //any parameter that is stored in database and we are gonna use that by using :idname
router.get('/find/everyone', (req, res) => {
  Profile.find()
  .populate('user', ['name', 'profilepic'])  
  .then( profiles => {
      if(!profiles){
        res.status(404).json({usernotFound: 'No profile found'})
      }
      res.json(profiles); //if profile is found then send back profile
    })
    .catch(e => console.log("Error is in fetching Profile by users" +e))

})  

// @type    DELETE
//@route    /api/profile/
// @desc    route for Deleting users based on id
// @access  Private       
router.delete('/', passport.authenticate('jwt', { session: false }), (req ,res) => {
  Profile.findOne({user: req.user.id})
  Profile.findOneAndRemove( { user: req.user.id } )
    .then(() => {      //Found now remove
      Person.findByIdAndRemove({_id: req.user.id})
        .then(() => res.json({success: "Deleted Successfully"}))
        .catch(e => console.log(e))
    })
    .catch( e => console.log("Error is in Deleting a User " +e));
})

// @type    POST
//@route    /api/profile/mywork
// @desc    route for Adding work role profile of a person
// @access  Private 
router.post('/workrole', passport.authenticate('jwt', { session: false}), (req, res) =>
{
  Profile.findOne({user: req.user.id})
    .then(profile => {
      if(!profile){
        res.status(404).json({workloadnotFound: 'No Workload Founded'})
      }
      const newWork = {   //Collecting information from body
        role: req.body.role,
        company: req.body.company, 
        country: req.body.country,
        from: req.body.from,
        to: req.body.to,
        current: req.body.current,
        details: req.body.details
      };
      profile.workrole.unshift(newWork)   //we can insert array in Database by two Ways. push -> array will be inserted below previous data or unshift -> array will be pushed to top
      profile
      .save()
      .then(profile => res.json({profile}))
      .catch(e => console.log("Error is in Pushing Array to Database " +e))
    })
    .catch(e => console.log(e))
});

// @type    DELETE
//@route    /api/profile/workrole/:wid
// @desc    route for Deleting specific WorkRole
// @access  Private 
router.delete('/workrole/:wid', passport.authenticate('jwt', {session: false}), (req, res) => {
  Profile.findOne({user: req.user.id})
    .then(profile => {
      const removethis = profile.workrole        //removethis is storing the index of id which we want to remove which we are getting from url
        .map(item => item.id)
        .indexOf(req.params.wid);

        profile.workrole.splice(removethis, 1);

        profile
          .save()
          .then(profile => res.json(profile))
          .catch(e => console.log("Error is in saving after deletion of workrole" +e))
    })
    .catch(e => console.log("Error in Deleting Workrole " +e))
});


module.exports = router;
