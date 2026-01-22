const https = require('https');

const url = 'https://data.sensor.community/airrohr/v1/filter/area=50.078,19.969,20'; // 20km radius

https.get(url, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log(`Fetched ${json.length} records.`);

      const sensors = {};

      json.forEach(record => {
        const sensorId = record.sensor.id;
        if (!sensors[sensorId]) {
          sensors[sensorId] = {
            id: sensorId,
            type: record.sensor.sensor_type.name,
            valueTypes: new Set(),
            data: record
          };
        }
        record.sensordatavalues.forEach(v => {
          sensors[sensorId].valueTypes.add(v.value_type);
        });
      });

      const sortedSensors = Object.values(sensors).sort((a, b) => b.valueTypes.size - a.valueTypes.size);

      console.log('Top 5 sensors with most parameters:');
      sortedSensors.slice(0, 5).forEach(s => {
        console.log(`ID: ${s.id}, Type: ${s.type}, Params: ${Array.from(s.valueTypes).join(', ')}`);
      });

    } catch (e) {
      console.error(e.message);
    }
  });

}).on('error', (err) => {
  console.error("Error: " + err.message);
});
