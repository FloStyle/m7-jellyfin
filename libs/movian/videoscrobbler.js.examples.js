// Example 1: Basic VideoScrobbler usage
var VideoScrobbler = require('movian/videoscrobbler');

var scrobbler = new VideoScrobbler();

// Event handlers
scrobbler.onstart = function(data, prop, origin) {
  console.log('Video started:', data);
};

scrobbler.onpause = function(data, prop, origin) {
  console.log('Video paused:', data);
};

scrobbler.onresume = function(data, prop, origin) {
  console.log('Video resumed:', data);
};

scrobbler.onstop = function(data, prop, origin) {
  console.log('Video stopped:', data);
};

// Example 2: Destroying the scrobbler
var scrobbler2 = new VideoScrobbler();

// When done with the scrobbler
scrobbler2.destroy();

// Example 3: Handling errors
try {
  var scrobbler3 = new VideoScrobbler();
  // Simulate an error
  throw new Error('Scrobbler error');
} catch (err) {
  console.error('Error:', err);
  scrobbler3.destroy();
}

// Example 4: Tracking multiple videos
var scrobbler4 = new VideoScrobbler();

scrobbler4.onstart = function(data, prop, origin) {
  console.log('New video started:', data.title);
};

scrobbler4.onstop = function(data, prop, origin) {
  console.log('Video stopped:', data.title);
};

// Simulate video events
scrobbler4.onstart({ title: 'Movie 1' }, {}, {});
scrobbler4.onstop({ title: 'Movie 1' }, {}, {});
