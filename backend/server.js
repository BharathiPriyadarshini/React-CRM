// BACKEND STARTER CODE (server.js)
import express from 'express';
import cors from 'cors';
/*import bcrypt from 'bcryptjs';*/
import jwt from 'jsonwebtoken';

/*const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');*/

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET='secret_key';


// In-memory database (for simplicity)
let users = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'user' }
];

let nextId = 3;

const validateEmail = (email) => {
    return String(email)
        .toLowerCase()
        .match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
};

const authenticate =(req,res,next)=>{
    const authHeader= req.headers.authorization;
    
    if(!authHeader){
        return res.status(401).json({message: 'Access denied. Token required'});
    
    }
    const token= authHeader.split(' ')[1];
    try{
        const decoded = jwt.verify(token,JWT_SECRET);
        req.user=decoded;
        next();
    } catch(err){
        return res.status(401).json({message:' Invalid or exprired token'});
    }
};
const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Admin access only",
    });
  }
  next();
};


// TODO: Implement these endpoints
// POST /api/login
app.post('/api/login', (req, res) => {
    // Candidate should implement authentication logic
    let { email,password }=req.body;
    if (!email || !password){
        return res.status(400).json({message: 'Email and password required'});
    }
    email= email.trim().toLowerCase();
    const user=users.find(u => u.email === email);

    if(!user || password !== 'password'){
        return res.status(401).json({message: ' Invalid email or password'});
    }
    
    const token= jwt.sign(
        { id: user.id , email: user.email,role: user.role},
        JWT_SECRET,
        {expiresIn: '2h'}
    );
    res.json({
        token,
        user: {
            name: user.name,
            email: user.email,
            role: user.role 
        }
    });
});


// GET /api/users
app.get('/api/users', authenticate,(req, res) => {
    // Candidate should implement user listing with auth check
    res.json(users);
});

// POST /api/users
app.post('/api/users', authenticate, authorizeAdmin,  (req, res) => {
    // Candidate should implement user creation with validation
    const {name, email, role}=req.body;
    if (!name || !email || !role){
        return res.status(400).json({message:'All fields are rquired'});
    }

    if(!validateEmail(email)){
        return res.status(400).json({message: ' Invalid email Format'});

    }
    if(users.some(u => u.email === email)){
        return res.status(400).json({message: ' A user with this email already exists'});
    }
    const newUser = {
        id: nextId++,
        name,
        email,
        role
    };

    users.push(newUser);
    res.status(201).json(newUser);
});

// PUT /api/users/:id
app.put('/api/users/:id', authenticate,authorizeAdmin,  (req, res) => {
    // Candidate should implement user update
    const id= parseInt(req.params.id);
    const userIndex =users.findIndex(u => u.id === id );

    if(userIndex=== -1){
        return res.status(404).json({message: 'User not found'});
    }

    const { name, email,role}=req.body;

    if(email && email!== users[userIndex].email){
        if(!validateEmail(email)){
            return res.status(400).json({message: ' Invalid emial format'}); 
        }
        if (users.some(u => u.email === email)){
            return res.status(400).json({message:' Email already in use'});
        }
    }
    users[userIndex]={
        ...users[userIndex],
        name: name || users[userIndex].name,
        email: email || users[userIndex].email,
        role: role || users[userIndex].role
    };
    res.json(users[userIndex]);

});

// DELETE /api/users/:id
app.delete('/api/users/:id', authenticate,authorizeAdmin, (req, res) => {
    // Candidate should implement user deletion
    const id = parseInt(req.params.id);
    const initialLenghth = users.length;

    users =users.filter(u => u.id !== id);

    if (users.length === initialLenghth){
        return res.status(404).json({message : ' User not found'});
    }
    
    res.json({message: 'User deleted successfully'});

});
//global error handler
app.use((err, req, res, next)=>{
    console.error(err.stack);
    res.status(500).json({message:' Something went wrong on the server'});
});
app.listen(3001, () => {
    console.log('Server running on http://localhost:3001');
});



