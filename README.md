# IoT FSM Controller Dashboard

A real-time dashboard for monitoring and controlling IoT nodes using a Finite State Machine (FSM) approach. This specific implementation visualizes sensor data (PM2.5, PM10, Temperature, Humidity), battery status, and device states (Wake, Sleep, Transmit, Error) sent via MQTT.

## Features

- **Real-Time Visualization**:  View live data from IoT sensors via MQTT.
- **State Monitoring**: Track the current FSM state of the device.
- **Interactive Control**: Send commands to the device directly from the dashboard.
- **Microgreens Integration**: Digital twin simulation of indoor air purification using various plant types (VOC/AQI reduction).
- **Event Logging**: Log critical device events and errors.
- **Responsive Design**: Built with Next.js and Tailwind CSS for a seamless experience on all devices.
- **Firebase Integration**: Hosted on Firebase with Firestore integration for persistent data (planned/implemented).

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **State Management**: React Hooks, FSM Logic
- **Communication**: MQTT over WebSockets
- **Deployment**: Firebase Hosting

## Getting Started

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/shivarajm8234/FSM-controller.git
    cd FSM-controller
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    # or
    pnpm install
    ```

3.  **Run the development server**:
    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Configuration

Ensure your MQTT broker details are correctly configured in `lib/mqtt-client.ts`.

## License

MIT
