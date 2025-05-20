const {Schema,model} = require('mongoose');

const Uschema = Schema({
    title:{
        type:String,
        required:true,
    },
    body:{
        type:String,
        requied:true,
    },
    createdBy:{
        type: Schema.Types.ObjectId,
        ref:'user',
    }

},{timestamps:true});

const Blog = model('blog',Uschema);



module.exports=Blog;