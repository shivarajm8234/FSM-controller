const mqtt = require('mqtt');

// Connect to HiveMQ Public Broker
// TCP port 1883 is standard for Node/non-browser clients
const client = mqtt.connect('mqtt://broker.hivemq.com:1883');

const TOPIC = 'adld/sensor/data';

console.log('Connecting to HiveMQ broker...');

client.on('connect', () => {
    console.log('Connected! Subscribing to topic:', TOPIC);
    client.subscribe(TOPIC, (err) => {
        if (!err) {
            console.log('Subscribed successfully. Waiting for messages...');
            console.log('(Make sure your app is running and enters the TRANSMIT state)');
        } else {
            console.error('Subscription error:', err);
        }
    });
});

client.on('message', (topic, message) => {
    console.log(`\n[${new Date().toLocaleTimeString()}] Received message on ${topic}:`);
    console.log(message.toString());
});

client.on('error', (err) => {
    console.error('Connection error:', err);
});
