const express = require('express');
const app = express();
app.set('trust proxy', 2);// app.get('/ip', (request, response) => response.send(request.ip))

require('dotenv').config();
const morgan  = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const multer = require('multer');
const upload = multer();
const data = require('./database/data');
const path = require('path');
const jwt = require('jsonwebtoken');

const RateLimit = require('express-rate-limit');
const limiter = RateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20,
});

// initialize reddit to stored blacklist
const redis = require('redis');
const {createClient} = redis;
const client = new createClient({
    legacyMode:false,
    password: process.env.REDIS_KEY,
    socket: {
        host: 'redis-10511.c114.us-east-1-4.ec2.cloud.redislabs.com',
        port: 10511
    }
}).on('error', err => console.log('Redis Client Error', err));

client.connect().then(res=>{
    console.log('Connected to redis');
}).catch(err=>{
 console.log(err);
});



// initialize middlewares
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cors());
app.use(upload.array());
app.use(helmet({
    crossOriginResourcePolicy:{policy:"cross-origin"}
}));
app.use(limiter);

// initialize port
const PORT = process.env.PORT || 5000;

// middleware to check for logins
async function isLoggedIn(req, res, next){
    let {token} = req.query;
    if(token){
        let result = await client.get(token)
    }
    else{
        return res.status(403).redirect('/api/login');
    }
    
    if(result==='false'){
        return res.status(403).redirect('/api/login');
    }
    try{
        let data = jwt.verify(token,process.env.SECRET_KEY)
        if(data.user != undefined){
            next();
        }else{
        return res.status(403).redirect('/api/login');
        }
    }
    catch(err){
        return res.status(403).redirect('/api/login');
    }
}


app.get('/',(req,res)=>{
    res.status(200).json({status:true,message:"connection established"});
});

app.post('/api/signup',async (req,res)=>{
    let result = await data.CreateUser(req.body);
    if(result){
        const token = jwt.sign({user:req.body.email},process.env.SECRET_KEY,{expiresIn:60*60});
        return res.status(200).json({status:true,message:"signup successful",'token':token});
    }
    else{
        return res.status(401).json({status:false,message:"Denied"});
    }
}); 

app.get('/api/login', (req, res) => {
    res.json({status:false,message:"not logged in"});
})
app.post("/api/login", async function(req, res){
    let result = await data.verifyUser(req.body);
    
    if(result){
        const token = jwt.sign({user:req.body.email},process.env.SECRET_KEY,{expiresIn:60*60});
        return res.status(200).json({status:true,message:"login successful",'token':token});
    }
    else{
        return res.status(403).json({status:false,message:"Denied"});
    }
});

app.use(isLoggedIn); // middleware for logged in users

app.get("/api/image/:id?",async(req,res)=>{

    if(req.params.id!=undefined){
        let dat= await data.LookAtImage(req.params.id);
        if(dat) return res.status(200).sendFile(path.join(__dirname,dat.path));
        else{
        return res.status(400).json({success:false,message:"Wrong url"});
            
        }
    }   
    else{
        return res.status(400).json({success:false,message:"Wrong url"});
    }
});

app.post("/api/logout?",async(req,res)=>{
    let {token} = req.query;
    let result = await client.set(token,'false',{EX:60*60});
    // console.log("hu "+result);
    res.status(200).json({success:true,message:"logged out"});
});


app.listen(PORT,()=>{
console.log(`Listening to port ${PORT}....`);
}); 
