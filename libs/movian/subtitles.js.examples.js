// Example 1: Adding a subtitle provider
var subtitles = require('movian/subtitles');

subtitles.addProvider(function(query) {
  // Example subtitle source
  query.addSubtitle(
    'http://example.com/subtitle.srt',
    'Example Subtitle',
    'en',
    'srt',
    'Example Source',
    100
  );
}, 'example-plugin');

// Example 2: Getting available languages
var languages = subtitles.getLanguages();
console.log('Available subtitle languages:', languages);

// Example 3: Using multiple providers
subtitles.addProvider(function(query) {
  // Add subtitles from another source
  query.addSubtitle(
    'http://another.com/subtitle.vtt',
    'Another Subtitle',
    'es',
    'vtt',
    'Another Source',
    90
  );
}, 'another-plugin');
