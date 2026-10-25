CREATE TABLE comments (
  id integer NOT NULL PRIMARY KEY AUTOINCREMENT,
  text varchar(140) NOT NULL,
  post_id integer NOT NULL,
  user_id integer NOT NULL,
  created_at datetime NOT NULL,
  updated_at datetime NOT NULL,
  FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
