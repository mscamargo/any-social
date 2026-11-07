CREATE TABLE posts (
  id integer NOT NULL PRIMARY KEY AUTOINCREMENT,
  text varchar(140) NOT NULL,
  user_id integer NOT NULL,
  created_at datetime NOT NULL,
  updated_at datetime NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
