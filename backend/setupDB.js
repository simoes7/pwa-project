// setupDB.js — Updated for the new schema
// Run this ONCE to initialize a fresh database.
// If you already ran schema_update.sql in phpMyAdmin, you do NOT need this file.

const db = require('./db');

const queries = [
  // users
  `CREATE TABLE IF NOT EXISTS \`users\` (
    \`id\`           int(11)      NOT NULL AUTO_INCREMENT,
    \`name\`         varchar(255) NOT NULL,
    \`email\`        varchar(255) NOT NULL,
    \`password\`     varchar(255) NOT NULL,
    \`phone_number\` varchar(20)  DEFAULT NULL,
    \`role\`         varchar(50)  DEFAULT 'user',
    \`is_active\`    tinyint(1)   DEFAULT 1,
    \`created_at\`   timestamp    NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`email\` (\`email\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // services
  `CREATE TABLE IF NOT EXISTS \`services\` (
    \`id\`                      varchar(50)   NOT NULL,
    \`name\`                    varchar(255)  NOT NULL,
    \`category\`                varchar(100)  NOT NULL,
    \`description\`             text          DEFAULT NULL,
    \`icon\`                    varchar(100)  DEFAULT NULL,
    \`color_theme\`             varchar(100)  DEFAULT NULL,
    \`estimated_wait_time\`     int(11)       DEFAULT 10,
    \`is_fast_track_available\` tinyint(1)    DEFAULT 0,
    \`is_open\`                 tinyint(1)    DEFAULT 1,
    \`max_capacity\`            int(11)       DEFAULT NULL,
    \`address\`                 varchar(255)  DEFAULT NULL,
    \`lat\`                     decimal(10,8) DEFAULT NULL,
    \`lng\`                     decimal(11,8) DEFAULT NULL,
    PRIMARY KEY (\`id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // Seed services
  `INSERT IGNORE INTO \`services\`
    (id, name, category, description, icon, color_theme, estimated_wait_time, is_fast_track_available, is_open, lat, lng)
   VALUES
    ('bank',          'Central Bank Branch',     'Financial',        'Manage your finances, open accounts, and consult with specialists.',      'account_balance', 'primary-container',          3,  1, 1, NULL, NULL),
    ('radeema',       'Radeema Utility',          'Utilities',        'Payment processing, contract renewals, and technical service inquiries.', 'flash_on',        'tertiary-container',         6,  0, 1, NULL, NULL),
    ('admin',         'City Hall Admin',          'Government',       'Civil registry, permits, and general administrative documentation.',      'corporate_fare',  'surface-container-highest',  1,  0, 1, NULL, NULL),
    ('bank_chaabi',   'Banque Populaire Medina',  'Financial',        'Retail banking, currency exchange, and loans.',                           'account_balance', 'primary-container',          12, 0, 1, 31.62650000, -7.98800000),
    ('barid_gueliz',  'Barid Al Maghrib (Poste)', 'Postal',           'Send packages, receive mail, and manage postal financial services.',      'mail',            'primary-container',          8,  1, 1, 31.63000000, -8.01600000),
    ('chu_marrakech', 'CHU Mohammed VI',          'Healthcare',       'General consultations, emergencies, and specialized medical care.',       'local_hospital',  'surface-container-highest',  45, 0, 1, 31.60300000, -8.01500000),
    ('cnss_marrakech','CNSS Marrakech',           'Government',       'Manage social security, family allowances, and health insurance.',        'corporate_fare',  'secondary-container',        20, 0, 1, 31.62500000, -8.00500000),
    ('iam_gueliz',    'Maroc Telecom Guéliz',     'Telecommunications','Internet subscriptions, mobile plans, and customer support.',            'wifi',            'tertiary-container',         10, 1, 1, 31.63150000, -8.01000000)`,

  // service_points
  `CREATE TABLE IF NOT EXISTS \`service_points\` (
    \`id\`         int(11)      NOT NULL AUTO_INCREMENT,
    \`service_id\` varchar(50)  DEFAULT NULL,
    \`name\`       varchar(255) DEFAULT NULL,
    \`status\`     varchar(50)  DEFAULT 'active',
    \`staff_name\` varchar(255) DEFAULT NULL,
    PRIMARY KEY (\`id\`),
    KEY \`service_id\` (\`service_id\`),
    CONSTRAINT \`service_points_ibfk_1\` FOREIGN KEY (\`service_id\`) REFERENCES \`services\` (\`id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `INSERT IGNORE INTO \`service_points\` (id, service_id, name, status, staff_name) VALUES
    (1, 'bank',    'Counter 1', 'active', 'Ahmed'),
    (2, 'bank',    'Counter 2', 'active', 'Sarah'),
    (3, 'radeema', 'Desk A',    'active', 'Youssef')`,

  // staff_assignments
  `CREATE TABLE IF NOT EXISTS \`staff_assignments\` (
    \`id\`          int(11)     NOT NULL AUTO_INCREMENT,
    \`user_id\`     int(11)     NOT NULL,
    \`service_id\`  varchar(50) NOT NULL,
    \`assigned_at\` timestamp   NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (\`id\`),
    KEY \`user_id\`    (\`user_id\`),
    KEY \`service_id\` (\`service_id\`),
    CONSTRAINT \`sa_ibfk_1\` FOREIGN KEY (\`user_id\`)    REFERENCES \`users\`    (\`id\`),
    CONSTRAINT \`sa_ibfk_2\` FOREIGN KEY (\`service_id\`) REFERENCES \`services\` (\`id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // tickets (new schema — no user_name column)
  `CREATE TABLE IF NOT EXISTS \`tickets\` (
    \`id\`               int(11)      NOT NULL AUTO_INCREMENT,
    \`user_id\`          int(11)      NOT NULL,
    \`service_id\`       varchar(50)  NOT NULL,
    \`service_point_id\` int(11)      DEFAULT NULL,
    \`queue_number\`     int(11)      DEFAULT NULL,
    \`position\`         int(11)      DEFAULT NULL,
    \`status\`           enum('waiting','called','paused','done','cancelled','no_show') DEFAULT 'waiting',
    \`is_paused\`        tinyint(1)   DEFAULT 0,
    \`paused_at\`        timestamp    NULL DEFAULT NULL,
    \`created_at\`       timestamp    NOT NULL DEFAULT current_timestamp(),
    \`called_at\`        timestamp    NULL DEFAULT NULL,
    \`finished_at\`      timestamp    NULL DEFAULT NULL,
    PRIMARY KEY (\`id\`),
    KEY \`user_id\`          (\`user_id\`),
    KEY \`service_id\`       (\`service_id\`),
    KEY \`service_point_id\` (\`service_point_id\`),
    CONSTRAINT \`tickets_ibfk_1\` FOREIGN KEY (\`user_id\`)          REFERENCES \`users\`          (\`id\`),
    CONSTRAINT \`tickets_ibfk_2\` FOREIGN KEY (\`service_id\`)       REFERENCES \`services\`       (\`id\`),
    CONSTRAINT \`tickets_ibfk_3\` FOREIGN KEY (\`service_point_id\`) REFERENCES \`service_points\` (\`id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // feedback
  `CREATE TABLE IF NOT EXISTS \`feedback\` (
    \`id\`         int(11)   NOT NULL AUTO_INCREMENT,
    \`ticket_id\`  int(11)   DEFAULT NULL,
    \`rating\`     tinyint   DEFAULT NULL CHECK (\`rating\` BETWEEN 1 AND 5),
    \`comment\`    text      DEFAULT NULL,
    \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (\`id\`),
    KEY \`ticket_id\` (\`ticket_id\`),
    CONSTRAINT \`feedback_ibfk_1\` FOREIGN KEY (\`ticket_id\`) REFERENCES \`tickets\` (\`id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // faqs
  `CREATE TABLE IF NOT EXISTS \`faqs\` (
    \`id\`         int(11)      NOT NULL AUTO_INCREMENT,
    \`question\`   varchar(255) NOT NULL,
    \`answer\`     text         NOT NULL,
    \`category\`   varchar(100) DEFAULT 'General',
    \`is_active\`  tinyint(1)   DEFAULT 1,
    \`created_at\` timestamp    NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (\`id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `INSERT IGNORE INTO \`faqs\` (id, question, answer, category) VALUES
    (1, 'How do I join a queue remotely?', 'Browse the Services page or use the Map to find a nearby location.', 'General'),
    (2, 'What if I miss my turn?',         'Our Grace Period feature holds your spot for up to 5 minutes.',      'General'),
    (3, 'Can I pause my ticket?',          'Yes! Use the Pause feature on your digital ticket.',                 'General')`,

  // support_requests
  `CREATE TABLE IF NOT EXISTS \`support_requests\` (
    \`id\`         int(11)      NOT NULL AUTO_INCREMENT,
    \`user_id\`    int(11)      DEFAULT NULL,
    \`service_id\` varchar(50)  DEFAULT NULL,
    \`subject\`    varchar(255) NOT NULL,
    \`message\`    text         NOT NULL,
    \`status\`     varchar(50)  DEFAULT 'open',
    \`created_at\` timestamp    NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (\`id\`),
    KEY \`user_id\`    (\`user_id\`),
    KEY \`service_id\` (\`service_id\`),
    CONSTRAINT \`sr_ibfk_1\` FOREIGN KEY (\`user_id\`)    REFERENCES \`users\`    (\`id\`),
    CONSTRAINT \`sr_ibfk_2\` FOREIGN KEY (\`service_id\`) REFERENCES \`services\` (\`id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // settings
  `CREATE TABLE IF NOT EXISTS \`settings\` (
    \`id\`            int(11)      NOT NULL AUTO_INCREMENT,
    \`service_id\`    varchar(50)  DEFAULT NULL,
    \`setting_key\`   varchar(100) DEFAULT NULL,
    \`setting_value\` text         DEFAULT NULL,
    PRIMARY KEY (\`id\`),
    KEY \`service_id\` (\`service_id\`),
    CONSTRAINT \`settings_ibfk_1\` FOREIGN KEY (\`service_id\`) REFERENCES \`services\` (\`id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
];

async function runAll() {
  for (const sql of queries) {
    await new Promise((resolve, reject) => {
      db.query(sql, (err) => {
        if (err) { console.error('Query error:', err.message); reject(err); }
        else resolve();
      });
    });
  }
  console.log('✅ Setup complete — all tables created/verified.');
  process.exit(0);
}

runAll().catch(() => process.exit(1));
