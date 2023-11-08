const mongoose = require('mongoose');
require('dotenv').config('../.env');
(async()=>{
    mongoose.connect(process.env.MONGO_URL)
})()
.then((res)=>{
    console.log("connection established");
});
const User = require('../models/User');
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
    LookAtImage
};