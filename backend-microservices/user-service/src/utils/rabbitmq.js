const amqp = require('amqplib');
const logger = require('./logger');

let connection = null;
let channel = null;

const EXCHANGE_NAME = 'user-exchange';

async function connectToRabbitMQ(){
    try{
        connection = await amqp.connect(process.env.RABBITMQ_URL);
        channel = await connection.createChannel();

        await channel.assertExchange(EXCHANGE_NAME, "direct", {durable: false });
        logger.info("Connected to RabbitMQ");
        return channel;
    }catch(e){
        logger.error('Error connecting to rabbitmq', e);
    }
}

module.exports = { connectToRabbitMQ };