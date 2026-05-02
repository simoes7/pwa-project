SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
/*!40101 SET NAMES utf8mb4 */;

DROP TABLE IF EXISTS feedback, tickets, staff_assignments, support_requests, settings, service_points, faqs, services, users;

-- --------------------------------------------------------
-- Table: users
-- --------------------------------------------------------
CREATE TABLE `users` (
  `id`           int(11)      NOT NULL AUTO_INCREMENT,
  `name`         varchar(255) NOT NULL,
  `email`        varchar(255) NOT NULL,
  `password`     varchar(255) NOT NULL,
  `phone_number` varchar(20)  DEFAULT NULL,
  `role`         varchar(50)  DEFAULT 'user',
  `is_active`    tinyint(1)   DEFAULT 1,
  `created_at`   timestamp    NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `is_active`, `created_at`) VALUES
(1, 'Mohamed Essaidi', 'simoesaaidi65@gmail.com', '$2b$10$SXP.r8ZHjKvpUohCTgi80eM91HfrKItxb3w4uN/VILb6X39gRKLNm', 'user',  1, '2026-04-22 17:45:50'),
(2, 'Admin',           'admin@admin.com',          '$2b$10$kmOg3HpJeyQ6v.qlBi1guOO7WMUV/pDEZHK8djt2borPWU2kMV9uG', 'admin', 1, '2026-04-22 17:50:19'),
(3, 'Test User',       'test@example.com',          '$2b$10$zF/j7phCCtCWk9Rw7TW4h.DulFNIbQb1Lt6GP9aBl/WCYXokVSbwy', 'user',  1, '2026-04-25 16:29:39'),
(4, 'Test User',       'testuser_flow@test.com',    '$2b$10$W6dzIeSGlum7wF5kzMoFVuaZFGNK8S7KMH7QaYFZjBjUmJT.DjgOW', 'user',  1, '2026-04-25 19:15:52');

