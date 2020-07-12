const fs = require('fs');
const url = require('url');
const path = require('path');
const YAML = require('yaml');
const cheerio = require('cheerio');
const superagent = require('superagent');

async function downloadFile(src, dst) {
	console.log('download', src, dst);
	return await superagent
		.get(src)
		.then(function (res) {
			fs.writeFileSync(dst, res.body, 'binary');
		});
}

async function spiderPage(pageCurrent) {
	return await superagent
		.get(pageCurrent)
		.then(function (res) {
			let $ = cheerio.load(res.body);

			let title = $('.page-content h1').text().trim();
			let image = $('#content .center img').attr('src');

			downloadFile(
				url.resolve(pageCurrent, image),
				path.join(__dirname, 'dist', title, path.basename(url, path.extname(url)) + path.extname(image))
			);

			let pageNext = $('a.next').href();
			if (pageNext !== '' && pageNext !== '#') {
				spiderPage(pageNext);
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