# FSM-Based Smart Sensor Control System

## Overview

The FSM Controller is an Industrial IoT Platform that demonstrates a sophisticated Finite State Machine (FSM) architecture for smart sensor management and energy optimization. The system simulates a real-world industrial sensor node that autonomously manages its operational states based on sensor inputs, power constraints, and system health monitoring.

## System Architecture

### Core Components

1. **Finite State Machine Engine**
   - Nine distinct operational states representing the complete lifecycle of an industrial sensor node
   - Deterministic state transitions with built-in fault tolerance and recovery mechanisms
   - Real-time state visualization with interactive topology diagram

2. **Sensor Data Acquisition**
   - Real-time integration with external sensor networks (Sensor.community API)
   - Monitors temperature, humidity, PM10, and PM2.5 particulate matter
   - Battery level tracking with charging/discharging simulation

3. **Energy Management System**
   - Power consumption monitoring for each operational state
   - Dynamic power profiling with historical tracking
   - Energy-saving algorithms through intelligent state scheduling

4. **Data Communication**
   - MQTT-based telemetry transmission
   - Automated data publishing during transmission states
   - Network health monitoring and retry mechanisms
   
5. **Microgreens Air Quality Module**
   - **Digital Twin Simulation**: Models indoor air purification based on active plant life.
   - **VOC & AQI Reduction**: Calculates pollutant removal based on specific crop properties (e.g., Radish, Sunflower).
   - **Predictive Analytics**: Forecasts 5-day air quality trends based on current growth cycles.
   - **Interactive Garden**: Allows users to manage a virtual garden and see real-time impact on indoor air.

## State Machine Design

### Operational States

#### **Initialization States**
- **BOOT**: System startup and hardware initialization (10mW)
- **SELF_TEST**: Comprehensive diagnostics and health verification (8mW)

#### **Operational States**
- **SLEEP**: Ultra-low power standby mode for energy conservation (0.1mW)
- **WAKE**: System activation and preparation for sensing (5mW)
- **SENSE**: Active environmental data acquisition (15mW)
- **PROCESS**: Data validation, filtering, and preparation (20mW)
- **TRANSMIT**: RF communication and data publishing (50mW)

#### **Recovery States**
- **ERROR**: Fault detection and isolation (2mW)
- **REPAIR**: System recovery and maintenance procedures (3mW)

### State Transition Logic

The FSM follows a deterministic flow designed for industrial reliability:

```
BOOT → SELF_TEST → SLEEP → WAKE → SENSE → PROCESS → TRANSMIT → SLEEP
                ↓             ↓        ↓         ↓
              ERROR ←───────┘        │         │
                ↓                  │         │
              REPAIR ←─────────────┘         │
                ↓                            │
                └────────────────────────────┘
```

**Key Transition Rules:**
- BOOT always transitions to SELF_TEST for system validation
- SELF_TEST succeeds 90% of the time, fails 10% (simulating hardware issues)
- SLEEP mode triggers on timers or external interrupts
- PROCESS and TRANSMIT have random failure probabilities (5% and 15% respectively)
- All failures route through ERROR → REPAIR before returning to SLEEP
- TRANSMIT has both success (85%) and failure (15%) paths

## Energy Management Features

### Power Profiling
Each state maintains precise power consumption metrics:
- **Real-time Monitoring**: Continuous power draw measurement
- **Historical Tracking**: 60-second rolling window of power data
- **Average Power Calculation**: Dynamic power efficiency metrics
- **State-specific Optimization**: Different power levels for each operational mode

### Energy Saving Strategies
1. **Adaptive Sleep Cycling**: Automatic sleep mode during inactivity
2. **Charging Optimization**: Battery recovery during low-power states (BOOT, SELF_TEST, SLEEP)
3. **Efficient State Transitions**: Minimal power overhead during state changes
4. **Fault-tolerant Design**: Error recovery without excessive power consumption

## Sensor Integration

