// Example 1: Creating and using a SQLite database
var sqlite = require('movian/sqlite');

// Create a new database
var db = new sqlite.DB('example.db');

// Create a table
db.query('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT, age INTEGER)');

// Insert data
db.query('INSERT INTO users (name, age) VALUES (?, ?)', 'John Doe', 30);
db.query('INSERT INTO users (name, age) VALUES (?, ?)', 'Jane Smith', 25);

// Query data
db.query('SELECT * FROM users');
while (true) {
  var row = db.step();
  if (!row) break;
  console.log('User: ' + row.name + ', Age: ' + row.age);
}

// Update data
db.query('UPDATE users SET age = ? WHERE name = ?', 31, 'John Doe');

// Delete data
db.query('DELETE FROM users WHERE name = ?', 'Jane Smith');

// Check last inserted row ID
console.log('Last inserted row ID:', db.lastRowId);

// Close the database
db.close();

// Example 2: Handling errors
try {
  var db2 = new sqlite.DB('example2.db');
  db2.query('INVALID SQL'); // This will cause an error
} catch (err) {
  console.error('SQL Error:', db2.lastErrorString);
  console.error('Error Code:', db2.lastErrorCode);
  db2.close();
}

// Example 3: Schema upgrades
var db3 = new sqlite.DB('example3.db');
db3.upgradeSchema('path/to/schema.sql');
db3.close();
