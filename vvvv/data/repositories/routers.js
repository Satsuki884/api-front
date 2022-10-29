import express from 'express';
import { users, posts, categories, post_category, comments, commentsLikes, like_post } from '../../data/utils/initTables.js';
const router = express.Router();
import bcrypt from 'bcrypt';
import jsonwebtoken from 'jsonwebtoken';
import confirm_token from "../../data/utils/checkToken.js";
import { password_validator, username_validator, email_validator } from '../utils/registerErrorHandler.js';
import {get_current_date}  from '../../core/interactors/interactor.js';
import { parseJwt }  from '../../data/utils/jsonwebtoken.js';
import { sendEmail }  from '../../data/utils/sendEmail.js';
import { checkAdmin }  from '../../data/utils/checkAdmin.js';
import {upload} from '../../data/utils/uploadAvatar.js';
import dotenv from "dotenv";
dotenv.config();
import Sequelize from 'sequelize';
const Op = Sequelize.Op;

import UserClass from '../../core/entities/DB.js';

const User = new UserClass();

//AUTH
router.post("/api/auth/register", async (req, res) => {
    try {
        let exists = await User.find_in_db(users, { where: { [Op.or]: [{login: req.body.login}, {email: req.body.email}] } });
        if(exists) {
            return res.send('User already exists!');
        }
    }
    catch(err) {
        console.error(err);
        return res.send('Unexpected error');
    }

    if(!password_validator(req.body.password)){
        return res.send('Enter password');
    }

    if(!password_validator(req.body.confirm_password)){
        return res.send('Enter confirm password');
    }

    if(req.body.password !== req.body.confirm_password){
        return res.send('Password do not match');
    }

    if(!password_validator(req.body.email)){
        return res.send('Enter email');
    }

    if(!password_validator(req.body.full_name)){
        return res.send('Enter full name');
    }
    
    const pass = await bcrypt.genSalt(12);
    req.body.password = await bcrypt.hash(req.body.password, pass);
    let login = req.body.login;
    let password = req.body.password;
    let full_name = req.body.full_name;
    let email = req.body.email;
    let role = req.body.role;

        let user = {
            login: login,
            password: password,
            full_name: full_name,
            email: email,
            role: role,
        };
    
        const token = jsonwebtoken.sign({object: user},
            process.env.SECRET_REGISTER, {expiresIn: '15m'});
        const link = `http://localhost:8000/api/auth/confirm/${token}`;
        console.log('\n\n'+link+'\n\n');
        sendEmail(email, "Here is link for finish registration: ", link);

        return res.json(`message send`);
    }
  );

router.post('/api/auth/confirm/:token', async (req, res) => {
    const { token } = req.params;
    console.log(token+'\n\n', process.env.SECRET_REGISTER);
    jsonwebtoken.verify(token, process.env.SECRET_REGISTER);
        
        try {
            let object = parseJwt(token).object;
            // console.log(object);
            await User.create_smth(users, object);
            return res.send('Email confirmed successfully!');
        }
        catch(err) {
            // console.log('blyaa 1');
            console.error(err);
            return res.json('Something is wrong.');
        }
});

router.post("/api/auth/login", async (req, res) => {
    try {
        let passCheck;
        let exists;
        try {
            exists = await User.find_in_db(users, { where: { login: req.body.login} });

            if(!exists) {
                return res.send('Login is incorrect');
            }
            
            passCheck = bcrypt.compareSync(req.body.password, exists.password);

            if(!passCheck) {
                return res.send('Password is incorrect');
            }
        }
        catch(err) {
            console.error(err);
            return res.send('Unexpected error');
        }

        const token = jsonwebtoken.sign({object: exists},
            process.env.TOKEN_KEY, {expiresIn: "2h"});

        res.cookie('token', token);
        console.log(token);

        return res.header("token", token).status(200).send({ confirm_token: true, token: token });
    }
    catch(err) {
        return res.send('There is no user with such login');
    }

});

router.post('/api/auth/logout', confirm_token, (req, res) => {
    // console.log('\n---------------------\nSuccessfully log out\n---------------------\n');
    res.status(200).send({ auth: false, token: null });
});

