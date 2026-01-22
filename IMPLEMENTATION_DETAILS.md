# FSM IoT Controller - System Implementation Documentation

## 1. 🧠 Finite State Machine (FSM) Logic
The core of the application is a Finite State Machine managed by the `useFSMController` hook.

### States
- **BOOT**: System initialization. Power: 10%.
- **SELF_TEST**: Hardware diagnostics. Power: 8%.
- **SLEEP**: Low power mode. Adapts duration based on Battery (<20%) and AQI (>35). Power: 0.1%.
- **WAKE**: System activation. Power: 5%.
- **SENSE**: Active sensor data acquisition. Power: 15%.
- **PROCESS**: Data validation and analysis. Power: 20%.
- **TRANSMIT**: RF/MQTT transmission. Power: 50%.
- **ERROR**: Fault/Recovery mode. Power: 2%.
- **REPAIR**: Maintenance/Self-healing. Power: 3%.

### Valid Transitions
Defined in `VALID_TRANSITIONS` constant:
- `BOOT -> SELF_TEST` or `ERROR`
- `SELF_TEST -> SLEEP` or `ERROR`
- `SLEEP -> WAKE` or `ERROR`
- `WAKE -> SENSE` or `ERROR`
- `SENSE -> PROCESS` or `ERROR`
- `PROCESS -> TRANSMIT` or `ERROR`
- `TRANSMIT -> SLEEP` or `ERROR`
- `ERROR -> REPAIR`
- `REPAIR -> SLEEP`

---

## 2. 📡 Real Hardware Sensor Integration
We integrate real-time data from **Sensor.community**'s open data API.
- **Primary Sensor**: ID `71641` (SPS30 Particulate Matter Sensor) located in **Prague, CZ**.
- **Data Fetched**:
  - PM10, PM2.5, PM1, PM4
  - Number concentrations (N0.5, N1, N2.5, N4, N10)
  - Temperature, Humidity, Pressure
- **Timeout Handling**: Fetch requests timeout after 10 seconds to handle network latency gracefully.
- **Discovery**: Sensor discovery runs on `BOOT` and `SENSE` states to ensure visibility in both Manual and Auto modes.

### Reverse Geocoding
- Uses **Nominatim (OpenStreetMap)** to convert sensor latitude/longitude into a human-readable address (City/Town).
- Results are cached to minimize API calls.

---

## 3. 🌫️ AQI Calculation (US EPA Standard)
We implemented the precise **US EPA** linear interpolation formula for PM2.5 AQI.

**Formula**:
```math
I = \frac{I_{hi} - I_{lo}}{C_{hi} - C_{lo}} \times (C - C_{lo}) + I_{lo}
```
Where $C$ is the concentration, and breakpoints are defined as:
- **0 - 12.0**: Good (0-50)
- **12.1 - 35.4**: Moderate (51-100)
- **35.5 - 55.4**: Unhealthy for Sensitive Groups (101-150)
- **55.5 - 150.4**: Unhealthy (151-200)
- **150.5 - 250.4**: Very Unhealthy (201-300)
- **250.5+**: Hazardous (301-500)

---

## 4. 📶 MQTT Telemetry & Transmission
Data is pushed to a **HiveMQ Serverless Broker** via WebSockets (`wss`).

### Payload Structure
**Topic**: `adld/sensor/pollution_data`

**Success Payload (State: TRANSMIT)**:
```json
{
  "battery": 95.5,
  "timestamp": 1737562000123,
  "pm25": 34.1,
  "pm10": 34.4,
  "temperature": -1.9,
  "humidity": 66.6,
  "aqi": 97,
  "aqiStatus": "Moderate",
  "fsmState": "TRANSMIT",
  "systemStatus": "ONLINE",
  "source": "Sensor.community (Open Source)",
  "type": "Air Pollution Monitor"
}
```

**Fault Payload (State: ERROR)**:
```json
{
  "fsmState": "ERROR",
  "systemStatus": "FAULT",
  "errorMessage": "Manual fault triggered via control panel",
  ...sensorData
}
```

---

## 5. 🕹️ Manual Control & Fault Injection
- **Manual Mode**: User can step through states manually using the Control Panel.
- **Force Fault**: A specific "FORCE SYSTEM FAULT" button allows users to inject an error from any active state, testing the System's error handling and MQTT error reporting capabilities.

## 6. ⚡ Power Simulation
- Battery drain is simulated based on the power consumption of the current state.
- **Deep Sleep Optimization**: Sleep interval dynamically doubles if battery < 20% to conserve energy.

---

## 7. 🛠️ System Operation Modes (Ways of Working)

The project handles two distinct operational workflows:

### A. 🤖 Autonomous Mode (Auto)
This is the standard operating mode for an IoT node.
1.  **Cycle**: The system automatically transitions through `BOOT -> SELF_TEST -> SLEEP -> WAKE -> SENSE -> PROCESS -> TRANSMIT -> SLEEP`.
2.  **Smart Adaptation**:
    *   **Low Battery (<10%)**: Skips `TRANSMIT` state to save power.
    *   **Low Battery (<20%)**: Extends `SLEEP` duration.
    *   **Poor Air Quality**: Reduces `SLEEP` duration to sample more frequently.
3.  **Self-healing**: If an error occurs, the system automatically enters `REPAIR` and then returns to `SLEEP`.

### B. 🕹️ Manual Control Mode
Designed for maintenance, debugging, and demonstration.
1.  **User Control**: The automatic timer is disabled. The user acts as the clock signal, clicking buttons to transition between valid states.
2.  **Visualization**: Allows users to inspect sensor data and power consumption at each specific step of the cycle without time pressure.
3.  **Override**: Users can force a system reset or inject faults at will.

---

## 8. ⚠️ Error Scenarios (Ways of Entering ERROR State)

The FSM is designed to be robust and handle various failure modes. The system enters the **ERROR** state in the following ways:

### 1. 🎲 Simulated Random Faults
*   **Probability**: 5% chance.
*   **Trigger States**: `PROCESS` state.
*   **Mechanism**: A random number generator simulates hardware glitches or bit flips during data processing.

### 2. 📡 MQTT Transmission Failure
*   **Trigger State**: `TRANSMIT`.
*   **Mechanism**: If the MQTT broker is unreachable or the connection drops during dispatch, the system catches the error and transitions to `ERROR` instead of `SLEEP`.
*   **Reporting**: The error context ("MQTT transmission failed") is saved to the event log.

### 3. 🚦 Self-Test Failure
*   **Probability**: 10% chance.
*   **Trigger State**: `SELF_TEST`.
*   **Mechanism**: Simulates a startup hardware check failure (e.g., sensor disconnected, memory error).

### 4. 🛑 Manual Fault Injection
*   **Method**: Clicking the "FORCE SYSTEM FAULT" button in the Control Panel (Manual Mode).
*   **Purpose**: Validates the system's ability to capture errors and publish "FAULT" status telemetry to the MQTT broker.

### 5. 📉 Critical Battery (Concept)
*   *Note*: Currently, low battery triggers aggressive power saving (Skipping TX), but in a real-world scenario, dropping below a critical voltage (e.g., 0%) would force a shutdown or error state until recharged.
