import mqtt from "mqtt"

// Singleton MQTT client
// Use inferred type to avoid import issues
type MqttClientType = ReturnType<typeof mqtt.connect>
let client: MqttClientType | null = null

export const getMQTTClient = () => {
  if (client) return client

  // Connect to the public test broker via WebSockets
  // Switching to HiveMQ Public Broker as Mosquitto can be flaky
  // wss://broker.hivemq.com:8884/mqtt
  const brokerUrl = "wss://broker.hivemq.com:8884/mqtt"
  
  console.log("Connecting to MQTT broker:", brokerUrl)
  
  client = mqtt.connect(brokerUrl, {
    keepalive: 60,
    clientId: `adld_client_${Math.random().toString(16).substring(2, 8)}`,
    protocolId: "MQTT",
    protocolVersion: 4,
    clean: true,
    reconnectPeriod: 1000,
    connectTimeout: 30 * 1000,
  })

  client.on("connect", () => {
    console.log("MQTT Client Connected")
  })

  client.on("error", (err: Error) => {
    console.error("MQTT Connection Error:", err)
  })

  client.on("offline", () => {
    console.log("MQTT Client Offline")
  })

  return client
}

export const publishData = (topic: string, message: any) => {
  const mqttClient = getMQTTClient()
  
  if (mqttClient.connected) {
    const payload = JSON.stringify(message)
    mqttClient.publish(topic, payload, { qos: 0 }, (error: Error | undefined) => {
      if (error) {
        console.error("Publish error:", error)
      } else {
        console.log(`Published to ${topic}:`, payload)
      }
    })
    return true
  } else {
    console.warn("MQTT client not connected. Cannot publish.")
    return false
  }
}
