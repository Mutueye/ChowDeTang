class App
	constructor: ->
		@bindEvents()

	bindEvents: ->
		$('.btn-mobile-menu').on('click', @menuBtnClicked)
		$('.mobile-menu-bg').on('click', @menuBtnClicked)

	menuBtnClicked : (e) ->
		$('.mobile-menu-bg').toggleClass('show')
		$('.menu').toggleClass('show')
$ ->
	app = new App()