router.post('/api/auth/password-reset', async (req, res) =>{
    let user = await User.find_in_db(users, { where: { email: req.body.email } });
    if(user === null) {
        return res.send('You are not you');
    }

    //Creating confirm token
    const token = jsonwebtoken.sign({email: user.email, id: user.id},
        process.env.SECRET_REGISTER, {expiresIn: '5m'});
    const link = `http://localhost:8000/api/auth/password-reset/${token}`;

    //Sending the message with link

    console.log('\n\n'+link+'\n\n');
    sendEmail(req.body.email, "You can reset your password by using this: ", link);

    console.log('Token was sent successfully!');
    return res.json({ message: 'Token was sent successfully!'});
});

router.post('/api/auth/password-reset/:token', async (req, res) => {
    const { token } = req.params;
    const { password, confirm_password } = req.body;

    try {
        jsonwebtoken.verify(token, process.env.SECRET_REGISTER);
        if(password != confirm_password) {
            return res.send('Please, repeat your password');
        }
        try {
            console.log('1');
            const pass = await bcrypt.genSalt(12);
            req.body.password = await bcrypt.hash(req.body.password, pass);
            await User.update_smth(users, { password: req.body.password }, { where: { email: parseJwt(token).email} });
            return res.send('Password has been successfully updated');
        }
        catch(err) {
            console.error(err);
            return res.send('Something is wrong.');
        }
    }
    catch(err) {
        return res.send('This link is no longer reachable');
    }
});

//USERS
router.get('/api/users', confirm_token, async (req, res) => 
{
        try 
        {
            const result = await User.find_all_in_db(users);
            return res.json(result);
        }
        catch(err) 
        {
            return res.send('Something is wrong.');
        }
});

router.get('/api/users/:user_id', confirm_token, async (req, res) => 
{
    try {
        const result = await User.find_in_db(users, { where: { id: +req.params.user_id } });
        if(result === null) 
        {
            return res.send('User is not found');
        }
        return res.send(result);
    }
    catch(err) 
    {
        return res.send('Some error occured');
    }
});

router.post('/api/users', confirm_token, checkAdmin, async (req, res) => 
{
        try {
            let exists = await User.find_in_db(users, { where: { [Op.or]: [{login: req.body.login}, {email: req.body.email}] } });
            if(exists) {
                return res.send('User is already exists!');
            }
        }
        catch(err) {
            console.error(err);
            return res.send('Unexpected error');
        }

        if(req.body.password !== req.body.confirm_password) {
            return res.send('Passwords are different');
        }
        if(password_validator(req.body.password)) {
            return res.send('Password is not strong enough');
        }
        if(username_validator(req.body.fullname)) {
            return res.send('Please enter your full name');
        }
        if(email_validator(req.body.email)) {
            return res.send('Email is not valid');
        }

        const pass = await bcrypt.genSalt(12);
            req.body.password = await bcrypt.hash(req.body.password, pass);

        let object = {
            login: req.body.login,
            password: req.body.password,
            email: req.body.email,
            full_name: req.body.full_name,
            role: req.body.role
        };


        try {
            console.log(object);
            await User.create_smth(users, object);
            res.send('User created successfully');
        }
        catch(err) {
            res.send('Error while creating user');
        }
});

router.patch('/api/users/avatar', confirm_token, upload.single('image'), async (req, res) => 
{
    try 
    {
        await User.update_smth(users, { profile_image: `resources/image/${req.file.filename}`}, { where: { id: req.user.id } });
        res.send('Image has been uploaded!');
    } catch (error) 
    {
        console.error(error);
        res.json('Unexpected error');
    }
});

