// Simple MQTT test script
// Run this with: node test-mqtt.js

const mqtt = require('mqtt')

const brokerUrl = "wss://broker.hivemq.com:8884/mqtt"
const topic = "adld/test/connection"

console.log("Testing MQTT connection to:", brokerUrl)

const client = mqtt.connect(brokerUrl, {
  keepalive: 60,
  clientId: `test_client_${Math.random().toString(16).substring(2, 8)}`,
  protocolId: "MQTT",
  protocolVersion: 4,
  clean: true,
  reconnectPeriod: 1000,
  connectTimeout: 30 * 1000,
})

client.on('connect', () => {
  console.log('✅ MQTT Client Connected')
  
  // Test message
  const testMessage = {
    timestamp: new Date().toISOString(),
    message: "Test message from FSM Controller",
    test: true
  }
  
  client.publish(topic, JSON.stringify(testMessage), { qos: 0 }, (error) => {
    if (error) {
      console.error('❌ Publish error:', error)
    } else {
      console.log('✅ Test message published successfully')
      console.log('   Topic:', topic)
      console.log('   Message:', JSON.stringify(testMessage, null, 2))
    }
    
    // Disconnect after test
    setTimeout(() => {
      client.end()
      console.log('🔌 MQTT Client disconnected')
      process.exit(0)
    }, 1000)
  })
})

client.on('error', (err) => {
  console.error('❌ MQTT Connection Error:', err.message)
  process.exit(1)
})

client.on('offline', () => {
  console.log('⚠️  MQTT Client Offline')
})

// Timeout after 10 seconds
setTimeout(() => {
  console.error('❌ Connection timeout')
  client.end()
  process.exit(1)
}, 10000)
