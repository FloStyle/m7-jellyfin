// Example 1: Resource management
var resource = Core.resourceCreate();
// Use the resource...
Core.resourceDestroy(resource);

// Example 2: Compiling and running code
var compiled = Core.compile('dataroot://res/ecmascript/example.js');
compiled();

// Example 3: Using timers
var timer = Core.setTimeout(function() {
  console.log('Timer fired!');
}, 1000);

// Example 4: Generating random bytes
var randomData = Core.randomBytes(32);
console.log('Random data:', randomData);

// Example 5: Sleep functionality
console.log('Sleeping for 1 second...');
Core.sleep(1);
console.log('Awake!');

// Example 6: Getting timestamp
var ts = Core.timestamp();
console.log('Current timestamp:', ts);

// Example 7: Resource cleanup
var res = Core.resourceCreate();
try {
  // Use resource
} finally {
  Core.resourceDestroy(res);
}
