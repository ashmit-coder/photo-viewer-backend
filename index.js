const express = require('express');
const app = express();
app.set('trust proxy', 2)
// app.get('/ip', (request, response) => response.send(request.ip))

const morgan  = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const multer = require('multer');
const passport =  require('passport');
const LocalStrategy = require('passport-local');
const {createClient} = require('redis');
const RedisStore = require('connect-redis').default;
const upload = multer();
require('dotenv').config();
const path = require('path');
const RateLimit = require('express-rate-limit');
const limiter = RateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20,
  });

const PORT = process.env.PORT || 5000;
const session = require('express-session');
const data = require('./database/data');
const User = require('./models/User');

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.status(400).redirect("/login");
}


// initialize redis store
const redisClient = createClient({
    password: process.env.REDIS_KEY,
    socket: {
        host: 'redis-10511.c114.us-east-1-4.ec2.cloud.redislabs.com',
        port: 10511
    }
});
redisClient.connect().then(()=>{console.log("Connected to cache")}).catch(console.error);
let redisStore = new RedisStore({
    client: redisClient,
    prefix:"myapp:",
    ttl: 3000000
});

app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cors());
app.use(upload.array());
app.use(helmet({
    crossOriginResourcePolicy:{policy:"cross-origin"}
}));
app.use(limiter);


app.get('/',(req,res)=>{
    res.status(200).json({status:true,message:"connection established"});
});
// initializing sessions based services
app.use(session({
    store:redisStore,
    resave:false,
    saveUninitialized:false,
    secret:process.env.SECRET,
    cookie:{
        maxAge:3000000,
        httpOnly:true
    }
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.post('/api/signup',async (req,res)=>{
    console.log(req.body);
     User.register(new User(req.body),req.body.password,(err,user)=>{
        if(err){
            console.log(err);
            return res.status(400).json({success:false,message:"Error registering"});
        }
        else{
             req.login(user,(err)=>{
                console.log(err);
                return res.status(200).json({success:true,message:"User registered successfully"});
            })
          
        }
    })
}); 

app.post("/api/login", passport.authenticate("local",{
    successRedirect: "/",successFlash:true,successMessage:"Login Success",
    failureRedirect: "/api/login"
}), function(req, res){
    res.status(200).json({success:true, message:"Login successful"})
});

app.post('/admin/login',(req,res)=>{

    if(req.body.user===process.env.user && req.body.password===process.env.password){

        return res.send("Admin logged in");
    }
    res.redirect('/login');
});

app.get("/api/image/:id",async(req,res)=>{
    if(req.isUnauthenticated()){
        return res.status(403).json({success:false,message:"Access denied"});
    }


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

app.post("/api/logout",async(req,res)=>{
    if(!req.isAuthenticated()){
        return res.status(205).redirect('/login');
    }
    req.logout("local",(err)=>{
        if(err){
            console.log(err);
           return res.status(404).json({message:"Error while logging out",success:false});
        }
    
        res.status(200).json({message:"Logged out",success:true});

    })
});

app.listen(PORT,()=>{
console.log(`Listening to port ${PORT}....`);
}); 