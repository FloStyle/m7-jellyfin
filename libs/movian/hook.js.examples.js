// Example 1: Registering a hook
var hook = require('movian/hook');

var myHook = hook.register('my_event', function(data) {
  console.log('Hook triggered with data:', data);
});

// Trigger the hook
hook.trigger('my_event', { message: 'Hello from hook' });

// Example 2: Unregistering a hook
hook.unregister(myHook);

// Example 3: Multiple hooks for the same event
var hook1 = hook.register('shared_event', function(data) {
  console.log('Hook 1:', data);
});

var hook2 = hook.register('shared_event', function(data) {
  console.log('Hook 2:', data);
});

// Trigger the shared event
hook.trigger('shared_event', { value: 42 });

// Example 4: Error handling in hooks
var errorHook = hook.register('error_event', function(data) {
  if (!data.valid) {
    throw new Error('Invalid data');
  }
  console.log('Data is valid:', data);
});

try {
  hook.trigger('error_event', { valid: false });
} catch (err) {
  console.error('Hook error:', err.message);
}

// Example 5: Using hook context
var contextHook = hook.register('context_event', function(data, context) {
  console.log('Hook context:', context);
  console.log('Hook data:', data);
});

hook.trigger('context_event', { info: 'example' }, { user: 'admin' });
