const mongoose = require('mongoose');
const rounds = 10;
require('dotenv').config('../.env');
(async()=>{
    mongoose.connect(process.env.MONGO_URL)
})()
.then((res)=>{
    console.log("connection established");
});

// User functions
const User = require('../models/User');
const bcrypt = require('bcrypt');

async function CreateUser(user) {
    const salt = await bcrypt.genSalt(rounds);
    const hash = await bcrypt.hash(user.password,salt);
    let data = await User.find({email: user.email});
    if(data[0]==undefined){
        let newUser = new User({email:user.email, 'salt':salt, password:hash,phone:user.phone});
        await newUser.save();
        return true;
    }else{
        return null;
    }
}

async function verifyUser(user){
    let data = await User.find({email:user.email});
    if(data[0]==undefined || data.length >1){
        return null;
    }
    else{
       let currhash = await bcrypt.hash(user.password,String(data[0].salt));

       if(currhash === data[0].password){
        return true;
       }
       else{
        return null;
       }
    }
}
// Image functions
const Images = require('../models/Images');
async function LookAtImages(){
    let data = await Images.find();
    let a = parseInt((Math.random())*data.length);
    return data[a];
}
async function LookAtImage(index){
    try{
        let data = await Images.find();
        let a = parseInt(index);
        return data[a];

    }
    catch(err){
        return null;
    }
}

async function addImages(fileName){
    let data = new Images({"path":`public/images/${fileName}`,rating:4});
    await data.save();
}

module.exports = {
    addImages,
    LookAtImages,
    LookAtImage,
    CreateUser,
    verifyUser
};
