const fs = require('fs');
const path = require('path');
const uuid = require('uuid/v4');

async function getUserKey(id) {
  return new Promise((res, req) => {
    const file = path.join(__dirname, 'data', 'key_' + id);
    fs.exists(file, (exists) => {
      if (exists) {
        fs.readFile(file, (error, data) => {
          if (error) {
            req(error);
          } else {
            res(data.toString().trim());
          }
        });
      } else {
        const key = uuid().replace(/-/g, '');
        fs.writeFile(file, key, (error) => {
          if (error) {
            req(error);
          } else {
            res(key);
          }
        });
      }
    });
  });
}

module.exports = {
  getUserKey
}
