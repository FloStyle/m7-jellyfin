// Example 1: Basic route registration
var route = require('movian/route');

route.register('/home', function() {
  console.log('Home route accessed');
  return 'Welcome to the home page!';
});

// Access the route
console.log(route.resolve('/home'));

// Example 2: Route with parameters
route.register('/user/:id', function(params) {
  console.log('User ID:', params.id);
  return `User profile for ID: ${params.id}`;
});

// Access the route with parameter
console.log(route.resolve('/user/123'));

// Example 3: Nested routes
route.register('/admin/dashboard', function() {
  return 'Admin dashboard';
});

route.register('/admin/settings', function() {
  return 'Admin settings';
});

// Access nested routes
console.log(route.resolve('/admin/dashboard'));
console.log(route.resolve('/admin/settings'));

// Example 4: Route with middleware
route.register('/secure', function() {
  return 'Secure content';
}, {
  middleware: function() {
    console.log('Middleware executed');
    return true; // Continue to route handler
  }
});

// Access route with middleware
console.log(route.resolve('/secure'));

// Example 5: Error handling in routes
route.register('/error', function() {
  throw new Error('Route error');
});

try {
  route.resolve('/error');
} catch (err) {
  console.error('Route error:', err.message);
}
