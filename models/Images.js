const mongoose = require('mongoose');
require('dotenv').config('../.env');

const Images = new  mongoose.Schema({
    path:{
        type: String,
        required: true
    },
    "rating" : {
        type : Number,
        required: true
    }
});


module.exports = mongoose.model('Image', Images);