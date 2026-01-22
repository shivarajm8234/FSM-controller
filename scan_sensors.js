const https = require('https');

const checkSensor = (id) => {
  return new Promise((resolve) => {
    https.get(`https://data.sensor.community/airrohr/v1/sensor/${id}/`, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            if (json.length > 0) {
              const types = new Set();
              json[0].sensordatavalues.forEach(v => types.add(v.value_type));
              resolve({ id, types: Array.from(types), record: json[0] });
            } else {
              resolve(null);
            }
          } catch (e) { resolve(null); }
        } else {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
};

const scan = async () => {
  const tasks = [];
  // Scan a range around the known good one
  for (let i = 61980; i < 62050; i++) {
    tasks.push(checkSensor(i));
  }
  
  const results = await Promise.all(tasks);
  const found = results.filter(r => r !== null);
  
  found.sort((a, b) => b.types.length - a.types.length);
  
  console.log("Top sensors found:");
  found.forEach(f => {
    console.log(`ID: ${f.id}, Params (${f.types.length}): ${f.types.join(', ')}`);
  });
};

scan();
