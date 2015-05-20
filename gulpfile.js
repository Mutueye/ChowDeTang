var fs = require('fs');
var path = require('path');

var gulp = require('gulp');
var gutil = require('gulp-util');
var duration = require('gulp-duration');
var plumber = require('gulp-plumber');
var source = require('vinyl-source-stream')
var streamify = require('gulp-streamify')

var http = require('http');
var connect = require('connect');
var serveStatic = require('serve-static');
var lr = require('tiny-lr');
var injectLr = require('connect-livereload');

var jade = require('gulp-jade');
var stylus = require('gulp-stylus');
var uglify = require('gulp-uglify');
var prefix = require('gulp-autoprefixer');

var browserify = require('browserify');
var watchify = require('watchify');
var coffeeify = require('coffeeify');
var jadeify = require('browserify-jade').jade({pretty: false});

var through = require('through');

var APP_NAME = 'webapp';
var APP_PORT = 8080;
var LR_PORT = 35729;


// Utility
//--------------------------------------------------------------------------------------------------

function setDest(subfolder) {
	if(subfolder)
		return './build/' + APP_NAME + '/' + subfolder;
	else
		return './build/' + APP_NAME + '/';
}

function handleError(error, callback) {
	gutil.log(error);
	if(callback) {
		callback()
	}
}

function finished(count, callback) {
	var completedNum = 0;
	return function() {
		if(++completedNum === count) {
			callback()
		}
	}
}

function run(callback) {
	return through(write, end);

	function write(buf) {
		this.queue(buf);
	};

	function end() {
		if(callback) {
			callback();
		}
		this.queue(null);
	}
}

// set the first letter to upercase
function ucfirst(s) {
	return s.slice(0, 1).toUpperCase() + s.substr(1);
}

// Browserify
//--------------------------------------------------------------------------------------------------
function bundle(callback) {
	var file = './src/apps/' + APP_NAME + '/index.coffee';

	watchify(browserify(file))
		.transform(coffeeify)
		.on('update', function() {
			var done = finished(3, function() {
				triggerLr('all');
				gutil.log('lrTriggered');
			});
			template(done);
			bundle(done);
			style(done);
		})
		.bundle()
		.on('error', handleError)
		.pipe(source('app.js'))
		.pipe(duration('Bundling app "' + APP_NAME + '"'))
			.on('end', function() {
			console.log(ucfirst(APP_NAME) + ' is ready on http://localhost:' + APP_PORT);
		})
		.pipe(gulp.dest(setDest('js')))
		.pipe(run(callback))
}


// Template
//--------------------------------------------------------------------------------------------------

function template(callback) {
	var base = './src/apps/' + APP_NAME;

	gulp.src(base + '/*.jade')
		.pipe(plumber())
		.pipe(jade({pretty: true}))
		.pipe(duration('Compiling Jade for app "' + APP_NAME + '"'))
		.pipe(gulp.dest(setDest()))
		.pipe(run(callback));
}

// Style
//--------------------------------------------------------------------------------------------------

function style(callback) {
	var base = './src/apps/' + APP_NAME;

	gulp.src(base + '/index.styl', { base: base })
		.pipe(plumber())
		.pipe(stylus())
		.pipe(prefix('last 2 versions', { cascade: true }))
		.pipe(duration('Compiling Stylus for app "' + APP_NAME + '"'))
		.pipe(gulp.dest(setDest()))
		.pipe(run(callback));
}


// Static
//--------------------------------------------------------------------------------------------------

function copyStatic(callback) {
	var base = './src/static';
	gulp.src(base + '/**/*', { base: base })
		.pipe(plumber())
		.pipe(gulp.dest(setDest()))
		.pipe(duration('Copying static files for app "' + APP_NAME + '"'))
		.pipe(run(callback));
}


// Serve
//--------------------------------------------------------------------------------------------------

function serve(callback) {
	var root = './build/' + APP_NAME;
	var app = connect()
		.use(injectLr({ port: LR_PORT}))
		.use(serveStatic(root))

	var server = http.createServer(app);
	server.listen(APP_PORT, function(err) {
		if(err) {
			return handleError(err, callback);
		}
		gutil.log('Serving app "' + APP_NAME + '" on port: ' + APP_PORT);
		if(callback) {
			callback();
		}
	});
}

// Watch
//--------------------------------------------------------------------------------------------------

function watchChange() {
	watchStylus();
	watchJade();
}

function watchStylus() {
	var files = [
		'./src/apps/' + APP_NAME + '/**/*.styl',
		'./src/apps/*.styl',
		'./src/components/**/*styl'
	];
	gulp.watch(files, function() {
		style(function() {
			triggerLr('css');
		});
	});
}

function watchJade() {
	var files = [
		'./src/apps/' + APP_NAME + '/*.jade',
		'./src/components/**/*.jade'
	];
	gulp.watch(files, function() {
		template(function() {
			triggerLr('all');
		});
	});
}


// LiveReload
//--------------------------------------------------------------------------------------------------

function startLr(callback){
	lrServer = lr().listen(LR_PORT, function(err) {
		if(err) {
			return handleError(err, callback);
		}
		gutil.log('Livereload for app "' + APP_NAME + '" on port: ' + LR_PORT);
		if(callback && typeof(callback) === 'function') {
			callback();
		}
	});
}

function triggerLr(type) {
	var query = '';
	if(type === 'all') {
		query = 'files=index.html';
	}
	if(type === 'css') {
		query = 'files=index.css';
	}
	http.get('http://127.0.0.1:' + LR_PORT + '/changed?' + query);
}



// Custom tasks
//--------------------------------------------------------------------------------------------------

/* Build app */
gulp.task('build', function() {
	template();
	bundle();
	style();
	copyStatic();
});

/* Serve an app */
gulp.task('serve', function() {
	watchChange();
	startLr();
	serve();
});


gulp.task('default', ['build', 'serve']);

