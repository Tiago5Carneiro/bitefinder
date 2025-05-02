CREATE DATABASE IF NOT EXISTS bitefinder;
USE bitefinder;

CREATE TABLE IF NOT EXISTS user (
    username VARCHAR(100) PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    password VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS restaurant (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    rating FLOAT NOT NULL,
    url_location VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS `group` (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    status ENUM('active', 'inactive') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS group_user (
    group_code VARCHAR(10),
    username VARCHAR(100),
    PRIMARY KEY (group_code, username)
);

CREATE TABLE IF NOT EXISTS user_restaurant (
    username VARCHAR(100),
    restaurant_id INT,
    PRIMARY KEY (username, restaurant_id)
);

CREATE TABLE IF NOT EXISTS restaurant_image (
    restaurant_id INT,
    image_url VARCHAR(255),
    PRIMARY KEY (restaurant_id, image_url)
);