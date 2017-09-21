const gulp = require('gulp');
const ts = require('gulp-typescript');
const gls = require('gulp-live-server');

const tsProject = ts.createProject('tsconfig.json');

gulp.task('scripts', () => {
	const tsResult = tsProject.src()
	.pipe(tsProject());
	return tsResult.js.pipe(gulp.dest('dist'));
});

gulp.task('watch', ['scripts'], () => {
	gulp.watch('src/**/*.ts', ['scripts']);
});

gulp.task('debug-server', [], () => {
    var server = gls.new(['dist/main.js', '--debug']);
    gulp.watch('dist/main.js', function() {
	server.start.bind(server)();
    });
});

gulp.task('dev-server', [], () => {
    var server = gls.new('dist/main.js');
    gulp.watch('dist/main.js', function() {
	server.start.bind(server)();
    });
});

gulp.task('default', ['watch', 'dev-server']);
gulp.task('debug', ['watch', 'debug-server']);
gulp.task('buildonce', ['scripts']);
