const db = require('./db');

const query1 = `ALTER TABLE services ADD COLUMN lat DECIMAL(10,8), ADD COLUMN lng DECIMAL(11,8);`;
const query2 = `UPDATE services SET lat = 31.6325, lng = -8.0123 WHERE id = 'bank';`;
const query3 = `UPDATE services SET lat = 31.6450, lng = -8.0200 WHERE id = 'radeema';`;
const query4 = `UPDATE services SET lat = 31.6200, lng = -7.9900 WHERE id = 'admin';`;

db.query(query1, (err) => {
  db.query(query2, () => {
    db.query(query3, () => {
      db.query(query4, () => {
        console.log("DB Map Update Complete");
        process.exit();
      });
    });
  });
});
