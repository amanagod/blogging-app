const {Router} = require("express");
const User = require('../models/user');
const { userSignup, userSignin } = require('../controllers/user');
const router = Router();


router.get('/signin',(req,res)=>{
    return res.render("signin");
});


router.get('/signup',(req,res)=>{
    return res.render("signup");
});

router.post('/signin',userSignin);

router.post("/signup", userSignup);

router.get('/logout',(req,res)=>{
    res.clearCookie('token').redirect('/');
})

module.exports = router;