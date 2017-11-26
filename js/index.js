
var app = {
    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },

    onDeviceReady: function() {
		var launchDemoButton = document.getElementById('demo');
		launchDemoButton.addEventListener('click', function() {
			app.demo;
			return false;
		});
	},
	
	demo: function() {
		cordova.plugins.barcodeScanner.scan(
			function (result) {
				alert("We got a barcode\n" +
				"Result: " + result.text + "\n" +
				"Format: " + result.format + "\n" +
				"Cancelled: " + result.cancelled);
			},
			function (error) {
				alert("Scanning failed: " + error);
			},
			{
				preferFrontCamera : false, // iOS and Android
				showFlipCameraButton : true, // iOS and Android
				showTorchButton : true, // iOS and Android
				torchOn: true, // Android, launch with the torch switched on (if available)
				prompt : "Place a barcode inside the scan area", // Android
				resultDisplayDuration: 500, // Android, display scanned text for X ms. 0 suppresses it entirely, default 1500
				formats : "EAN_13,CODE_39,CODE_128", // default: all but PDF_417 and RSS_EXPANDED
				disableAnimations : true, // iOS
				disableSuccessBeep: false // iOS and Android
			}
		);
    }
};

app.initialize();