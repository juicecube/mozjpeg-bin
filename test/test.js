'use strict';

var binCheck = require('bin-check');
var BinBuild = require('bin-build');
var compareSize = require('compare-size');
var execFile = require('child_process').execFile;
var fs = require('fs');
var mkdir = require('mkdirp');
var path = require('path');
var rm = require('rimraf');
var test = require('ava');
var tmp = path.join(__dirname, 'tmp');

test('rebuild the mozjpeg binaries', function (t) {
	t.plan(3);

	var cfg = [
		'autoreconf -fiv && ./configure --disable-shared',
		'--prefix="' + tmp + '" --bindir="' + tmp + '"',
		'--libdir="' + tmp + '"'
	].join(' ');

	var builder = new BinBuild()
		.src('https://github.com/mozilla/mozjpeg/archive/v2.1.tar.gz')
		.cmd(cfg)
		.cmd('make && make install');

	builder.build(function (err) {
		t.assert(!err);

		fs.exists(path.join(tmp, 'jpegtran'), function (exists) {
			t.assert(exists);

			rm(tmp, function (err) {
				t.assert(!err);
			});
		});
	});
});

test('return path to binary and verify that it is working', function (t) {
	t.plan(3);

	var args = [
		'-outfile', path.join(tmp, 'test.jpg'),
		path.join(__dirname, 'fixtures/test.jpg')
	];

	mkdir(tmp, function (err) {
		t.assert(!err);

		binCheck(require('../').path, args, function (err, works) {
			t.assert(!err);
			t.assert(works);
		});
	});
});

test('minify a JPG', function (t) {
	t.plan(6);

	var src = path.join(__dirname, 'fixtures/test.jpg');
	var dest = path.join(tmp, 'test.jpg');
	var args = [
		'-outfile', dest,
		src
	];

	mkdir(tmp, function (err) {
		t.assert(!err);

		execFile(require('../').path, args, function (err) {
			t.assert(!err);

			compareSize(src, dest, function (err, res) {
				t.assert(!err);
				t.assert(res[dest] < res[src]);

				rm(tmp, function (err) {
					t.assert(!err);
				});
			});
		});
	});
});