### Environmental Monitoring
- **Temperature**: Real-time thermal data with configurable thresholds
- **Humidity**: Atmospheric moisture tracking
- **Air Quality**: PM10 and PM2.5 particulate matter monitoring
- **Battery Status**: Charge level monitoring with health indicators

### Data Sources
- **Primary**: Sensor.community API for real environmental data
- **Fallback**: Simulated data for demonstration purposes
- **Update Frequency**: 500ms intervals for real-time responsiveness
- **Microgreens Database**: Detailed botanical data including purification rates, VOC removal potential, and growth cycles.

## User Interface Features

### Interactive State Diagram
- **Visual Topology**: Real-time FSM state visualization
- **Interactive Navigation**: Manual state transitions in manual mode
- **Color-coded States**: Visual distinction between state types
  - Grey: Initialization states (BOOT, SELF_TEST)
  - Blue: Low-power states (SLEEP)
  - Green: Active operational states (WAKE, SENSE, PROCESS, TRANSMIT)
  - Red: Error conditions (ERROR)
  - Amber: Recovery operations (REPAIR)

### Control Panel
- **Mode Selection**: Automatic vs. manual operation modes
- **Manual Transitions**: Direct state navigation for testing
- **System Configuration**: Adjustable parameters for sleep intervals and thresholds
- **Reset Functionality**: System restart and initialization

### Monitoring Dashboards
- **Telemetry Display**: Real-time sensor readings with visual indicators
- **Power Consumption Chart**: Historical power usage visualization
- **System Event Log**: Complete audit trail of state transitions and system events
- **State Information Banner**: Current operational status and metrics

## Operational Modes

### Autonomous Mode
- Fully automated state management based on internal timers and conditions
- Intelligent decision-making for optimal energy efficiency
- Self-healing capabilities through error detection and recovery
- Continuous operation without human intervention

### Manual Mode
- Direct control over state transitions for testing and debugging
- Step-by-step state machine exploration
- Manual override of automatic behaviors
- Educational tool for understanding FSM operations

## Technical Implementation

### Architecture
- **Frontend**: Next.js with React for responsive web interface
- **State Management**: Custom React hooks for FSM logic
- **Visualization**: SVG-based interactive diagrams with Framer Motion animations
- **Real-time Updates**: WebSocket-style updates using React state and effects

### Data Flow
1. **Sensor Input** → **State Processing** → **Decision Logic** → **State Transition**
2. **Power Monitoring** → **Energy Analytics** → **Optimization Algorithms**
3. **Event Logging** → **Historical Tracking** → **Performance Analytics**

## Industrial Applications

This FSM-based smart sensor control system is designed for various industrial IoT scenarios:

### **Environmental Monitoring Stations**
- Remote air quality and weather monitoring
- Energy-efficient operation in off-grid locations
- Autonomous data collection and transmission

### **Smart Building Systems**
- HVAC optimization based on environmental data
- Energy consumption monitoring and optimization
- Predictive maintenance through fault detection

### **Industrial Automation**
- Manufacturing process monitoring
- Equipment health tracking
- Energy management and cost optimization

### **Agricultural IoT**
- Crop monitoring systems
- Soil and weather data collection
- Solar-powered operation with energy optimization

## Key Benefits

1. **Energy Efficiency**: Intelligent power management reduces operational costs
2. **Reliability**: Fault-tolerant design ensures continuous operation
3. **Scalability**: Modular architecture supports multiple sensor deployments
4. **Real-time Monitoring**: Immediate visibility into system status and performance
5. **Data-driven Insights**: Comprehensive logging enables predictive maintenance
6. **Flexibility**: Configurable parameters adapt to various use cases

## Conclusion

The FSM-based Smart Sensor Control System demonstrates a sophisticated approach to Industrial IoT device management. By implementing a deterministic state machine with comprehensive energy management, real-time sensor integration, and fault-tolerant design, the system provides a robust foundation for modern sensor networks. The combination of autonomous operation, manual control capabilities, and detailed monitoring makes it an ideal platform for both production deployments and educational purposes in the field of Industrial IoT and embedded systems design.
