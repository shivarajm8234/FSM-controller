import mqtt from "mqtt"

// Singleton MQTT client
// Use inferred type to avoid import issues
type MqttClientType = ReturnType<typeof mqtt.connect>
let client: MqttClientType | null = null
let connectionPromise: Promise<boolean> | null = null

export const getMQTTClient = () => {
  if (client) return client

  // Connect to the public test broker via WebSockets
  // Try multiple brokers for better reliability
  // Connect to the HiveMQ Serverless Cluster
  const brokers = [
    "wss://58071564a2bd44eeacfb16945302d2d6.s1.eu.hivemq.cloud:8884/mqtt"
  ]
  
  let currentBrokerIndex = 0
  
  const connectToBroker = (brokerUrl: string): Promise<boolean> => {
    return new Promise((resolve) => {
      console.log(`Attempting to connect to HiveMQ Cloud: ${brokerUrl}`)
      
      // NOTE: HiveMQ Cloud requires valid Credentials!
      // Please replace 'hivemq.webclient' and 'password' with your actual cluster credentials
      client = mqtt.connect(brokerUrl, {
        keepalive: 60,
        clientId: `adld_client_${Math.random().toString(16).substring(2, 8)}`,
        protocolId: "MQTT",
        protocolVersion: 4,
        clean: true,
        reconnectPeriod: 2000,
        connectTimeout: 10 * 1000,
        username: "hivemq.webclient.1769097771472", 
        password: "VUBDafdSC19ecg28%*!$",
      })

      const timeout = setTimeout(() => {
        console.error(`Connection timeout for ${brokerUrl}`)
        if (client) {
          client.end()
          client = null
        }
        resolve(false)
      }, 10000)

      client.on("connect", () => {
        clearTimeout(timeout)
        console.log(`✅ MQTT Client Connected to ${brokerUrl}`)
        resolve(true)
      })

      client.on("error", (err: Error) => {
        clearTimeout(timeout)
        console.error(`❌ MQTT Connection Error for ${brokerUrl}:`, err.message)
        if (client) {
          client.end()
          client = null
        }
        resolve(false)
      })

      client.on("offline", () => {
        console.log("⚠️ MQTT Client Offline")
      })
    })
  }

  const tryConnect = async (): Promise<boolean> => {
    if (connectionPromise) return connectionPromise

    connectionPromise = (async () => {
      for (let i = 0; i < brokers.length; i++) {
        const connected = await connectToBroker(brokers[i])
        if (connected) {
          return true
        }
        console.log(`Failed to connect to ${brokers[i]}, trying next broker...`)
      }
      
      console.error("❌ All MQTT brokers failed")
      return false
    })()

    return connectionPromise
  }

  // Start connection attempts
  tryConnect()
  
  return client
}

export const publishData = async (topic: string, message: any): Promise<boolean> => {
  const mqttClient = getMQTTClient()
  
  // Wait for connection to be established
  const isConnected = await new Promise<boolean>((resolve) => {
    if (mqttClient?.connected) {
      resolve(true)
      return
    }

    let attempts = 0
    const maxAttempts = 20 // 20 * 500ms = 10 seconds
    
    const checkConnection = () => {
      attempts++
      if (mqttClient?.connected) {
        resolve(true)
      } else if (attempts < maxAttempts) {
        setTimeout(checkConnection, 500)
      } else {
        console.error("MQTT client failed to connect within timeout. Cannot publish.")
        resolve(false)
      }
    }
    
    setTimeout(checkConnection, 100)
  })

  if (!isConnected || !mqttClient) {
    console.warn("❌ MQTT client not connected. Cannot publish.")
    return false
  }

  return new Promise((resolve) => {
    const payload = JSON.stringify(message)
    mqttClient.publish(topic, payload, { qos: 0 }, (error: Error | undefined) => {
      if (error) {
        console.error("❌ Publish error:", error)
        resolve(false)
      } else {
        console.log(`✅ Published to ${topic}:`, payload)
        resolve(true)
      }
    })
  })
}
