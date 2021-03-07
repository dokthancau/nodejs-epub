const rp = require("request-promise");
const cheerio = require("cheerio");
const fs = require("fs");

const dataBook = {
	title: '',
	author: '',
	cover: '',
	desc: '',
	content: []
}
const links = [];

(async function crawler(urlCrawl = 'http://mangatoon.mobi/vi/detail/742712/episodes') {

	await getInfo(urlCrawl);

	for (let i = 0; i < links.length; i++) {
		await getContent(links[i]);
		await sleeping(100);
		console.log(`${i+1}/${links.length}`);
	}

	// Lưu dữ liệu về máy
	fs.writeFileSync(`./databook/${slug(dataBook.title)}.json`, JSON.stringify(dataBook));

})();

// shared function
function getPage(url) {
	const options = {
		uri: url,
		transform: function(body) {
		  return cheerio.load(body);
		}
	};
	return rp(options);
}

async function getInfo(url) {
	try {
		var $ = await getPage(url);
		dataBook.title = $("h1").text().trim();
		dataBook.author = $(".created-by").text().trim();
		dataBook.cover = $('.detail-top-right img').attr('src').replace('-posterend4', '');
		dataBook.desc = $('meta[name=description]').attr('content').trim();

		// get list url
		const linkObjects = $('.episodes-wrap a');
		linkObjects.each((index, element) => {
			links.push('http://mangatoon.mobi' + $(element).attr('href'));
		});
		console.log(links);

	} catch (error) {
		fs.appendFileSync('./error', error);
	}

}

async function getContent(url) {
	try {
		var $ = await getPage(url);
		let chapTitle = $("span.title").text().trim();
		let chapContent = $.html().match(/var initialValue = \[(.+?)\];/)[1];
			chapContent = JSON.parse("[" + chapContent + "]");
			chapContent = chapContent.join('\n');
			chapContent = chapContent.replace(/\\/g, '');
			chapContent = chapContent.replace(/(?:!\[(.*?)\]\((.*?)\))/g, ''); // xoa markdown
			console.log(chapTitle);

		let contentChap = {
			title: chapTitle,
			data: chapContent
		}
		dataBook.content.push(contentChap);

	} catch (error) {
		fs.appendFileSync('./error', error);
	}

}

function sleeping(ms) {
	return new Promise((resolve) =>
		setTimeout(resolve, ms)
	)
}

function slug(str)
{
	// Chuyển hết sang chữ thường
	str = str.toLowerCase();     

	// xóa dấu
	str = str.replace(/(à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ)/g, 'a');
	str = str.replace(/(è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ)/g, 'e');
	str = str.replace(/(ì|í|ị|ỉ|ĩ)/g, 'i');
	str = str.replace(/(ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ)/g, 'o');
	str = str.replace(/(ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ)/g, 'u');
	str = str.replace(/(ỳ|ý|ỵ|ỷ|ỹ)/g, 'y');
	str = str.replace(/(đ)/g, 'd');

	// Xóa ký tự đặc biệt
	str = str.replace(/[^a-z0-9]/g, ' ').trim();
	return str.replace(/\s+/g, '-');
}
