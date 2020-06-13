const express = require('express');
const mongoose =  require('mongoose');
const passport = require("passport");

const router = express.Router();

//Post model
const Post = require('../../models/Post');
const Profile = require('../../models/Profile');

//Validation
const validatePostInput = require('../../validation/post');

// @route   GET api/posts/test
// @desc    Tests post route
// @access  Public

router.get('/test',(req,res)=>res.json(
    {msf:'Posts Works'}
    ));

// @route   GET api/posts
// @desc    Create Posts
// @access  Public

router.get('/',(req,res)=>{
    
    Post.find()
        .sort({date : -1})          //this will sort our posts by date
        .then(post => res.json(post))
        .catch(err => res.status(404).json({nopostsfound : 'No posts found with that ID'}));
});

// @route   GET api/posts/:id
// @desc    Get Post by id
// @access  Public

router.get('/:id',(req,res)=>{
    
    Post.findById(req.params.id)
        .then(post => res.json(post))
        .catch(err => res.status(404).json({nopostfound : 'No post found with that ID'}));
});


// @route   POST api/posts
// @desc    Cteate Posts
// @access  Private

router.post('/',passport.authenticate('jwt',{session:false}),(req,res)=>{

    const {errors,isValid} = validatePostInput(req.body);

    if(!isValid){
        return res.status(400).json(errors);
    }

    const newPost = new Post({
        text : req.body.text,
        name : req.body.name,
        avatar : req.body.avatar,
        user : req.user.id
    });

    newPost.save().then(post => res.json(post));

});

// @route   DELETE api/posts/:id
// @desc    Delete teh Post
// @access  Private

router.delete('/:id',passport.authenticate('jwt',{session:false}),(req,res)=>{
    Profile.findOne({user:req.user.id})
        .then(profile=>{
            Post.findById(req.params.id)
                .then(post => {
                    //check for post owner
                    if(post.user.toString() !== req.user.id){
                        return res.status(401).json({notauthorized : 'User not authorized'});
                    }

                    //delete
                    post.remove().then(()=> res.json({success : true}));
                    
                })
                .catch(err => res.status(404).json({postnotfound : 'No post found'}));
        })
});


// @route   POST api/posts/like/:id
// @desc    Like teh Post
// @access  Private

router.post('/like/:id',passport.authenticate('jwt',{session:false}),(req,res)=>{
    Profile.findOne({user:req.user.id})
        .then(profile=>{
            Post.findById(req.params.id)
                .then(post => {
                   
                    if(post.likes.filter(like => like.user.toString() === req.user.id).length > 0){
                        return res.status(400).json({ alreadyliked:'User already liked this post'});
                    }
                   
                    //add user id to likes array
                    post.likes.unshift({ user:req.user.id});

                    post.save().then(post=> res.json(post));
                    
                })
                .catch(err => res.status(404).json({postnotfound : 'No post found'}));
        })
});

// @route   POST api/posts/unlike/:id
// @desc    Unlike teh Post
// @access  Private

router.post('/unlike/:id',passport.authenticate('jwt',{session:false}),(req,res)=>{
    Profile.findOne({user:req.user.id})
        .then(profile=>{
            Post.findById(req.params.id)
                .then(post => {
                   
                    if(post.likes.filter(like => like.user.toString() === req.user.id).length === 0){

                        
                        return res.status(400).json({ notliked:'You have not yet like this post'});
                    }
                   
                    //get the remove index
                    const removeIndex = post.likes
                        .map(item => item.user.toString())
                        .indexOf(req.user.id);

                    post.likes.splice(removeIndex,1);

                    post.save().then(post=> res.json(post));
                    
                })
                .catch(err => res.status(404).json({postnotfound : 'No post found'}));
        })
});

// @route   POST api/posts/comment/:id
// @desc    comment to Post
// @access  Private

router.post('/comment/:id',passport.authenticate('jwt',{session:false}),(req,res)=>{


    const {errors,isValid} = validatePostInput(req.body);

    if(!isValid){
        return res.status(400).json(errors);
    }

    Post.findById(req.params.id)
        .then(post => {

            const newComment={
                text : req.body.text,
                name : req.body.name,
                avatar: req.body.avatar,
                user :req.user.id
            };

            //add to comment array
            post.comments.unshift(newComment);

            post.save().then(post => res.json(post));
        })
        .catch(err => res.status(404).json({postnotfound:'No post found'}));
});


// @route   DELETE api/posts/comment/:id/:comment_id
// @desc    delete a comment from Post
// @access  Private

router.delete('/comment/:id/:comment_id',passport.authenticate('jwt',{session:false}),(req,res)=>{



    Post.findById(req.params.id)
        .then(post => {

              //check if comment exists
              if(post.comments.filter(comment => comment._id.toString()===req.params.comment_id).length === 0 )    {
                return res.status(404).json({commentnotexists:'Comment does not exists'});

              }

              //get the remove index

              const removeIndex = post.comments
                .map(item => item.id.toString())
                .indexOf(req.params.comment_id);

                post.comments.splice(removeIndex,1);

                post.save().then(post => res.json(post));
        })
        .catch(err => res.status(404).json({postnotfound:'No post found'}));
});


module.exports = router; 