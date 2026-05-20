CREATE DATABASE IF NOT EXISTS secure_vault;
USE secure_vault;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255),
  role ENUM('admin','manager','user') DEFAULT 'user',
  two_factor_secret VARCHAR(255),
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  oauth_provider VARCHAR(50),
  oauth_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100),
  file_size INT,
  sha256_hash VARCHAR(64),
  signature TEXT,
  public_key TEXT,
  is_encrypted BOOLEAN DEFAULT TRUE,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO users (username, email, password, role) VALUES
('admin', 'admin@vault.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');