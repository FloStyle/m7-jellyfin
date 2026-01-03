// Example 1: Basic HTTP GET request
native.io.httpReq({
  url: 'https://api.example.com/data',
  method: 'GET',
  debug: true
}, function(err, res) {
  if (err) {
    console.error('Request failed:', err);
    return;
  }
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.responseHeaders);
  console.log('Data:', res.buffer.toString());
});

// Example 2: XML-RPC call
native.io.xmlrpc(
  'https://api.example.com/xmlrpc',
  'example.method',
  JSON.stringify({param1: 'value1'}),
  function(err, result) {
    if (err) {
      console.error('XML-RPC error:', err);
      return;
    }
    console.log('XML-RPC result:', result);
  }
);

// Example 3: URL probing
native.io.probe('https://api.example.com', 5000, function(err, result) {
  if (err) {
    console.error('Probe error:', err);
    return;
  }
  console.log('Probe result:', result.result);
  if (result.errmsg) {
    console.log('Error message:', result.errmsg);
  }
});

// Example 4: HTTP Inspector
var inspector = native.io.httpInspectorCreate('^https://api.example.com', true);

inspector.on('inspect', function(request) {
  console.log('Inspecting request to:', request.url);
  
  if (request.authFailed) {
    console.log('Authentication failed');
    request.fail('Authentication required');
    return;
  }
  
  // Modify request headers
  request.setHeader('X-Custom-Header', 'value');
  
  // Proceed with the request
  request.proceed();
});
