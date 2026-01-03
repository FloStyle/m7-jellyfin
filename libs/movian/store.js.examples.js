// Example 1: Basic store usage
var store = require('movian/store');

// Create a new store
var myStore = store.create('myStore');

// Set values
myStore.username = 'john_doe';
myStore.theme = 'dark';

// Get values
console.log('Username:', myStore.username);
console.log('Theme:', myStore.theme);

// Check if key exists
if (myStore.has('theme')) {
  console.log('Theme setting exists');
}

// Example 2: Store persistence
var persistentStore = store.create('persistentStore');

// Set values that will be saved to disk
persistentStore.lastLogin = new Date().toISOString();
persistentStore.preferences = {
  notifications: true,
  language: 'en'
};

// These values will persist after program restart
console.log('Last login:', persistentStore.lastLogin);
console.log('Preferences:', persistentStore.preferences);

// Example 3: Store from specific path
var customStore = store.createFromPath('/custom/path/store.json');

// Use store as normal
customStore.customSetting = 'value';
console.log('Custom setting:', customStore.customSetting);
