const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
var methodOverride = require('method-override')

const Blog = require('./models/blog');

const userRoute = require('./routes/user');
const blogRoute = require('./routes/blog');

const { checkForAuthenticationCookie } = require('./middlewares/authentication');



const app = express();
const port = 3000;

mongoose.connect('mongodb://mongo:zIDptFXmRbSDZjRuDvTFPwFvfIjBBUMZ@yamanote.proxy.rlwy.net:29508')
.then(()=>{
    console.log("database connected succesfully");
}).catch((err)=>{
    console.log(err);
})


app.set("view engine",'ejs');
app.set('views',path.resolve("./views"));
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(checkForAuthenticationCookie("token"));
app.use(methodOverride('_method'));


app.get("/",async (req,res)=>{

    const allBlogs = await Blog.find({});

    res.render("home",{
        user:req.user,
        blogs:allBlogs,
    });
});




app.use('/user',userRoute);
app.use('/blog',blogRoute);



app.listen(port,()=>{
    console.log("server working on port "+port);
})