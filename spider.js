const fs = require('fs');
const url = require('url');
const path = require('path');
const YAML = require('yaml');
const cheerio = require('cheerio');
const download = require('download');
const superagent = require('superagent');

async function downloadFile(src, dst) {
	fs.mkdirSync(path.dirname(dst), { recursive: true });
	if (!fs.existsSync(dst)) {
		console.log('downloadFile', src, dst);
		fs.writeFileSync(dst, await download(src));
	}
}

async function spiderPage(pageCurrent, cnt = 1) {
	const methods = {
		'http://www.gaokzx.com/': {
			titleSelector: '.page-content h1',
			imageSelector: '#content img',
		},
	};

	return await superagent
		.get(pageCurrent)
		.set('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.71 Safari/537.36')
		.then(function (res) {
			let method = null;
			Object.keys(methods).forEach(website => {
				if (pageCurrent.startsWith(website)) {
					method = methods[website];
				}
			});
			let $ = cheerio.load(res.text);
			let title = $(method.titleSelector).text().trim();
			let images = Array.from($(method.imageSelector)).map((element) => $(element).attr('src'));
			console.log(title, images);
			images.forEach((image, index) => {
				downloadFile(
					url.resolve(pageCurrent, image),
					path.join(__dirname, 'dist', title, cnt + (images.length == 1 ? '' : '.' + index) + path.extname(image))
				);
			});
			let pageNext = $('a.next').attr('href');
			if (pageNext !== '' && pageNext !== '#' && pageNext != pageCurrent) {
				spiderPage(url.resolve(pageCurrent, pageNext), cnt + 1);
			}
		});
}

function main() {
	const config = YAML.parse(fs.readFileSync(path.join(__dirname, './config.yml')).toString());
	config.links.forEach(link => {
		spiderPage(link);
	});
}

main();