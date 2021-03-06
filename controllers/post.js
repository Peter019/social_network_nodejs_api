const Post = require('../models/post');
const formidable = require("formidable");
const fs = require("fs");
const _  = require('lodash');

function getPosts(req,res){

    const posts = Post.find({postedBy:req.profile.following}).select("_id title body").populate("postedBy","_id name").sort({created:-1})
        .then(posts =>{res.status(200).json(posts)})
    .catch(err => console.log(err));

}

function createPost(req,res,next) {

    let form = new formidable.IncomingForm();
    form.keepExtensions = true;

    form.parse(req , (err,fields,files) =>{

        if(err){
            return res.status(400).json({
                error:"Image could not be uploaded."
            })
        }

    let post = new Post(fields);
    req.profile.passwd_hash =undefined;
    req.profile.salt =undefined;
    req.profile.email = undefined;
    post.postedBy = req.profile;

    if(files.picture){
        post.picture.data =fs.readFileSync(files.picture.path);
        post.picture.contentType= files.picture.type;
    }

    post.save((err,result) =>{
        if(err){
            return res.status(400).json({
                error:err
            })
        }
        res.json( result );
})
});
}

function postsByUser(req,res){

    Post.find({postedBy:req.profile._id}).populate("postedBy", "_id name").sort({created:-1})
        .exec((err,posts) =>{

        if(err){
            return res.status(400).json({
                error:err
            })

        }
        res.status(200).json(posts);
});
}

function postById(req,res,next,id){

    Post.findById(id).populate("postedBy" , "_id name").select('_id title body created picture').exec((err,post) =>{

        if(err || !post){
        return res.status(400).json({
            error:err
        })
    }
    req.post = post;
    next();
});
}

function isAuthor(req,res,next){

    let isAuthor = req.post && req.auth && req.post.postedBy._id == req.auth._id;

    if(!isAuthor){
        return res.status(403).json({
            error:"Unauthorized. You are not the author of this post"
        });
    }
    next();
}

function deletePost(req,res){

    let post = req.post;
    post.remove((err,post) =>{

        if(err) {
            return res.status(400).json({
                error: err
            })
        }
        res.json({
            message:"Post deleted successfully"
        })
    })
}

function updatePost(req, res, next){
    let form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.parse(req, (err, fields, files) => {
        if (err) {
            return res.status(400).json({
                error: 'Photo could not be uploaded'
            });
        }
        // save post
        let post = req.post;
        post = _.extend(post, fields);
        post.updated = Date.now();

        if (files.picture) {
            post.picture.data = fs.readFileSync(files.picture.path);
            post.picture.contentType = files.picture.type;
        }

        post.save((err, result) => {
            if (err) {
                return res.status(400).json({
                    error: err
                });
            }
            res.json(post);
        });
    });
};

function getPicture(req,res,next){
    res.set("Content-Type" , req.post.picture.contentType);
    return res.send(req.post.picture.data);
}

function singlePost (req, res){
    return res.json(req.post);
};

module.exports={
    getPosts,
    createPost,
    postsByUser,
    postById,
    isAuthor,
    deletePost,
    updatePost,
    getPicture,
    singlePost
}
