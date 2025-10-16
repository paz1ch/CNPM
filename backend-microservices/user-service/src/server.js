require('dotenv').config()
const mongoose = require('mongoose')
const logger = require('./utils/logger')
const express = require('express')
const helmet = require('helmet')
const cors = require('cors')

const app = express()


//ket noi db
mongoose.connect(process.env.MONGO_URI).then(()=> 
logger.info('Ket noi db thanh cong')).catch(e=>
logger.error("Ket noi db that bai", e))

//middleware
app.use(helmet())
app.use(cors())
app.use(express.json())

app.use((req,res,next)=>{
    logger.info(`Received ${req.method} request to ${req.url}`);
    logger.info(`Request body, ${req.body}`);
    next();
})