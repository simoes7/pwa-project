const db = require('./db');

const query1 = `
CREATE TABLE IF NOT EXISTS services (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  color_theme VARCHAR(100),
  estimated_wait_time INT DEFAULT 10,
  is_fast_track_available BOOLEAN DEFAULT FALSE
);
`;

const query2 = `
CREATE TABLE IF NOT EXISTS tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  service_id VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'waiting', 
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES services(id)
);
`;

const query3 = `
INSERT IGNORE INTO services (id, name, category, description, icon, color_theme, estimated_wait_time, is_fast_track_available) VALUES
('bank', 'Central Bank Branch', 'Financial', 'Manage your finances, open accounts, and consult with specialists.', 'account_balance', 'primary-container', 3, TRUE),
('radeema', 'Radeema Utility', 'Utilities', 'Payment processing, contract renewals, and technical service inquiries.', 'flash_on', 'tertiary-container', 6, FALSE),
('admin', 'City Hall Admin', 'Government', 'Civil registry, permits, and general administrative documentation.', 'corporate_fare', 'surface-container-highest', 1, FALSE);
`;

const query4 = `
CREATE TABLE IF NOT EXISTS faqs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question VARCHAR(255) NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(100) DEFAULT 'General'
);
`;

const query5 = `
CREATE TABLE IF NOT EXISTS support_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

const query6 = `
INSERT IGNORE INTO faqs (id, question, answer, category) VALUES
(1, 'How do I join a queue remotely?', 'You can join a queue by browsing the ''Services'' page or using the ''Map'' to find a nearby location.', 'General'),
(2, 'What if I miss my turn?', 'Our ''Grace Period'' feature holds your spot for up to 5 minutes.', 'General'),
(3, 'Can I pause my ticket?', 'Yes! You can use the ''Pause'' feature on your digital ticket.', 'General');
`;

db.query(query1, (err) => {
  if(err) console.log(err);
  db.query(query2, (err) => {
    if(err) console.log(err);
    db.query(query3, (err) => {
      if(err) console.log(err);
      db.query(query4, (err) => {
        if(err) console.log(err);
        db.query(query5, (err) => {
          if(err) console.log(err);
          db.query(query6, (err) => {
            if(err) console.log(err);
            console.log('Setup complete');
            process.exit();
          });
        });
      });
    });
  });
});