-- --------------------------------------------------------
-- Table: services
-- --------------------------------------------------------
CREATE TABLE `services` (
  `id`                     varchar(50)    NOT NULL,
  `name`                   varchar(255)   NOT NULL,
  `category`               varchar(100)   NOT NULL,
  `description`            text           DEFAULT NULL,
  `icon`                   varchar(100)   DEFAULT NULL,
  `color_theme`            varchar(100)   DEFAULT NULL,
  `estimated_wait_time`    int(11)        DEFAULT 10,
  `is_fast_track_available` tinyint(1)   DEFAULT 0,
  `is_open`                tinyint(1)     DEFAULT 1,
  `max_capacity`           int(11)        DEFAULT NULL COMMENT 'Max tickets allowed in queue; NULL = unlimited',
  `address`                varchar(255)   DEFAULT NULL,
  `lat`                    decimal(10,8)  DEFAULT NULL,
  `lng`                    decimal(11,8)  DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `services` (`id`, `name`, `category`, `description`, `icon`, `color_theme`, `estimated_wait_time`, `is_fast_track_available`, `is_open`, `max_capacity`, `address`, `lat`, `lng`) VALUES
('admin',         'City Hall Admin',            'Government',       'Civil registry, permits, and general administrative documentation.', 'corporate_fare', 'surface-container-highest', 1,  0, 1, NULL, NULL, NULL, NULL),
('bank',          'Central Bank Branch',        'Financial',        'Manage your finances, open accounts, and consult with specialists.',  'account_balance', 'primary-container',          3,  1, 1, 50,   NULL, NULL, NULL),
('bank_chaabi',   'Banque Populaire Medina',    'Financial',        'Retail banking, currency exchange, and loans.',                       'account_balance', 'primary-container',          12, 0, 1, NULL, NULL, 31.62650000, -7.98800000),
('barid_gueliz',  'Barid Al Maghrib (Poste)',   'Postal',           'Send packages, receive mail, and manage postal financial services.',  'mail',            'primary-container',          8,  1, 1, NULL, NULL, 31.63000000, -8.01600000),
('chu_marrakech', 'CHU Mohammed VI',            'Healthcare',       'General consultations, emergencies, and specialized medical care.',   'local_hospital',  'surface-container-highest',  45, 0, 1, NULL, NULL, 31.60300000, -8.01500000),
('cnss_marrakech','CNSS Marrakech',             'Government',       'Manage social security, family allowances, and health insurance.',   'corporate_fare',  'secondary-container',        20, 0, 1, NULL, NULL, 31.62500000, -8.00500000),
('iam_gueliz',    'Maroc Telecom Guéliz',       'Telecommunications','Internet subscriptions, mobile plans, and customer support.',       'wifi',            'tertiary-container',         10, 1, 1, NULL, NULL, 31.63150000, -8.01000000),
('radeema',       'Radeema Utility',            'Utilities',        'Payment processing, contract renewals, and technical service inquiries.','flash_on',    'tertiary-container',         6,  0, 1, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------
-- Table: service_points
-- --------------------------------------------------------
CREATE TABLE `service_points` (
  `id`         int(11)      NOT NULL AUTO_INCREMENT,
  `service_id` varchar(50)  DEFAULT NULL,
  `name`       varchar(255) DEFAULT NULL,
  `status`     varchar(50)  DEFAULT 'active',
  `staff_name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `service_id` (`service_id`),
  CONSTRAINT `service_points_ibfk_1` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `service_points` (`id`, `service_id`, `name`, `status`, `staff_name`) VALUES
(1, 'bank',    'Counter 1', 'active', 'Ahmed'),
(2, 'bank',    'Counter 2', 'active', 'Sarah'),
(3, 'radeema', 'Desk A',    'active', 'Youssef');

-- --------------------------------------------------------
-- Table: staff_assignments
-- Replaces users.service_id — allows one staff member to cover multiple services
-- --------------------------------------------------------
CREATE TABLE `staff_assignments` (
  `id`          int(11)     NOT NULL AUTO_INCREMENT,
  `user_id`     int(11)     NOT NULL,
  `service_id`  varchar(50) NOT NULL,
  `assigned_at` timestamp   NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id`    (`user_id`),
  KEY `service_id` (`service_id`),
  CONSTRAINT `sa_ibfk_1` FOREIGN KEY (`user_id`)    REFERENCES `users`    (`id`),
  CONSTRAINT `sa_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Admin user (id=2) is assigned to the bank service
INSERT INTO `staff_assignments` (`user_id`, `service_id`) VALUES (2, 'bank');

-- --------------------------------------------------------
-- Table: tickets
-- --------------------------------------------------------
CREATE TABLE `tickets` (
  `id`               int(11)      NOT NULL AUTO_INCREMENT,
  `user_id`          int(11)      NOT NULL,
  `service_id`       varchar(50)  NOT NULL,
  `service_point_id` int(11)      DEFAULT NULL COMMENT 'Which counter/desk served this ticket',
  `queue_number`     int(11)      DEFAULT NULL COMMENT 'Human-readable number shown on the ticket (e.g. B-042)',
  `position`         int(11)      DEFAULT NULL COMMENT 'Live position in queue (1 = next to be called)',
  `status`           enum('waiting','called','paused','done','cancelled','no_show') DEFAULT 'waiting',
  `is_paused`        tinyint(1)   DEFAULT 0,
  `paused_at`        timestamp    NULL DEFAULT NULL,
  `created_at`       timestamp    NOT NULL DEFAULT current_timestamp(),
  `called_at`        timestamp    NULL DEFAULT NULL,
  `finished_at`      timestamp    NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id`          (`user_id`),
  KEY `service_id`       (`service_id`),
  KEY `service_point_id` (`service_point_id`),
  CONSTRAINT `tickets_ibfk_1` FOREIGN KEY (`user_id`)          REFERENCES `users`          (`id`),
  CONSTRAINT `tickets_ibfk_2` FOREIGN KEY (`service_id`)       REFERENCES `services`       (`id`),
  CONSTRAINT `tickets_ibfk_3` FOREIGN KEY (`service_point_id`) REFERENCES `service_points` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `tickets` (`id`, `user_id`, `service_id`, `service_point_id`, `status`, `created_at`, `called_at`, `finished_at`) VALUES
(1,  1, 'bank_chaabi',   NULL, 'done',    '2026-04-22 18:39:59', NULL,                  NULL),
(2,  1, 'iam_gueliz',    NULL, 'waiting', '2026-04-22 19:22:58', NULL,                  NULL),
(3,  1, 'bank',          1,    'done',    '2026-04-22 19:38:03', '2026-04-25 16:31:47', '2026-04-25 16:32:00'),
(8,  1, 'admin',         NULL, 'called',  '2026-04-25 16:03:52', '2026-04-25 19:16:04', NULL),
(11, 3, 'admin',         NULL, 'called',  '2026-04-25 16:30:07', '2026-04-25 19:16:19', NULL),
(12, 1, 'barid_gueliz',  NULL, 'waiting', '2026-04-25 16:31:03', NULL,                  NULL),
(13, 4, 'admin',         NULL, 'waiting', '2026-04-25 19:15:53', NULL,                  NULL),
(14, 1, 'chu_marrakech', NULL, 'waiting', '2026-04-26 14:44:57', NULL,                  NULL),
(15, 1, 'iam_gueliz',    NULL, 'waiting', '2026-04-26 14:45:14', NULL,                  NULL),
(16, 1, 'bank',          2,    'done',    '2026-04-26 15:47:08', '2026-04-26 15:47:39', '2026-04-26 15:47:51'),
(17, 1, 'cnss_marrakech',NULL, 'waiting', '2026-04-29 13:22:31', NULL,                  NULL),
(18, 1, 'admin',         NULL, 'waiting', '2026-04-29 13:29:15', NULL,                  NULL),
(19, 1, 'bank',          1,    'done',    '2026-04-29 13:34:42', '2026-04-29 13:39:55', '2026-04-29 13:40:01');

-- --------------------------------------------------------
-- Table: feedback
-- --------------------------------------------------------
CREATE TABLE `feedback` (
  `id`         int(11)   NOT NULL AUTO_INCREMENT,
  `ticket_id`  int(11)   DEFAULT NULL,
  `rating`     tinyint   DEFAULT NULL CHECK (`rating` BETWEEN 1 AND 5),
  `comment`    text      DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `ticket_id` (`ticket_id`),
  CONSTRAINT `feedback_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table: faqs
-- Duplicates removed; added is_active and created_at
-- --------------------------------------------------------
CREATE TABLE `faqs` (
  `id`         int(11)      NOT NULL AUTO_INCREMENT,
  `question`   varchar(255) NOT NULL,
  `answer`     text         NOT NULL,
  `category`   varchar(100) DEFAULT 'General',
  `is_active`  tinyint(1)   DEFAULT 1,
  `created_at` timestamp    NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `faqs` (`id`, `question`, `answer`, `category`) VALUES
(1, 'How do I join a queue remotely?', 'You can join a queue by browsing the Services page or using the Map to find a nearby location.', 'General'),
(2, 'What if I miss my turn?',         'Our Grace Period feature holds your spot for up to 5 minutes.',                                  'General'),
(3, 'Can I pause my ticket?',          'Yes! You can use the Pause feature on your digital ticket to hold your spot.',                   'General');

-- --------------------------------------------------------
-- Table: support_requests
-- --------------------------------------------------------
CREATE TABLE `support_requests` (
  `id`         int(11)      NOT NULL AUTO_INCREMENT,
  `user_id`    int(11)      DEFAULT NULL,
  `service_id` varchar(50)  DEFAULT NULL,
  `subject`    varchar(255) NOT NULL,
  `message`    text         NOT NULL,
  `status`     varchar(50)  DEFAULT 'open',
  `created_at` timestamp    NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id`    (`user_id`),
  KEY `service_id` (`service_id`),
  CONSTRAINT `sr_ibfk_1` FOREIGN KEY (`user_id`)    REFERENCES `users`    (`id`),
  CONSTRAINT `sr_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table: settings
-- --------------------------------------------------------
CREATE TABLE `settings` (
  `id`            int(11)      NOT NULL AUTO_INCREMENT,
  `service_id`    varchar(50)  DEFAULT NULL,
  `setting_key`   varchar(100) DEFAULT NULL,
  `setting_value` text         DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `service_id` (`service_id`),
  CONSTRAINT `settings_ibfk_1` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

COMMIT;
