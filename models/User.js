const mongoose = require('mongoose');

const User = new mongoose.Schema({
    phone:{
        type:Number,
        required: true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    salt:{
        type:String,
        required:true
    }
});


module.exports = mongoose.model('User', User);