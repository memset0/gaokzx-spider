const fs = require('fs');
const rd = require('rd');
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
	let files = rd.readFileSync(dir);
	console.log(dir, files);

	let html = `<title>${path.basename(dir)}</title><style>body{margin: 0;}</style>`;
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
		html += img(path.relative(dir, file));
	})
	fs.writeFileSync(path.join(dir, 'index.html'), html);
}

listAll(path.join(__dirname, 'dist')).forEach(dir => {
	buildHtml(dir);
})