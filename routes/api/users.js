const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const keys = require('../../config/keys')
const jwt = require('jsonwebtoken');
const passport = require('passport');

//load input validation
const validateRegisterInput = require('../../validation/register');
const validateLoginInput = require('../../validation/login');




//load user model
const User   = require('../../models/User');

// @route   GET api/users/test
// @desc    Tests users route
// @access  Public

router.get('/test',(req,res)=>res.json(
    {msf:'Users Works'}
    ));

// @route   GET api/users/register
// @desc    Register User
// @access  Public

router.post('/register',(req,res)=>{

    const {errors,isValid } = validateRegisterInput(req.body);
    if(!isValid){
        return res.status(400).json(errors);
    }

    User.findOne({ email : req.body.email})
    .then(user =>{
        if(user){
            errors.email = 'Email already exists';
            return res.status(400).json(errors)
        }else{
            const avatar = gravatar.url(req.body.email,{
                s:'200', //size
                r:'pg', // rating
                d:'mm'  //default
            });

            console.log("Gravatar : " + avatar);
            const newUser = new User({
                name : req.body.name,
                email : req.body.email,
                avatar,
                password:req.body.password
            });

            bcrypt.genSalt(10,(err,salt)=>{
                bcrypt.hash(newUser.password,salt,(err,hash)=>{
                    if(err) throw err;
                    newUser.password = hash;
                    newUser.save()
                    .then(user =>res.json(user))
                    .catch(err => console.log(err));
                });
            })
        }
    })
});


// @route   GET api/users/login
// @desc    Login User / Returning JWT Token
// @access  Public
router.post('/login',(req,res)=>{

    const {errors,isValid } = validateLoginInput(req.body);
    if(!isValid){
        return res.status(400).json(errors);
    }


    const email  = req.body.email;
    const password = req.body.password;

    //find  user by email
    User.findOne({email})
    .then(user =>{
        //check the user
        if(!user){
            errors.email = 'User Not Found';
            return res.status(404).json(errors);
        }

        //check password
        bcrypt.compare(password,user.password)
        .then(isMatch => {
            if(isMatch){
                // res.json({msg:'Success'});

                //user matched
                const payload  ={ id:user.id, name:user.name, avatar:user.avatar}

                //sign token
                jwt.sign(payload,
                    keys.secretOrKey,
                    {expiresIn : 3600},
                    (err,token)=>{
                        res.json({
                            success: true,
                            token: 'Bearer ' + token
                        });
                });
            }else{
                errors.password = 'Password is Incorrect';
                return res.status(400).json(errors);
            }
        });
    })

}); 


// @route   GET api/users/curent
// @desc    Return current User
// @access  Private
router.get('/current',passport.authenticate('jwt',{session:false}),(req,res)=>{
    res.json(req.user);

});

module.exports = router;    