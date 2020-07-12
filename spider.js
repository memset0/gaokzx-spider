const fs = require('fs');
const url = require('url');
const path = require('path');
const YAML = require('yaml');
const cheerio = require('cheerio');
const download = require('download');
const superagent = require('superagent');

async function downloadFile(src, dst) {
	fs.mkdirSync(path.dirname(dst), { recursive: true });
	fs.writeFileSync(dst, await download(src));
}

async function spiderPage(pageCurrent) {
	return await superagent
		.get(pageCurrent)
		.set('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.71 Safari/537.36')
		.then(function (res) {
			let $ = cheerio.load(res.text);

			let title = $('.page-content h1').text().trim();
			let image = $('#content img').attr('src');
			console.log(title, image);

			downloadFile(
				url.resolve(pageCurrent, image),
				path.join(__dirname, 'dist', title, path.basename(pageCurrent, path.extname(pageCurrent)) + path.extname(image))
			);

			let pageNext = $('a.next').attr('href');
			if (pageNext !== '' && pageNext !== '#') {
				spiderPage(url.resolve(pageCurrent, pageNext));
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