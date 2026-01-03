// Example 1: Showing a simple popup
var popup = require('movian/popup');

popup.notify('Hello World!', 3000, 'info');

// Example 2: Showing a popup with custom icon
popup.notify('Operation completed', 5000, 'success');

// Example 3: Handling user interaction
popup.confirm('Are you sure you want to delete this item?', function(result) {
  if (result) {
    console.log('User confirmed');
    // Perform deletion
  } else {
    console.log('User cancelled');
  }
});

// Example 4: Custom popup with options
popup.show({
  title: 'Custom Popup',
  message: 'This is a custom popup with options',
  buttons: ['OK', 'Cancel'],
  callback: function(buttonIndex) {
    if (buttonIndex === 0) {
      console.log('OK clicked');
    } else {
      console.log('Cancel clicked');
    }
  }
});

// Example 5: Error popup
popup.error('An error occurred while processing your request');
