gulp                  = require('gulp'),
sass                  = require('gulp-sass'),
concat                = require('gulp-concat'),
plumber               = require('gulp-plumber'), //не установлено npm install --save-dev gulp-plumber
// для объединения файлов
sourcemaps = require('gulp-sourcemaps'), //не установлено npm install gulp-sourcemaps --save-dev
uglify                = require('gulp-uglifyjs'),
cssnano               = require('gulp-cssnano'),
rename                = require('gulp-rename'),
gulpif                = require('gulp-if'),  //не установлено   npm install gulp-if --save-dev
del                   = require('del'),
// для удаления файлов и папок
notify                = require("gulp-notify"), // не установлено  npm install gulp-notify --save-dev
growl                 = require('gulp-notify-growl'),  // не установлено
watch                 = require('gulp-watch'),       // не установлено   npm install --save-dev gulp-watch
imagemin              = require('gulp-imagemin'),
pngquant              = require('imagemin-pngquant'),
// для сжатия картинок в jpg и png соотвтственно
cache                 = require('gulp-cache'),
// плагин для кеширования уже сжатых картинок
autoprefixer          = require('gulp-autoprefixer'),
// автоматом подставляся префиксы
spritesmith           = require('gulp.spritesmith'), // не установлено
browserSync           = require('browser-sync').create();
// сщздание спрайтов с помощью gulp
var iconfont          = require('gulp-iconfont');     // не установлено
var runTimestamp      = Math.round(Date.now()/1000);            // не установлено
var realFavicon       = require ('gulp-real-favicon');         // не установлено
var fs                = require('fs');              // не установлено
// File where the favicon markups are stored
var FAVICON_DATA_FILE = 'faviconData.json';
var isDevelopmant = false; // переменная для работы с gulp-if
// когда делается билд поставить на false чтобы карта scss перестала отображатсья

gulp.task('sass', function () {
	return gulp.src('app/scss/**/*.+(scss|sass|css)')
	.pipe(plumber({
		errorHandler: notify.onError({
            message: function(error) {
                return error.message;
            }})
	}))
    .pipe(gulpif(isDevelopmant, sourcemaps.init()))
    .pipe(sass())
    .pipe(autoprefixer(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], {cascade:true}))
	 .pipe(cssnano())
	 .pipe(rename({suffix: '.min'}))
    .pipe(gulpif(isDevelopmant, sourcemaps.write()))
    .pipe(gulp.dest('app/css'))
    .pipe(browserSync.stream());
});

gulp.task('css-libs', ['sass'], function () {
	return gulp.src('app/css/libs.css')
	.pipe(cssnano())
	.pipe(rename({suffix: '.min'}))
	.pipe(gulp.dest('app/css'))
	.pipe(browserSync.stream());
});

gulp.task('scripts', function () {
	return gulp.src([
		'app/libs/jquery/jquery1.11.1.min.js',
		'app/libs/magnific-popup/jquery.magnific-popup.min.js',
		// 'app/libs/owlcarousel/owl.carousel.min.js',
		'app/libs/jquery/equalHeights.min.js',
		'app/libs/jquery/jquery.PageScroll2id.min.js',
		'app/libs/jquery/jquery.nicescroll.min.js',
		'app/libs/swiper.min.js',
		'app/libs/jquery/common.js',
		])
	.pipe(concat('libs.min.js'))
	// .pipe(uglify())
	.pipe(gulp.dest('app/js'))
	.pipe(browserSync.stream());
});

gulp.task('browser-sync', ['scripts', 'css-libs'],  function(){
	browserSync.init({
		server:{
			baseDir:'./app'
		},
		// open:true,
		notify:false
	});
});
// таск для того чтобы удалять папку dist чтобы перед сборкорй все удалялось
gulp.task('clean', function(){
return del.sync('dist');
});
gulp.task('del-commons', function () {
 return (del.sync('app/js/common.min.js'));
});

// таск для того чтобы очишвть кеш картинок(запускать в ручную)
gulp.task('clear', function () {
    return cache.clearAll();
});

gulp.task('img', function(){
return gulp.src('app/images/**/*')
 // кеширования и минимизация
.pipe(cache(imagemin({
	intarlaced:true,
	progresive:true,
	svgoPlugins: [{removeViewbox:false}],
	use:[pngquant()],
	  optimizationLevel: 3 //степень сжатия от 0 до 7
})))
.pipe(gulp.dest('dist/images'));
});

gulp.task('watch', function(){
gulp.watch('app/scss/**/*.scss', ['sass']);
gulp.watch('app/libs/**/*.js', ['scripts']);
gulp.watch('app/js/*.js').on("change", browserSync.reload);
gulp.watch('app/*.html').on('change', browserSync.reload);
});
gulp.task('default', ['browser-sync', 'watch']);



