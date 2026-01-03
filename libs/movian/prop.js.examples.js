// Example 1: Creating and using properties
var prop = require('movian/prop');

// Create a root property
var rootProp = prop.createRoot('MyApp');

// Set property values
prop.setString(rootProp, 'title', 'My Application');
prop.setInt(rootProp, 'version', 1);
prop.setBool(rootProp, 'enabled', true);

// Get property values
console.log('Title:', prop.getString(rootProp, 'title'));
console.log('Version:', prop.getInt(rootProp, 'version'));
console.log('Enabled:', prop.getBool(rootProp, 'enabled'));

// Example 2: Subscribing to property changes
prop.subscribeValue(rootProp, 'title', function(newValue) {
  console.log('Title changed to:', newValue);
});

// Simulate property change
prop.setString(rootProp, 'title', 'Updated Application');

// Example 3: Working with nested properties
var userProp = prop.create(rootProp, 'user');
prop.setString(userProp, 'name', 'John Doe');
prop.setInt(userProp, 'age', 30);

console.log('User name:', prop.getString(userProp, 'name'));
console.log('User age:', prop.getInt(userProp, 'age'));

// Example 4: Destroying properties
prop.destroy(rootProp);
