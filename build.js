const fs = require('fs');
const rd = require('rd');
const pdf = require('html-pdf');
const path = require('path');
const images = require('images');

function listAll(dir) {
	let pure = rd.readDirSync(dir);
	let result = [];
	pure.forEach(thisDir => {
		let flag = true;
		pure.forEach(thatDir => {
			if (thisDir != thatDir && thatDir.startsWith(thisDir)) {
				flag = false;
			}
		});
		if (flag) {
			result.push(thisDir);
		}
	})
	return result;
}

function buildHtml(dir) {
	let title = path.basename(dir);
	let files = rd.readFileSync(dir);
	console.log(dir, files);

	let html = `<title>${title}</title><style>body{margin: 0;}</style>`;
	let img = src => (`<img src="${src}" style="width: 80%; display: block; margin: auto;"/>`);
	let divider = '<div style="width: 0; height: 0; page-break-after: always;"></div>';

	let sum = 0;
	let limit = 1.5;
	files.forEach(file => {
		let extname = path.extname(file);
		if (extname != '.jpg' && extname != '.jpeg' && extname != '.png') {
			return;
		}
		let width = images(file).width() / .8;
		let height = images(file).height();
		console.log(file, width, height, sum, sum + height / width);
		if (sum && sum + height / width > limit) {
			sum = 0;
			html += divider;
		}
		sum += height / width;
		html += img('file://' + file);
	})
	fs.writeFileSync(path.join(dir, title + '.html'), html);
	pdf.create(html, {
		border: {
			top: '10mm',
			bottom: '5mm',
			right: '10mm',
			left: '10mm',
		},
		header: {
			height: '5mm',
			contents: `<div style="font-size: 10px; text-align: center">${title}（{{page}} / {{pages}}）@memset0.</div>`
		}
	}).toFile(path.join(dir, title + '.pdf'), function (err, res) {
		console.log(res.filename);
	});
}

listAll(path.join(__dirname, 'dist')).forEach(dir => {
	buildHtml(dir);
})