router.patch('/api/users/:user_id', confirm_token, async (req, res) => 
{
    if(+req.params.user_id === req.user.id) 
    {
        try {
            let exists = await User.find_in_db(users, { where: { id: +req.params.user_id } });
            if(!exists) 
            {
                return res.send('User have not found');
            }
        }
        catch(err) 
        {
            console.error(err);
            return res.send('Unexpected error');
        }
        if(req.body.password && req.body.confirm_password && req.body.password === req.body.confirm_password) {
            if(password_validator(req.body.password)) {
                return res.send('Password is not strong enough');
            }
            const pass = await bcrypt.genSalt(12);
            req.body.password = await bcrypt.hash(req.body.password, pass);
            const password = req.body.password;

            try {
                await User.update_smth(users, { password: password }, { where: { id: +req.params.user_id } });
            }
            catch(err) {
                console.error(err);
                return res.send('Unexpected error');
            }
        }else{
            return res.send('Password do not match');
        }
        if(req.body.fullname) 
        {
            if(username_validator(req.body.fullname)) 
            {
                return res.send('Please enter your full name');
            }

            try 
            {
                await User.update_smth(users, { fullname: req.body.fullname }, { where: { id: +req.params.user_id } });
            }
            catch(err) 
            {
                console.error(err);
                return res.send('Unexpected error');
            }
        }
        if(req.body.login) 
        {
            try 
            {
                await User.update_smth(users, { login: req.body.login }, { where: { id: +req.params.user_id } });
            }
            catch(err) 
            {
                console.error(err);
                return res.send('This login is already exist');
            }
        }
        return res.send('Information was updated');
    }
    else 
    {
        return res.send('You have no access to update this information');
    }
});

router.delete('/api/users/:user_id', confirm_token, async (req, res) => 
{
    if(+req.params.user_id === req.user.id) 
    {
        try 
        {
            let result = await User.delete(users, { where: { id: +req.params.user_id } });
            if(result === null) {
                return res.send('Who is this?');
            }
            return res.send('User has been deleted');
        }
        catch(err) 
        {
            return res.send('Something is wrong');
        }
    }
    else 
    {
        return res.send('You have no to delete this user');
    }
});

//POSTS
router.get('/api/posts', async (req, res) => {

    let data = await User.find_all_in_db(posts);
  let options = req.query;

  if (options.sort) {
    if (options.sort === "publishDate") {
      data.sort((a, b) => {
        var bDate = new Date(b.publishDate);
        var aDate = new Date(a.publishDate);
        return bDate - aDate;
      });
    }
  } else if (options.filter) {
    delete options.filter;

    data = data.filter((user) => {
      let isValid = true;
      for (let key in options) {
        isValid = isValid && user[key] == options[key];
      }
      return isValid;
    });
  } else {
    data.sort((a, b) => {
      return b.likes - a.likes;
    });
  }

  data.filter((a) => {
    if (a.status === 1) {
      return a;
    } else if (req.user)
      if (req.user.role === "admin") {
        return a;
      }
      else if (a.author === req.user.login && a.status === 2) {
        return a;
      }
    return false;
  });

  let page_number = 1 || 1;
  let limit = 10;
  const post = data.slice((page_number - 1) * limit, page_number * limit)
  res.json(post);

});

router.get('/api/author/au_id', async(req, res) =>
{
    let autooooo  = await User.find_in_db(users, {where: {id: +req.params.au_id}});
    return res.json(autooooo);
})

router.post('/api/posts/', confirm_token, async (req, res) => {
    try {
        await User.create_smth(posts, { author: req.user.id, title: req.body.title, 
            publishDate: get_current_date(), content: req.body.content, status: 1} );
        let post = await User.find_in_db(posts, { where: { author: req.user.id, title: req.body.title } } );
        let categor = req.body.category.split(', ');
        let caaaaa;
        
        console.log(categor);
        for(let i of categor) {
        let cat = await User.find_in_db(categories, { where: {name: i}});   
        //console.log(cat);

            if(!cat){
                await User.create_smth(categories, {name: i});
                caaaaa = await User.find_in_db(categories, { where: {name: i}});
                console.log('create in !cat');
            } else if( cat.name !== i){
                await User.create_smth(categories, {name: i});
                caaaaa = await User.find_in_db(categories, { where: {name: i}});
                console.log('create in !cat.name');
            } else {
                caaaaa = cat;
            }
            
            
            // console.log(caaaaa);
            
            await User.create_smth(post_category, { init_post: post.dataValues.id, init_category: caaaaa.id });
        }
        const auto_user = await User.find_in_db(users, { where: {id: post.author}});
        return res.json(auto_user);
    }
    catch(err) {
        console.error(err);
        return res.send('Unexpected error while creating the post');
    }
    
});

