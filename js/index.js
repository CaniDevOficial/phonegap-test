
var app = {
	rspUrl: 'https://www.canidev.com/barcode/jsonrpc.php',
    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
		//document.addEventListener('DOMContentLoaded', this.onDeviceReady, false);
    },

    onDeviceReady: function() {
		/*var launchDemoButton = document.getElementById('demo');
		launchDemoButton.addEventListener('click', function() {
			app.demo();
			return false;
		});*/
		
		$.ajax({
			url 	: app.rspUrl,
			type	: 'POST',
			dataType: 'json',
			success	: function(data) {
				if(data.items)
				{
					$('.app').html('');

					var $table = $('<table></table>').appendTo('.app');
					
					$.each(data.items, function(i, row) {
						$table.append('<tr>' +
							'<td class="title">' + row.name + '<dfn>Ref: ' + row.ref + '</dfn></td>' +
							'<td class="ref">' + row.ref + '</td>' +
							'<td class="barcode"><canvas id="barcode-model-' + i + '"></canvas></td>' +
						'</tr>');
						
						JsBarcode('#barcode-model-' + i, row.ean, {
							fontSize: 11,
							lineColor: '#000',
							height: 35
						});
					});
				}
			},
			error	: function() {
				alert('Error de conexion');
			}
		});
	},
	
	/*demo: function() {
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
				torchOn: false, // Android, launch with the torch switched on (if available)
				prompt : "Place a barcode inside the scan area", // Android
				resultDisplayDuration: 0, // Android, display scanned text for X ms. 0 suppresses it entirely, default 1500
				formats : "EAN_13,CODE_39,CODE_128", // default: all but PDF_417 and RSS_EXPANDED
				disableAnimations : true, // iOS
				disableSuccessBeep: false // iOS and Android
			}
		);
    }*/
};

app.initialize();