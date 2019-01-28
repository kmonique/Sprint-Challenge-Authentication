const axios = require('axios');

//req.body kept sending back a blank object (added these lines to make it work correctly)
const knex = require("knex");
const knexConfig = require("../knexfile");
const bcrypt = require("bcryptjs");
const express = require("express");
const jwt = require("jsonwebtoken");
const db = knex(knexConfig.development);
const server = express();
server.use(express.json());
const secret = process.env.JWT_SECRET ||
'add a .env file to root of project with the JWT_SECRET variable';
//end of added lines

const { authenticate } = require('../auth/authenticate');

module.exports = server => {
  server.post('/api/register', register);
  server.post('/api/login', login);
  server.get('/api/jokes', authenticate, getJokes);
};

//generates jwt
function generateToken(user) {
  const payload = {
     jwtid: user.id,
     username: user.username
  }
  const options = {
     expiresIn: "1hr",
  }
  return jwt.sign(payload, secret, options)
}

function register(req, res) {
  // implement user registration
  const user = req.body;
  if(user.username && user.password) {
    user.password = bcrypt.hashSync(user.password, 10);
    db("users").insert(user)
      .then(ids => {
        const id = ids[0];
        console.log(id)
        db("users").where("id", id).then(user => {
          console.log("user", user.length)
          if(user) {
            console.log(user[0])
            const token = generateToken(user[0])
            console.log(token)
            res.status(201).json({id: ids[0], token})
          } else {
            res.status(400).json({err: "User not found"})
          }
        })
      }).catch(err => res.status(500).send("Unable to add user"));
  } else{
    res.status(400).send("Please provide username and password")
  }
}

function login(req, res) {
  // implement user login
}

function getJokes(req, res) {
  const requestOptions = {
    headers: { accept: 'application/json' },
  };

  axios
    .get('https://icanhazdadjoke.com/search', requestOptions)
    .then(response => {
      res.status(200).json(response.data.results);
    })
    .catch(err => {
      res.status(500).json({ message: 'Error Fetching Jokes', error: err });
    });
}