router.get('/api/posts/:post_id', async (req, res) => {
    console.log()
    const result = await User.find_in_db(posts, { id: +req.params.post_id });
    if(result === null) {
        return res.send('You have not this post');
    }
    return res.json(result);
    
});

router.patch('/api/posts/:post_id', confirm_token, async (req, res) => {
    let post = await User.find_in_db(posts, { where: { id: +req.params.post_id } });

    if(post.author === req.user.id){
        try {
            await User.update_smth(posts, { title: req.body.title, content: req.body.content, status: req.body.status }, { where: { id: +req.params.post_id } });
            return res.send('Your post has been updated');
        }
        catch(err) {
            console.error(err);
            return res.send('Error while editing the post');
        }
    } else {
        return res.send('It`s not your post.')
    }
});

router.delete('/api/posts/:post_id', confirm_token, async (req, res) => {


    let post = await User.find_in_db(posts, { where: { id: +req.params.post_id } });
    if(!post){
        return res.send('You have not post with this id');
    }

    if(post.author === req.user.id){
        try {
            await User.delete(post_category, {where:  { init_post: +req.params.post_id }  });
            await User.delete(commentsLikes, {where:  { init_comment: +req.params.post_id }  });
            await User.delete(like_post, {where:  { init_post: +req.params.post_id }  });
            await User.delete(comments, {where:  { init_post: +req.params.post_id }  });
            await User.delete(posts, { where: { id: +req.params.post_id } });
            return res.send('Post has been deleted');
        }
        catch(err) {
            console.error(err);
            return res.send('Error while deleted the post');
        }
    } else {
        return res.send('Don`t even try delet this post. It`s not your!')
    }
});

router.get('/api/posts/:post_id/comments', async (req, res) => {
    const post = await User.find_in_db(posts, { where: { id: +req.params.post_id } });
    if(post === null) {
        return res.send('You have not this post, sorry :/');
    }

    const result = await User.find_all_in_db(comments, { where: { init_post: +req.params.post_id } });
    if(!result.length) {
        return res.send('Be first to comment!');
    }

    return res.json(result.map(el => el.dataValues));
});

router.post('/api/posts/:post_id/comments', confirm_token, async (req, res) => {

    const post = await User.find_in_db(posts, { where: { id: +req.params.post_id } });
    if(post === null) {
        return res.send('You have not this post, sorry :/');
    }

        try {
            await User.create_smth(comments, { author: req.user.id, 
                publishDate: get_current_date(), content: req.body.content, init_post: +req.params.post_id } );
            return res.send('Comment created');
        }
        catch(err) {
            console.error(err);
            return res.send('Error while creating the comments');
        }
});

router.get('/api/posts/:post_id/like', confirm_token, async (req, res) => {
    try {
        let result = await User.find_all_in_db(like_post, { where: { init_post: req.params.post_id } });
        return res.send(result);
    }
    catch(err) {
        console.error(err);
    }
});

