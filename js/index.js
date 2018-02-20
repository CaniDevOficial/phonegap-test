
var JSON_STATUS_ERROR		= 1,
	JSON_STATUS_SUCCESS		= 2;

// Convert form inputs into valid Javascript Object
$.fn.serializeObject = function(strip) {
	var form_data	= $(this).serializeArray(),
		new_data	= {};

	$.each(form_data, function(i, row) {
		var match = row.name.match(/(.*?)\[(\d+)?\]$/);
		
		if(match != null)
		{
			row.name 	= match[1];
			row.id		= (match[2]) ? $.jblockgets.intval(match[2]) : 0;
		}
	
		if(typeof strip === 'object' && $.inArray(row.name, strip) != -1)
		{
			return true;
		}

		if(match != null)
		{
			if(!new_data[row.name])
			{
				new_data[row.name] = [];
			}

			if(row.id)
			{
				new_data[row.name][row.id] = row.value;
			}
			else
			{
				new_data[row.name].push(row.value);
			}
		}
		else
		{
			new_data[row.name] = row.value;
		}
	});
	
	return new_data;
};

var app = {
	rspUrl: '**********/jsonrpc.php',
	currentBarcode: null,
    initialize: function() {
        //document.addEventListener('deviceready', this.onDeviceReady, false);
		document.addEventListener('DOMContentLoaded', this.onDeviceReady, false);
    },

    onDeviceReady: function() {
		$('.toolbar a').click(function(e) {
			e.preventDefault();
			
			var tabId 	= $(this).attr('data-tab'),
				method	= $(this).attr('data-method')
				tabDom	= $('#tab-' + tabId);

			// Hide all previous content
			$('.tab-content, .toolbar a').removeClass('active');
			
			if(!tabDom.length)
			{
				return false;
			}
			
			// Show current tab
			$(this).addClass('active');
			tabDom.addClass('active');
			
			// Do additional actions
			if(method && app[method] != undefined)
			{
				app[method].apply(app, [tabDom]);
			}
			
		});
		
		// Load first tab on load
		$('.toolbar li:first a').click();
	},
	
	bindSubmit: function(tabDom) {
		var $form = tabDom.children('form');

		$form.children('.submit-button')
			.off('click')
			.click(function(e) {
				e.preventDefault();

				app.send('add', $form.serializeObject(), function(data) {
					alert(data.message);
					$form.find('input').val('');
				});
			});
	},
	
	loadList: function(tabDom) {
		tabDom.html('');
		
		app.send('list', null, function(data) {
			if(data.items)
			{
				tabDom.html('<table></table>');

				var $table = tabDom.children('table');

				$.each(data.items, function(i, row) {
					$table.append('<tr data-id="' + row.id + '">' +
						'<td class="title">' +
							'<span>' + row.name + '</span>' +
							'<dfn>Ref: ' + row.ref + '</dfn>' +
							'<a href="#" class="row-delete" data-id="' + row.id + '"><i class="fa fa-trash"></i></a>' + 
						'</td>' +
						'<td class="barcode"><div class="barcode-model"><canvas id="barcode-model-' + row.id + '"></canvas></div></td>' +
					'</tr>');
					
					JsBarcode('#barcode-model-' + row.id, row.ean, {
						fontSize: 11,
						lineColor: '#000',
						height: 35
					});
				});
				
				tabDom.find('td.title > span').click(function(e) {
					e.preventDefault();
					
					if($(window).width() <= 600)
					{
						var $parent	= $(this).parent().parent(),
							$id		= $parent.attr('data-id'),
							delBtn	= $(this).siblings('.row-delete');
						
						if(app.currentBarcode == $id)
						{
							$parent.find('.barcode-model').slideUp();
							delBtn.hide();
							app.currentBarcode = null;
						}
						else
						{
							if(app.currentBarcode)
							{
								$('tr[data-id="' + app.currentBarcode + '"]').find('.barcode-model').hide();
								$('tr[data-id="' + app.currentBarcode + '"]').find('.row-delete').hide();
							}
							
							$parent.find('.barcode-model').slideDown();
							delBtn.show();
							app.currentBarcode = $id;
						}
					}
				});
				
				tabDom.find('.row-delete').click(function(e) {
					e.preventDefault();
					
					var $id = $(this).attr('data-id');
					
					if(confirm('¿Desea eliminar este producto?'))
					{
						app.send('delete', {'id': $id}, false, false);
						$('tr[data-id="' + app.currentBarcode + '"]').fadeOut();
					}
				});

				$(window)
					.off('resize.app')
					.on('resize.app', function() {
						if($(this).width() > 600)
						{
							$('.barcode-model').removeAttr('style');
						}
					});
			}
		});
	},
	
	send: function(action, additionalData, onSuccess, showLoading) {
		var data = {
			action	: action
		};
		
		if(additionalData)
		{
			data = $.extend(data, additionalData);
		}
		
		// Show loading image
		if(showLoading !== false)
		{
			$('body').append('<div class="loading"></div>');
		}

		$.ajax({
			url 	: app.rspUrl,
			data	: data,
			type	: 'POST',
			dataType: 'json',
			success	: function(response) {
				// Hide loading image
				$('.loading').remove();

				if(response.status != JSON_STATUS_SUCCESS)
				{
					alert(((response.message) ? response.message : 'Se ha producido un error'));
				}
				else if(typeof onSuccess === 'function')
				{
					onSuccess.apply(app, [response]);
				}
			},
			error	: function(ee) {
				alert('Error de conexion');
				console.log(ee);
			}
		});
	}
	
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