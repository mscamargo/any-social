CREATE TABLE users (
  id integer NOT NULL PRIMARY KEY AUTOINCREMENT,
  username varchar(255) NOT NULL,
  email varchar(255) NOT NULL,
  password varchar(255) NOT NULL,
  title varchar(255),
  created_at datetime NOT NULL,
  updated_at datetime NOT NULL
);

CREATE UNIQUE INDEX users_username_unique ON users (username);
CREATE UNIQUE INDEX users_email_unique ON users (email);