router.post('/api/posts/:post_id/like', confirm_token, async (req, res) => {
    let aim = await User.find_in_db(like_post, { where: { author: req.user.id, init_post: +req.params.post_id } });
    if(aim !== null) {
        if(aim.dataValues.type === 'like' && req.body.type === 'dislike') {
            await User.update_smth(like_post, { type: 'dislike' }, { where: { author: req.user.id, init_post: +req.params.post_id } });
            const post = await User.find_in_db(posts, { where: { id: +req.params.post_id } });
            const user = await User.find_in_db(users, { where: { id: post.dataValues.author } });

            await User.update_smth(users, { rating: user.dataValues.rating - 2 }, { where: { id: post.dataValues.author } });
            return res.send('You have successfully changed like to dislike');
        }
        if(aim.dataValues.type === 'dislike' && req.body.type === 'like') {
            await User.update_smth(like_post, { type: 'like' }, { where: { author: req.user.id, init_post: +req.params.post_id } });
            const post = await User.find_in_db(posts, { where: { id: +req.params.post_id } });
            const user = await User.find_in_db(users, { where: { id: post.dataValues.author } });

            await User.update_smth(users, { rating: user.dataValues.rating + 2 }, { where: { id: post.dataValues.author } });
            return res.send('You have successfully changed dislike to like');
        }
        if(aim.dataValues.type === 'dislike' && req.body.type === 'dislike' ||
                aim.dataValues.type === 'like' && req.body.type === 'like') {
            return res.send('You have already liked/disliked this post');
        }
    }

    try {
        if(req.body.type === 'like') {
            await User.create_smth(like_post, { author: req.user.id, init_post: +req.params.post_id, publishDate: get_current_date(), type: 'like' } );

            const post = await User.find_in_db(posts, { where: { id: +req.params.post_id } });
            const user = await User.find_in_db(users, { where: { id: post.dataValues.author } });

            await User.update_smth(users, { rating: user.dataValues.rating + 1 }, { where: { id: post.dataValues.author } });
            return res.send('Like was added');
        }
        if(req.body.type === 'dislike') {
            await User.create_smth(like_post, { author: req.user.id, init_post: +req.params.post_id, publishDate: get_current_date(), type: 'dislike' } );

            const post = await User.find_in_db(posts, { where: { id: +req.params.post_id } });
            const user = await User.find_in_db(users, { where: { id: post.dataValues.author } });

            await User.update_smth(users, { rating: user.dataValues.rating - 1 }, { where: { id: post.dataValues.author } });
            return res.send('Dislike was added');
        }
    }
    catch(err) {
        console.error(err);
        return res.send('Error while adding like to this post');
    }
    
    return res.send('Please provide like/dislike in JSON');
});

router.delete('/api/posts/:post_id/like', confirm_token, async (req, res) => {
    let like = await User.find_in_db(like_post, { where: {init_post: +req.params.post_id } });
    if(!like){
        return res.send('You have not post with this id');
    }

    if(like.author === req.user.id){
        try{
            if(like.dataValues.type === 'like') {
                await User.delete(like_post, { where: { init_post: +req.params.post_id, author: req.user.id } });
    
                const post = await User.find_in_db(posts, { where: { id: +req.params.post_id } });
                const user = await User.find_in_db(users, { where: { id: post.dataValues.author } });
        
                await User.update_smth(users, { rating: user.dataValues.rating - 1 }, { where: { id: post.dataValues.author } });
                return res.send('You have deleted the like');
            }
            if(like.dataValues.type === 'dislike') {
                await User.delete(like_post, { where: { init_post: +req.params.post_id, author: req.user.id } });
    
                const post = await User.find_in_db(posts, { where: { id: +req.params.post_id } });
                const user = await User.find_in_db(users, { where: { id: post.dataValues.author } });
        
                await User.update_smth(users, { rating: user.dataValues.rating + 1 }, { where: { id: post.dataValues.author } });
                return res.send('You have deleted the dislike');
            }
        }
        catch(err) {
            console.error(err);
            return res.send('Unexpected error while deleting the comment like or dislike');
        }
    } else {
        return res.send('You have not liked this post');
    }
});

router.get('/api/posts/:post_id/categories', confirm_token, async (req, res) => {

    try {
        let post = await User.find_all_in_db(post_category, { where: { init_post: +req.params.post_id }});
        let result = await User.find_all_in_db(categories, { where: { id: post.map(el => el.dataValues.init_category) } });
        return res.json(result.map(el => el.name));
    }
    catch(err) {
        console.error(err);
        return res.send('Something error while loading post categories');
    }
});

//CATEGORIES
router.get('/api/categories/:category_id/posts', confirm_token, async (req, res) => {
    try {
        let result = await User.find_all_in_db(post_category, { where: { init_category: +req.params.category_id }});
        console.log(result);
        if(!result.length) {
            return res.send('Post has not been found');
        }
        result = await User.find_all_in_db(posts, { where: { id: result.map(el => el.init_post) } });
        return res.json(result);
    }
    catch(err) {
        console.error(err);
        return res.send('Something is wrong');
    }
});

