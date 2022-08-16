var express = require("express");
var router = express.Router();
const userModel = require("./users");
const imageModel = require('./uploads')
const infoo = imageModel.find()
// console.log(infoo);
const Passport = require("passport");
const localStrategy = require("passport-local");
const users = require("./users");
const multer = require('multer')
const path =  require('path')

const storage = multer.diskStorage({
  destination:(req,file,cb) =>{
    cb(null , './public/viaMulter');
  },
  filename:(req,file,cb) =>{
    cb(null, Date.now() +  path.extname(file.originalname))
  },
})

const upload = multer({
  storage:storage
})

const GOOGLE_CLIENT_ID = "184644567601-712m204ljidhmliomk42a9deq45h7i4k.apps.googleusercontent.com";
const GOOGLE_CLIENT_SECRET = "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";
const findOrCreate = require("mongoose-findorcreate");
const { Error, mongo } = require("mongoose");




//google -aouth2.0
var GoogleStrategy = require("passport-google-oauth2").Strategy;

Passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
      passReqToCallback: true,
    },
    function (request, accessToken, refreshToken, profile, done) {
      userModel.findOrCreate({ username: profile.email , name:profile.displayName}, function (err, user) {
        console.log(user);
        return done(err, user);
      });
    }
  )
);

router.get(
  "/auth/google",
  Passport.authenticate("google", { scope: ["email", "profile"] })
);

router.get(
  "/auth/google/callback",
  Passport.authenticate("google", {
    successRedirect: "/indexOfProfile",
    failureRedirect: "/",
  })
);

// router.get('/ok' , (req,res)=>{
//   res.send("google aunthentication is working")
// })

Passport.use(new localStrategy(userModel.authenticate()));

/* GET home page. */
router.get("/", checkIsLoggedIn, function (req, res, next) {
  res.render("index");
});

//Api for creating a user
router.post("/create", function (req, res, next) {
  const newUser = new userModel({
    username: req.body.username,
    name: req.body.name,
  });
  userModel.register(newUser, req.body.password)
  .then(function () {
    Passport.authenticate("local")(req, res, function () {
      res.redirect("/profile");
    });
  });
});

router.get("/profile", isLoggedIn, function (req, res, next) {
  userModel.find().then(function (users) {
    res.render("profile", { users });
  });
});


//Api for login 
router.post("/login",
  Passport.authenticate("local", {
    successRedirect: `/indexOfProfile`,
    failureRedirect: "/",
  })
);

//Api of userProfile page
router.get("/indexOfProfile", isLoggedIn, function (req, res, next) {
  userModel.findOne({ username: req.user.username })
  .then(function (userInfo) {
    console.log(userInfo)
    res.render("indexOfProfile", { hi: userInfo });
  });
});

//Api for logout
router.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) throw err;
    res.redirect("/");
  });
});




//Multer API
router.post("/uploads", upload.array('photos' , 12 ), async function (req, res) {
  console.log(req.files);
   await req.files.forEach((data)=>{
    imageModel.create({
      imageName:data.filename
    })
  })
  res.redirect('/uploaded')


  
});

router.get("/uploaded", async function (req, res) {
  let allFiles = await imageModel.find()
  console.log(allFiles)
  res.render('uploadedFiles' , {allFiles})

});


//delete API
router.get("/delete/:id", function (req, res) {
  imageModel.findOneAndDelete({_id:req.params.id})
  .then(function(deletedFile){
    // res.send(deletedFile)
    res.redirect('back')
  })
  
});


//middleware function
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("/");
  }
}

//function for checkIsLoggedIn

function checkIsLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    res.redirect("/indexOfProfile");
  } else {
    return next();
  }
}
module.exports = router;