// сборка проекта
gulp.task('build', ['clean', 'img', 'css-libs', 'scripts'], function(){

var buildCss = gulp.src(['app/css/libs.min.css','app/css/main.min.css',])
.pipe(concat('libs.min.css'))
.pipe(gulp.dest('dist/css'));

var buildfonts = gulp.src('app/fonts/**/*')
.pipe(gulp.dest('dist/fonts'));

var buildJs = gulp.src('app/js/**/*')
.pipe(gulp.dest('dist/js'));

var buildHtml = gulp.src('app/*.html')
.pipe(gulp.dest('dist/'));

var buildhtml5shiv = gulp.src('app/libs/html5shiv/**/*')
.pipe(gulp.dest('dist/libs/html5shiv'));

});


// отдельные задачи
gulp.task('commons', function () {
	return gulp.src('app/libs/jquery/common.js')
	 .pipe(jshint()) //прогоним через jshint
        .pipe(jshint.reporter('jshint-stylish')) //стилизуем вывод ошибок в консоль
	// .pipe(uglify())
	 .pipe(rename({suffix: '.min'}))
	.pipe(gulp.dest('app/js'))
.pipe(browserSync.reload({stream: true}));
});

// ниже размещена команда для ручного создания спрайтов
gulp.task('sprite', function () {
  var spriteData = gulp.src('app/sprites/*.png').pipe(spritesmith({
    imgName: 'sprite.png',
    cssName: '_sprite.css',
    padding: 120,
    algorithm:'top-down',
    cssTemplate: 'app/sprites.handlebars'

  }));
    spriteData.img.pipe(gulp.dest('app/images/')); // путь, куда сохраняем картинку
    spriteData.css.pipe(gulp.dest('app/sprites/')); // путь, куда сохраняем стили
});


// работает для не битых файлов svg если не работает скрипт - замети файл
gulp.task('Iconfont', function(){
  return gulp.src(['app/iconsFon/*.svg'])
    .pipe(iconfont({
      fontName: 'myfont', // required
      fontHeight: 1001,
      normalize:true,
      prependUnicode: true, // recommended option
      formats: ['ttf', 'eot', 'woff'], // default, 'woff2' and 'svg' are available
      timestamp: runTimestamp, // recommended to get consistent builds when watching files
    }))
      .on('glyphs', function(glyphs, options) {
        // CSS templating, e.g.
        console.log(glyphs, options);
      })
    .pipe(gulp.dest('app/iconsFon/'));
});





// Generate the icons.
gulp.task('generate-favicon', function(done) {
    realFavicon.generateFavicon({
        masterPicture: 'app/favicon/basic.png',
        dest: 'app/images/favicon/',
        iconsPath: 'favicon',
        design: {
            ios: {
                pictureAspect: 'backgroundAndMargin', //Add a solid, plain background to fill the transparent regions.
                backgroundColor: '#ffffff',
                margin: '14%',
                assets: {
                    ios6AndPriorIcons: false,
                    ios7AndLaterIcons: false,
                    precomposedIcons: false,
                    declareOnlyDefaultIcon: true
                }
            },
            desktopBrowser: {},
            windows: {
                pictureAspect: 'whiteSilhouette', //Use a white silhouette version of the favicon
                backgroundColor: '#da532c',
                onConflict: 'override',
                assets: {
                    windows80Ie10Tile: false,
                    windows10Ie11EdgeTiles: {
                        small: false,
                        medium: true,
                        big: false,
                        rectangle: false
                    }
                }
            },
            androidChrome: {
                pictureAspect: 'noChange',
                themeColor: '#da532c',
                manifest: {
                    display: 'standalone',
                    orientation: 'notSet',
                    onConflict: 'override',
                    declared: true
                },
                assets: {
                    legacyIcon: false,
                    lowResolutionIcons: false
                }
            },
            safariPinnedTab: {
                pictureAspect: 'silhouette',
                themeColor: '#da532c'
            }
        },
        settings: {
            scalingAlgorithm: 'Mitchell',
            errorOnImageTooSmall: false
        },
        markupFile: FAVICON_DATA_FILE
    }, function() {
        done();
    });
});

// Inject the favicon markups in your HTML pages.
gulp.task('inject-favicon-markups', function() {
    return gulp.src(['app/*.html'])
        .pipe(realFavicon.injectFaviconMarkups(JSON.parse(fs.readFileSync(FAVICON_DATA_FILE)).favicon.html_code))
        .pipe(gulp.dest('app'));
});

// Check for updates on RealFaviconGenerator
gulp.task('check-for-favicon-update', function(done) {
    var currentVersion = JSON.parse(fs.readFileSync(FAVICON_DATA_FILE)).version;
    realFavicon.checkForUpdates(currentVersion, function(err) {
        if (err) {
            throw err;
        }
    });
});