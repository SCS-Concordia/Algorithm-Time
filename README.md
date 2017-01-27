# Algorithm time [![Build Status](https://travis-ci.org/SCS-Concordia/Algorithm-Time.svg?branch=master)](https://travis-ci.org/SCS-Concordia/Algorithm-Time)

## Docker container
```
docker run -p 3000:3000 --name algorithm-time -dt amirbawab/algorithm-time:latest
```

## Install

`npm install`

## Requirements
 - **mongo --version** `MongoDB shell version: 3.2.8`

## Scripts

 - **npm run start** : `node ./bin/www`
 - **npm run startdev** : `nodemon ./bin/www`
 - **npm run readme** : `node ./node_modules/.bin/node-readme`
 - **npm run sass** : `node-sass -w public/sass/ -o public/css/`

## For developers

 - Install (check above)
 - Run: `npm run startdev` to automatically restart the server on any change
 - Run: `npm run sass` to generate (and watch) new scss content. 
 - **Note:** CSS files are generated automatically, therefore any direct changes to those files will be removed by the compiler.
