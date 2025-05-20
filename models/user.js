const {Schema,model} = require('mongoose');
const {createtokenforuser, validatetoken} = require('../services/authentication');

  const Uschema = Schema({
    fullname:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        requied:true,
        unique:true,
    },
    password:{
        type:String,
        required:true,
    },
    role:{
        type:String,
        enum:["USER","ADMIN"],
        default:"USER",
    },

},{timestamps:true});


Uschema.static('matchPassword',async function(email,password){
    const user = await this.findOne({email});
    if(!user) throw new Error('User Dont Exist!');

    const upassword = user.password;

    if(upassword !== password) throw new Error('Wrong password');

    const token = createtokenforuser(user);
    return token;
});




const User = model('user',Uschema);
 


module.exports = User;