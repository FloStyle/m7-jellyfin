// Example 1: Parsing HTML
var html = require('movian/html');

var htmlString = `
<html>
  <body>
    <div id="content">
      <p class="text">Hello World</p>
      <p class="text">Another paragraph</p>
    </div>
  </body>
</html>`;

var parsed = html.parse(htmlString);

// Accessing elements by ID
var contentDiv = parsed.document.getElementById('content');
console.log('Content div:', contentDiv);

// Accessing elements by class name
var textElements = parsed.document.getElementByClassName('text');
textElements.forEach(function(el, index) {
  console.log(`Text element ${index + 1}:`, el.textContent);
});

// Example 2: Working with HTML attributes
var htmlWithAttributes = `
<div id="main" class="container" data-info="example">
  <a href="https://example.com">Link</a>
</div>`;

var parsedWithAttributes = html.parse(htmlWithAttributes);
var mainDiv = parsedWithAttributes.document.getElementById('main');

console.log('Main div attributes:', mainDiv.attributes);
console.log('Link href:', mainDiv.getElementByTagName('a')[0].attributes.href);

// Example 3: Traversing the DOM
var complexHtml = `
<html>
  <body>
    <div class="section">
      <h1>Title</h1>
      <p>Content</p>
    </div>
    <div class="section">
      <h2>Subtitle</h2>
      <p>More content</p>
    </div>
  </body>
</html>`;

var parsedComplex = html.parse(complexHtml);
var sections = parsedComplex.document.getElementByClassName('section');

sections.forEach(function(section, index) {
  console.log(`Section ${index + 1}:`);
  section.children.forEach(function(child) {
    console.log(`  ${child.nodeName}:`, child.textContent);
  });
});
