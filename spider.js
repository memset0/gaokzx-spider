const fs = require('fs');
const url = require('url');
const path = require('path');
const YAML = require('yaml');
const cheerio = require('cheerio');
const download = require('download');
const superagent = require('superagent');

const config = YAML.parse(fs.readFileSync(path.join(__dirname, './config.yml')).toString());

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
			selector: {
				title: '.page-content h1',
				image: '#content img',
				next: 'a.next',
			}
		},
		'https://news.koolearn.com': {
			selector: {
				title:'.xqy_core_tit',
				image:'.xqy_core_text img',
				next:'#page a:last-child',
			},
		}
	};

	return await superagent
		.get(pageCurrent)
		.set('user-agent', config.ua)
		.then(function (res) {
			let method = null;
			Object.keys(methods).forEach(website => {
				if (pageCurrent.startsWith(website)) {
					method = methods[website];
				}
			});
			let $ = cheerio.load(res.text);
			let title = $(method.selector.title).text().trim();
			let images = Array.from($(method.selector.image)).map((element) => $(element).attr('src'));
			console.log(title, images);
			images.forEach((image, index) => {
				downloadFile(
					url.resolve(pageCurrent, image),
					path.join(__dirname, 'dist', title, cnt + (images.length == 1 ? '' : '.' + index) + path.extname(image))
				);
			});
			let pageNext = $(method.selector.next).attr('href');
			if (pageNext && pageNext !== '#' && pageNext != pageCurrent) {
				spiderPage(url.resolve(pageCurrent, pageNext), cnt + 1);
			}
		});
}

function main() {
	config.links.forEach(link => {
		spiderPage(link);
	});
}

main();