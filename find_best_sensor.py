import json
from collections import defaultdict

def analyze_local_data():
    print("Reading local data...")
    file_path = "sensor_data.json"
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print(f"Total records loaded: {len(data)}")
        
        sensors = defaultdict(lambda: {"types": set(), "info": {}})
        
        for record in data:
            sensor_data = record.get("sensor", {})
            sensor_id = sensor_data.get("id")
            sensor_type = sensor_data.get("sensor_type", {}).get("name")
            location = record.get("location", {})
            
            if sensor_id:
                if sensor_id not in sensors:
                     sensors[sensor_id]["info"] = {
                        "id": sensor_id,
                        "type": sensor_type,
                        "location": location
                    }
                
                for value in record.get("sensordatavalues", []):
                    sensors[sensor_id]["types"].add(value.get("value_type"))

        # Convert to list and sort
        sorted_sensors = []
        for s_id, s_data in sensors.items():
            s_data["param_count"] = len(s_data["types"])
            s_data["params"] = list(s_data["types"])
            del s_data["types"] 
            sorted_sensors.append(s_data)
            
        # Sort by number of parameters (descending)
        sorted_sensors.sort(key=lambda x: x["param_count"], reverse=True)
        
        print("\n--- TOP 10 Sensors with Most Parameters ---")
        for s in sorted_sensors[:10]:
            loc = s['info']['location']
            print(f"ID: {s['info']['id']}")
            print(f"Type: {s['info']['type']}")
            print(f"Location: {loc.get('country', 'N/A')}, {loc.get('city', 'N/A')} (Lat: {loc.get('latitude')}, Lon: {loc.get('longitude')})")
            print(f"Parameters ({s['param_count']}): {', '.join(s['params'])}")
            print("-" * 30)

    except FileNotFoundError:
        print(f"Error: {file_path} not found. Please download it first.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    analyze_local_data()
