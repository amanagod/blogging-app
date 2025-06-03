const User = require('../models/user');

async function userSignin(req,res){
    const {email,password} = req.body;

    try {

    const token = await User.matchPassword(email,password);

// console.log("token",token); 
    return res.cookie('token',token).redirect("/");
} catch (error) {
    
    return res.render('signin',{
        error:"Wrong password try again",
    });
}

}


async function userSignup(req,res){
    const {fullname,email,password } = req.body;
    await User.create({
        fullname,
        email,
        password,
    });
    return res.redirect('/');
}

module.exports={
    userSignin,
    userSignup,
}