
var JSON_STATUS_ERROR		= 1,
	JSON_STATUS_SUCCESS		= 2;
	
(function($) {
	'use strict';
	
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
	
		// Bind barcode reader button
	$.fn.barcodeReader = function(onComplete) {
		$(this)
			.off('click')
			.click(function(e) {
				e.preventDefault();
				
				var target = $(this);

				cordova.plugins.barcodeScanner.scan(
					function(result) {
						if(typeof onComplete === 'function')
						{
							onComplete.call(target, result);
						}
					},
					function(error) {
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
			});
	};
	
	$.fn.locationKeyboard = function() {
		var checkLevel;
		
		var rexExpAry = {
			'simple'	: /^[1-4]([A-Z]|([A-Z]([1-9]|[1-2][0-9]|3[0-4])[A-Z]?))?$/,
			'full'		: /^[1-4][A-Z]([1-9]|[1-2][0-9]|3[0-4])[A-Z]?$/
		};

		$(this)
			.off('click focus')
			.prop('readonly', true)
			.on({
				focus : function(e) {
					e.preventDefault();
					e.stopPropagation();
				},
				
				click: function(e) {
					e.preventDefault();
					
					$(this).blur();
					
					app.closeDialog();
	
					var tpl 		= app.template.get('location-keyboard', null, true).appendTo('body'),
						target		= $(this),
						keyboard	= tpl.find('.keyboard-buttons');
						
					checkLevel = $(this).attr('data-check') || 'full';
					
					// Append number buttons
					for(var i = 0; i < 10; i++)
					{
						keyboard.append('<button class="btn" data-action="char">' + i + '</button>');
					}
					
					// Append letter buttons
					keyboard.append('<br /><br />');
					
					var s = String('a').charCodeAt(0),
						e = String('l').charCodeAt(0);

					for(; s <= e; ++s)
					{
						var charCode = String.fromCharCode(s).toUpperCase();
						keyboard.append('<button class="btn" data-action="char">' + charCode + '</button>');
					}
					
					tpl.find('button').click(function(e) {
						e.preventDefault();
						
						switch($(this).attr('data-action'))
						{
							case 'char':
								insertChar($(this).text());
							break;
							
							case 'backspace':
								insertChar(8);
							break;
							
							case 'submit':
								var resultDom = $('#keyboard-result')
								
								if(resultDom.is('.error') || !resultDom.val())
								{
									return false;
								}

								target.val(resultDom.val());
							
							// no break
							
							case 'close':
								app.closeDialog();
							break;
						}
					});
				}
			});
			
		function insertChar(charCode)
		{
			var resultDom 	= $('#keyboard-result'),
				currentVal	= resultDom.val(),
				rexExp		= (rexExpAry[checkLevel]) ? rexExpAry[checkLevel] : rexExpAry.full;

			if(charCode === 8)
			{
				// BackSpace
				resultDom.val(currentVal.slice(0, -1));
			}
			else
			{
				// Normal Character
				resultDom.val(currentVal + charCode)
			}
			
			resultDom.removeClass('error');

			if(resultDom.val() && !rexExp.test(resultDom.val()))
			{
				resultDom.addClass('error');
			}
		}
	};
	
	$.fn.objView = function(state) {
		var method = (state) ? 'removeClass' : 'addClass';
		$(this)[method].apply($(this), ['hidden']);
	};
})(jQuery);

var app = {
	rspUrl				: 'https://www.canidev.com/juguettos/jsonrpc.php',
	//rspUrl				: 'http://localhost/barcode/jsonrpc.php',
	currentBarcode		: null,
	historyController	: {},
	listParams			: {},

    initialize: function() {
        //document.addEventListener('deviceready', this.onDeviceReady, false);
		document.addEventListener('DOMContentLoaded', this.onDeviceReady, false);
    },

    onDeviceReady: function() {
		// Bind tabs and see first on app load
		$('.toolbar a')
			.click(function(e) {
				e.preventDefault();

				var method = $(this).attr('data-method');
					
				switch(method)
				{
					case 'history':
						if(app.historyController.tab)
						{
							app.setContent(app.historyController.tab, false);
							$('.app').scrollTop(app.historyController.scrollTop);
						}

						$('.history-trigger').objView(false);
					break;
					
					case 'filter':
						var tpl = app.template.get('filter-menu', null, true).appendTo('body');
						
						tpl.find('input[name="order"][value="' + app.listParams.order + '"]').prop('checked', true);
						
						tpl.find('button[data-action="close"]').click(function(e) {
							e.preventDefault();
							app.closeDialog();
						});
						
						tpl.find('input[name="order"]').change(function() {
							app.closeDialog();
							
							app.listParams.order	= $(this).val();
							app.listParams.start	= 0;
							
							app.loadList($('.tab-content.active'), {
								params		: app.listParams
							});
						});
					break;
					
					default:
						var tabId 	= $(this).attr('data-tab'),
							tabDom	= $('#tab-' + tabId);

						// Hide all previous content
						$('.tab-content, .toolbar a').removeClass('active');
						
						if(!tabDom.length)
						{
							return false;
						}
						
						// Remove history
						app.clearHistory();
						
						// Show current tab
						$(this).addClass('active');
						
						app.setContent(tabDom);
						
						// Do additional actions
						if(method && app[method] != undefined)
						{
							app[method].apply(app, [tabDom]);
						}
					break;
				}
			})
			.filter('[data-tab]:first').click();
			
		$('.js-show-more').click(function(e) {
			e.preventDefault();

			app.loadList($('#tab-list'), {
				params		: app.listParams,
				overwrite	: false
			});
		});
	},
	
	add: function(tabDom) {
		var $form = tabDom.children('form');

		tabDom.find('.js-ean-input').barcodeReader(function(result) {
			var input 		= $(this).siblings('input'),
				tabIndex	= parseInt(input.attr('tabindex')) + 1;

			input.val(result.text);
			tabDom.find('input[tabindex="' + tabIndex + '"]').focus();
		});
		
		tabDom.find('[name="location"]').locationKeyboard();

		$form.children('.submit-button')
			.off('click')
			.click(function(e) {
				e.preventDefault();
				
				var params = $form.serializeObject();
				
				params.submit = 1;

				app.send('add', params, function(data) {
					alert(data.message);
					$form.find('input').val('');
				});
			});
	},
	
	search: function(tabDom) {
		var $form 	= tabDom.children('form'),
			self	= this;
		
		tabDom.find('.js-ean-input').barcodeReader(function(result) {
			var input = $(this).siblings('input');

			input.val(result.text);
			tabDom.find('.submit-button').click();
		});
		
		tabDom.find('[name="location"]').locationKeyboard();
		
		$form.children('.submit-button')
			.off('click')
			.click(function(e) {
				e.preventDefault();
				
				var listDom	= $('#tab-list'),
					params	= $form.serializeObject();
					
				app.setHistory(tabDom);

				// Execute search
				self.loadList(listDom, {
					params		: params
				});
			});
	},
	
	loadList: function(tabDom, customOptions) {
		var defaultOptions = {
			params		: null,
			overwrite	: true
		};
		
		var options = $.extend({}, defaultOptions, customOptions);

		app.send('list', options.params, function(data) {
			if(!tabDom.is('.active'))
			{
				app.setContent(tabDom);
			}
			
			var listContent = tabDom.children('.inner');
			
			if(options.overwrite)
			{
				listContent.html('');
			}

			if(data.items && data.items.length)
			{
				$.each(data.items, function(i, row) {
					listContent.append(app.template.get('item-row', row));
					
					JsBarcode('#barcode-model-' + row.id, row.ean, {
						fontSize: 11,
						lineColor: '#000',
						height: 35
					});
				});
				
				app.bindItemRows(tabDom);
				
				$('.filter-trigger').objView(true);
				
				app.listParams = data.params;

				$(window)
					.off('resize.app')
					.on('resize.app', function() {
						if($(this).width() > 600)
						{
							$('.barcode-model').removeAttr('style');
							$('td.title').removeClass('active');
						}
					});
			}
			else
			{
				listContent.append('<div class="message">' + (data.message || 'No hay elementos para mostrar') + '</div>');
			}
			
			if(data.params.haveMore)
			{
				tabDom.find('.js-show-more').objView(true);
			}
			else
			{
				tabDom.find('.js-show-more').objView(false);
			}
		});
	},
	
	stateList: function(tabDom) {
		app.loadList(tabDom, {
			params	: { legible: 0 }
		});
	},
	
	setContent: function(tab, clear) {
		var dom = (typeof tab === 'string') ? $('#tab-' + tab) : tab;

		// Hide all previous content
		$('.tab-content').removeClass('active');
		$('.filter-trigger').objView(false);
		app.listParams = {};
		
		// Clear input fields
		if(clear !== false)
		{
			dom.find('input').val('');
		}

		// Show tab
		dom.addClass('active');
		
		return dom;
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
	},
	
	bindItemRows: function(tabDom) {
		tabDom.find('.row-title > span, .row-actions a').off('click');

		tabDom.find('.row-title > span').click(function(e) {
			e.preventDefault();
			
			if($(window).width() <= 600)
			{
				var $parent	= $(this).parent().parent(),
					$id		= $parent.attr('data-id');
				
				if(app.currentBarcode == $id)
				{
					$parent.find('.row-barcode').slideUp();
					$(this).parent().removeClass('active');
					app.currentBarcode = null;
				}
				else
				{
					if(app.currentBarcode)
					{
						$('.row[data-id="' + app.currentBarcode + '"]').find('.row-barcode').hide();
						$('.row[data-id="' + app.currentBarcode + '"]').children('.row-title').removeClass('active');
					}
					
					$parent.find('.row-barcode').slideDown();
					$(this).parent().addClass('active');
					app.currentBarcode = $id;
				}
			}
		});
		
		tabDom.find('.row-actions a').click(function(e) {
			e.preventDefault();
			
			var row = $(this).closest('.row'),
				$id = row.attr('data-id');
			
			switch($(this).attr('data-action'))
			{
				case 'delete':
					if(confirm('¿Desea eliminar este producto?'))
					{
						app.send('delete', {'id': $id}, false, false);
						$('.row[data-id="' + app.currentBarcode + '"]').fadeOut();
					}
				break;
				
				case 'edit':
					app.send('edit', {'id': $id}, function(resp) {
						app.setHistory(tabDom);
						
						var newTab = app.setContent('item');
						
						$.each(resp.items[0], function(key, value) {
							newTab.find('[name="' + key + '"]').val(value);
						});
						
						newTab.find('.js-ean-input').barcodeReader(function(result) {
							var input 		= $(this).siblings('input'),
								tabIndex	= parseInt(input.attr('tabindex')) + 1;

							input.val(result.text);
							newTab.find('input[tabindex="' + tabIndex + '"]').focus();
						});
						
						newTab.find('.submit-button')
							.off('click')
							.click(function(e) {
								e.preventDefault();
								
								var params = newTab.find('form').serializeObject();
								
								params.submit	= 1;
								params.id		= $id;

								app.send('edit', params, function(data) {
									var row = data.items[0];

									app.clearHistory();
									tabDom = app.setContent('list');
									
									// Replace data in list
									$('[data-id="' + row.id + '"]').replaceWith(app.template.get('item-row', row));
			
									JsBarcode('#barcode-model-' + row.id, row.ean, {
										fontSize: 11,
										lineColor: '#000',
										height: 35
									});
									
									app.bindItemRows(tabDom);
								});
							});

						newTab.find('[name="location"]').locationKeyboard();
					});
				break;
				
				case 'state':
					app.send(
						'state',
						{
							id		: $id,
							state	: (row.attr('data-legible') == 'yes') ? 0 : 1
						}, 
						function(resp) {
							row.attr('data-legible', resp.items[0].legibleStr);
						}
					);
				break;
			}
		});
	},
	
	closeDialog: function() {
		$('.dialog-overlay').fadeOut('fast', function() {
			$(this).remove();
		});
	},
	
	clearHistory: function() {
		this.historyController = {};
		$('.history-trigger').objView(false);
	},
	
	setHistory: function(controllerID) {
		this.historyController = {
			tab 		: controllerID,
			scrollTop	: $('.app').scrollTop()
		};
		
		$('.history-trigger').objView(true);
	},
	
	// Template methods
	template: {
		get: function(template, data, rtnObj) {
			var tpl = $('script[id="tpl-' + template + '"]').html();

			tpl = this.parse(tpl, data);

			return (rtnObj) ? $(tpl) : tpl;
		},
		
		parse: function(input, data) {
			if(!input || !data || typeof data !== 'object')
			{
				return input;
			}

			return input.replace(/%([a-zA-Z]+)%/g, function(x, p1) {
				return (data[p1] !== undefined) ? data[p1] : '';
			});
		}
	}
};

app.initialize();