router.get('/api/categories', confirm_token, async (req, res) =>{
    try {
        const result = await User.find_all_in_db(categories);
        return res.json(result.map(el => el.dataValues));
    }
    catch(err) {
        console.error(err);
        return res.send('Something is wrong');
    }
});

router.get('/api/categories/:category_id', confirm_token, async (req, res) => {
    try {
        const result = await User.find_in_db(categories, { where: { id: +req.params.category_id } });
        if(result === null) {
            return res.send('Such category has not been found');
        }
        return res.json(result);
    }
    catch(err) {
        console.error(err);
        return res.send('Something is wrong');
    }
});

router.post('/api/categories', confirm_token, (req, res) => {
        try {
            User.create_smth(categories, { name: req.body.name});
            return res.send('Category has been created');
        }
        catch(err) {
            console.error(err);
            return res.send('Something is wrong');
        }
});

router.patch('/api/categories/:category_id', confirm_token, checkAdmin, async (req, res) => {
        try {
            await User.update_smth(categories, { name: req.body.name }, { where: { id: +req.params.category_id } });
            return res.send('Category has been updated');
        }
        catch(err) {
            console.error(err);
            return req.send('Something is wrong');
        }
});

router.delete('/api/categories/:category_id', confirm_token, checkAdmin, async (req, res) => {
        try {
            await User.delete(categories, { where: { id: +req.params.category_id } });
            return res.send('Category has been deleted');
        }
        catch(err) {
            console.error(err);
            return res.send('Something is wrong');
        }
});

//COMMENTS
router.get('/api/comments/:comment_id', confirm_token, async (req, res) => {
    try {
        const result = await User.find_in_db(comments, { where: { id: +req.params.comment_id } });
        if(result === null) {
            return res.send('No comment');
        }
        return res.json(result);
    }
    catch(err) {
        console.error(err);
        return res.send('Something is wrong');
    }
});

router.get('/api/comments/:comment_id/like', confirm_token, async (req, res) => {
    try {
        const result = await User.find_all_in_db(commentsLikes, { where: { init_comment: +req.params.comment_id } });
        console.log(result);
        if(result === null) {
            return res.send('No likes under this comment');
        }
        return res.json(result.map(el => el.dataValues));
        //return res.json(result);
    }
    catch(err) {
        console.error(err);
        return res.send('Something is wrong');
    }
});

router.post('/api/comments/:comment_id/like', confirm_token, async (req, res) => {
    let aim = await User.find_in_db(commentsLikes, { where: { author: req.user.id, id: +req.params.comment_id } });
    console.log(aim);
    if(aim !== null) {
        if(aim.dataValues.type === 'like' && req.body.type === 'dislike') {
            await  User.update_smth(commentsLikes, { type: 'dislike' }, { where: { author: req.user.id, id: +req.params.comment_id } });
            let comment =  await  User.find_in_db(comments, { where: { id: +req.params.comment_id } });
            let user =  await  User.find_in_db(users, { where: { id: comment.dataValues.author}});

            await  User.update_smth(users, { rating: user.dataValues.rating - 2 }, { where: { id: user.dataValues.id } });

            return res.send('You have changed like to dislike');
        }
        if(aim.dataValues.type === 'dislike' && req.body.type === 'like') {
            await  User.update_smth(commentsLikes, { type: 'like' }, { where: { author: req.user.id, id: +req.params.comment_id } });
            let comment =  await  User.find_in_db(comments, { where: { id: +req.params.comment_id } });
            let user =  await  User.find_in_db(users, { where: { id: comment.dataValues.author}});

            await  User.update_smth(users, { rating: user.dataValues.rating + 2 }, { where: { id: user.dataValues.id } });

            return res.send('You have changed dislike to like');
        }
        if(aim.dataValues.type === 'dislike' && req.body.type === 'dislike' ||
                aim.dataValues.type === 'like' && req.body.type === 'like') {
            return res.send('You have already liked/disliked this post');
        }
    }

    try {
        if(req.body.type === 'like') {
            await  User.create_smth(commentsLikes, { author: req.user.id,
                init_comment: +req.params.comment_id, publishDate: get_current_date(), type: 'like' });
    
            let comment =  await  User.find_in_db(comments, { where: { id: +req.params.comment_id } });
            let user =  await  User.find_in_db(users, { where: { id: comment.dataValues.author}});
            await  User.update_smth(users, { rating: user.dataValues.rating + 1 }, { where: { id: user.dataValues.id } });
    
            return res.send('Like was added');
        }
        if(req.body.type === 'dislike') {
            await  User.create_smth(commentsLikes, { author: req.user.id,
                init_comment: +req.params.comment_id, publishDate:  get_current_date(), type: 'dislike' });
    
            let comment =  await  User.find_in_db(comments, { where: { id: +req.params.comment_id } });
            let user =  await  User.find_in_db(users, { where: { id: comment.dataValues.author}});
            await  User.update_smth(users, { rating: user.dataValues.rating - 1 }, { where: { id: user.dataValues.id } });
    
            return res.send('Dislike was added');
        }
    }
    catch(err) {
        console.error(err);
        return res.send('Something is wrong');
    }

    return res.send('Please provide like/dislike in JSON');
});

