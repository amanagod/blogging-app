const {Schema,model} = require('mongoose');
const {createtokenforuser, validatetoken} = require('../services/authentication');
const { createHmac , randomBytes } = require('node:crypto');

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
    salt:{
        type:String,
        // required:true,
    },

},{timestamps:true});


Uschema.static('matchPassword',async function(email,password){
    const user = await this.findOne({email});
    if(!user) throw new Error('User Dont Exist!');

    const salt = user.salt;
    const hashedPassword = user.password;

    const userProvidedHash= createHmac('sha256',salt)
    .update(password)
    .digest('hex');

    if(userProvidedHash !== hashedPassword) throw new Error('Wrong password');

    const token = createtokenforuser(user);
    return token;
});

Uschema.pre("save",function (next){
    const user = this;

    // if(!user.isModefied("password")){return };

    const salt = randomBytes(16).toString();
    const hashPassword = createHmac('sha256',salt)
    .update(user.password)
    .digest('hex');

    this.salt = salt;
    this.password=hashPassword;

    next();
});


const User = model('user',Uschema);
 


module.exports = User;