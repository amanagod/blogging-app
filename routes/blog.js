const {Router} = require("express");
const router = Router();
const Blog = require('../models/blog');
const{ newBlog, editBlog, deleteBlog, getAddBlog,getUpdateBlog }= require("../controllers/blog")

var express = require('express')
var methodOverride = require('method-override')
var app = express()
 
app.use(methodOverride('_method'))



router.get('/add-new',getAddBlog);


router.post('/', newBlog);


router.get('/edit/:id',getUpdateBlog);

router.patch('/edit/:id',editBlog);


router.delete('/:id', deleteBlog);

module.exports=router;