router.patch('/api/comments/:comment_id', confirm_token, async (req, res) => {
    let aim = await User.find_in_db(comments, { where: { id: +req.params.comment_id, author: req.user.id } });
    if(aim !== null || checkAdmin(req.user.role)) {
        try {
            await User.update_smth(comments, { content: req.body.content }, { where: { id: +req.params.comment_id }});
            return res.send('Comment has been updated');
        }
        catch(err) {
            console.error(err);
            return res.send('Something is wrong');
        }
    }
    else {
        return res.send('You have no permissions to edit it');
    }
});

router.delete('/api/comments/:comment_id', confirm_token, async (req, res) => {
    let comment = await User.find_in_db(comments, { where: { id: +req.params.comment_id} });
    if(!comment){
        return res.send('You have not comment with this id');
    }

    if(comment.author === req.user.id){
        try {
            await User.delete(commentsLikes, { where: { author: req.user.id, init_comment: +req.params.comment_id } });
            await User.delete(comments, { where: { author: req.user.id, id: +req.params.comment_id } });
            return res.send('Comment has been deleted');
        }
        catch(err) {
            console.error(err);
            return res.send('Something is wrong');
        }
    }
    else {
        return res.send('You cant delete this comment, not your.');
    }
});

router.delete('/api/comments/:comment_id/like', confirm_token, async (req, res) => {
    let like_comm = await User.find_in_db(commentsLikes, { where: { id: +req.params.comment_id} });
    if(!like_comm){
        return res.send('No like on that comment');
    }

    if(like_comm.author === req.user.id){
        try {
            if(like_comm.dataValues.type === 'like') {
                await User.delete(commentsLikes, { where: { id: +req.params.comment_id, author: req.user.id } });

                let comment = await User.find_in_db(comments, { where: { id: +req.params.comment_id } });
                let user = await User.find_in_db(users, { where: { id: comment.dataValues.author}});
                const { rating } = user.dataValues;
                await User.update_smth(users, { rating: rating - 1 }, { where: { id: user.dataValues.id } });

                return res.send('Like has been deleted');
            }
            if(like_comm.dataValues.type === 'dislike') {
                await User.delete(commentsLikes, { where: { id: +req.params.comment_id, author: req.user.id } });

                let comment = await User.find_in_db(comments, { where: { id: +req.params.comment_id } });
                let user = await User.find_in_db(users, { where: { id: comment.dataValues.author}});
                const { rating } = user.dataValues;
                await User.update_smth(users, { rating: rating + 1 }, { where: { id: user.dataValues.id } });

                return res.send('Dislike has been deleted');
            }
        }
        catch(err) {
            console.error(err);
            return res.send('Something is wrong');
        }
    }
    else {
        return res.send('You can`t. Not your like');
    }
});

export  {router};



