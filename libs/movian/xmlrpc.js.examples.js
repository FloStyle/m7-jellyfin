// Example 1: Basic XML-RPC call
var xmlrpc = require('movian/xmlrpc');

// Make a simple XML-RPC call
var result = xmlrpc.call(
  'http://example.com/xmlrpc',
  'example.method',
  'param1',
  123,
  true
);

console.log('XML-RPC result:', result);

// Example 2: Handling complex responses
var complexResult = xmlrpc.call(
  'http://example.com/xmlrpc',
  'complex.method',
  { key: 'value' },
  [1, 2, 3]
);

console.log('Complex result:', complexResult.toString());

// Example 3: Error handling
try {
  var errorResult = xmlrpc.call(
    'http://example.com/xmlrpc',
    'invalid.method',
    'bad_param'
  );
} catch (err) {
  console.error('XML-RPC error:', err);
}

// Example 4: Working with nested structures
var nestedResult = xmlrpc.call(
  'http://example.com/xmlrpc',
  'nested.method',
  {
    user: {
      name: 'John Doe',
      age: 30,
      preferences: ['dark_mode', 'notifications']
    }
  }
);

console.log('Nested result:', nestedResult.user.name);
console.log('Preferences:', nestedResult.user.preferences.join(', '));
