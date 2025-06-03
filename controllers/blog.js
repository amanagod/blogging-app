const Blog = require('../models/blog');

async function newBlog(req,res){
    const {body,title} = req.body;
    
    const blog = await Blog.create({
           body,
           title,
           createdBy: req.user._id,
       });
   
       return res.redirect(`/`);
}

async function editBlog(req,res){
   let{newtitle,newbody}= req.body;


    let blog = await Blog.findByIdAndUpdate(req.params.id,{
        title:newtitle,
        body:newbody,
    });

    return res.redirect('/');

}

async function deleteBlog(req,res){

     await Blog.findByIdAndDelete(req.params.id);
return res.redirect('/');
    }

function getAddBlog(req,res){

    return res.render('addBlog',{
        user:req.user,
    });
}

async function getUpdateBlog(req,res){
    let blog = await Blog.findById(req.params.id);
    return res.render('editBlog',{
        user:req.user,
        blog,
    }); 
}

module.exports={
    newBlog,
    editBlog,
    deleteBlog,
    getAddBlog,
    getUpdateBlog
}