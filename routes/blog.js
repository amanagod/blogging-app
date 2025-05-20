const {Router} = require("express");
const router = Router();
const Blog = require('../models/blog');

var express = require('express')
var methodOverride = require('method-override')
var app = express()
 
app.use(methodOverride('_method'))



router.get('/add-new',(req,res)=>{
    return res.render('addBlog',{
        user:req.user,
    });
})


router.post('/', async (req,res)=>{
    const {body,title} = req.body;
    
 const blog = await Blog.create({
        body,
        title,
        createdBy: req.user._id,
    });

    return res.redirect(`/blog/${blog._id}`);
});


router.get('/edit/:id',async (req,res)=>{

    let blog = await Blog.findById(req.params.id);
    return res.render('editBlog',{
        user:req.user,
        blog,
    }); 

});

router.patch('/blog/:id', async (req,res)=>{
// res.send("working");
let {newbody,newtitle}= req.body;
let blog = await Blog.findById(req.params.id);
blog.title=newtitle;
blog.body=newbody;

});


router.delete('blog/:id', async (req,res)=>{
// console.log('working');
let blog = await Blog.findByIdAndDelete(req.params.id);
});

module.exports=router;