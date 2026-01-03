// Example 1: Parsing XML
var xml = require('movian/xml');

var xmlString = `
<root>
  <item id="1">
    <name>Item One</name>
    <value>10</value>
  </item>
  <item id="2">
    <name>Item Two</name>
    <value>20</value>
  </item>
</root>`;

var xmlDoc = xml.parse(xmlString);

// Accessing nodes
console.log('Root node:', xmlDoc.root.toString());
console.log('First item name:', xmlDoc.root.item[0].name);

// Example 2: Filtering nodes
var items = xmlDoc.root.filterNodes('item');
console.log('Number of items:', items.length);
items.forEach(function(item, index) {
  console.log(`Item ${index + 1}:`, item.name, item.value);
});

// Example 3: Working with attributes
var xmlWithAttributes = `
<data>
  <entry id="101" type="info">
    <content>Example content</content>
  </entry>
</data>`;

var parsedWithAttributes = xml.parse(xmlWithAttributes);
var entry = parsedWithAttributes.document.getElementByTagName('entry')[0];

console.log('Entry attributes:', entry.attributes);
console.log('Entry content:', entry.content);

// Example 4: Complex XML structure
var complexXml = `
<catalog>
  <product id="p1">
    <name>Product 1</name>
    <price>19.99</price>
    <categories>
      <category>Electronics</category>
      <category>Gadgets</category>
    </categories>
  </product>
  <product id="p2">
    <name>Product 2</name>
    <price>29.99</price>
    <categories>
      <category>Home</category>
    </categories>
  </product>
</catalog>`;

var parsedComplex = xml.parse(complexXml);
var products = parsedComplex.document.getElementByTagName('product');

products.forEach(function(product, index) {
  console.log(`Product ${index + 1}:`);
  console.log('  Name:', product.name);
  console.log('  Price:', product.price);
  console.log('  Categories:');
  product.getElementByTagName('category').forEach(function(category) {
    console.log('    -', category.textContent);
  });
});
