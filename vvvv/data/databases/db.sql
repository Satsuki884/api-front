DROP DATABASE usof_backend;
CREATE DATABASE IF NOT EXISTS usof_backend;
CREATE USER IF NOT EXISTS 'sklymenko'@'localhost' IDENTIFIED BY 'securepass';
GRANT ALL PRIVILEGES ON usof_backend.* TO 'sklymenko'@'localhost';

USE usof_backend;

CREATE TABLE IF NOT EXISTS users
(
    id INT AUTO_INCREMENT PRIMARY KEY,
    login VARCHAR(120) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(240) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    role ENUM('admin','user') NOT NULL DEFAULT 'user',
    profile_image VARCHAR(255) NOT NULL DEFAULT '../../ui/resources/images/default.jpg',
    rating INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS posts
(
    id INT AUTO_INCREMENT PRIMARY KEY,
    author INT NOT NULL,
    FOREIGN KEY (author) REFERENCES users(id),
    title VARCHAR(100) NOT NULL,
    publishDate VARCHAR(100) NOT NULL,
    status BOOLEAN NOT NULL,
    content VARCHAR(1024),
    content_picture varchar(255) DEFAULT 'images/default.jpg'
);

CREATE TABLE IF NOT EXISTS categories
(
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS post_category
(
    id INT AUTO_INCREMENT PRIMARY KEY,
    init_post INT,
    FOREIGN KEY (init_post) REFERENCES posts(id),
    init_category INT NOT NULL,
    FOREIGN KEY (init_category) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS comments(
    id INT AUTO_INCREMENT PRIMARY KEY,
    author INT NOT NULL,
    FOREIGN KEY (author) REFERENCES users(id),
    publishDate TIMESTAMP NOT NULL,
    content VARCHAR(1024) NOT NULL,
    init_post INT NOT NULL,
    FOREIGN KEY (init_post) REFERENCES posts(id)
);

CREATE TABLE IF NOT EXISTS like_post (
	id INT AUTO_INCREMENT PRIMARY KEY,
	init_post INT NOT NULL,
    FOREIGN KEY (init_post) REFERENCES posts(id),
	author INT NOT NULL,
    FOREIGN KEY (author) REFERENCES users(id),
	publishDate DATE NOT NULL,
	type ENUM('like', 'dislike')
);

CREATE TABLE IF NOT EXISTS like_comments (
	id INT AUTO_INCREMENT PRIMARY KEY,
    init_comment INT NOT NULL,
    FOREIGN KEY (init_comment) REFERENCES comments(id),
	author INT NOT NULL,
    FOREIGN KEY (author) REFERENCES users(id),
	publishDate DATE NOT NULL,
	type ENUM('like', 'dislike')
);

