class App
	constructor: ->
		@bindEvents()
		@setSlider()

	bindEvents: ->
		$('.btn-mobile-menu').on('click', @menuBtnClicked)
		$('.mobile-menu-bg').on('click', @menuBtnClicked)

	setSlider: ->
		$('#mainCarousel').owlCarousel(
			autoPlay : true,
			slideSpeed : 300,
			paginationSpeed : 400,
			singleItem : true,
			stopOnHover : false,
			lazyLoad :true
		)


	menuBtnClicked : (e) ->
		$('.mobile-menu-bg').toggleClass('show')
		$('.menu').toggleClass('show')
$ ->
	app = new App()