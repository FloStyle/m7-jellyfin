// Example 1: Basic HTTP GET request
var http = require('movian/http');

// Make a simple GET request
var response = http.request('https://jsonplaceholder.typicode.com/posts/1', {});

// Access response data
console.log('Status Code:', response.statuscode);
console.log('Content Type:', response.contenttype);
console.log('Response Body:', response.toString());

// Example 2: HTTP request with headers
var headers = {
  'User-Agent': 'MyApp/1.0',
  'Accept': 'application/json'
};

var responseWithHeaders = http.request('https://jsonplaceholder.typicode.com/posts', {
  headers: headers
});

console.log('Response with custom headers:', responseWithHeaders.toString());

// Example 3: Asynchronous HTTP request
http.request('https://jsonplaceholder.typicode.com/comments', {}, function(err, res) {
  if (err) {
    console.error('Request failed:', err);
  } else {
    console.log('Async response:', res.toString());
  }
});

// Example 4: Handling response encoding
var encodedResponse = http.request('https://example.com/encoded', {});
console.log('Decoded response:', encodedResponse.convertFromEncoding('iso-8859-1'));
