const rp = require('request-promise');
const cheerio = require('cheerio'),
	cheerioTableparser = require('cheerio-tableparser');
const fs = require('fs');

const urlMaster = 'https://masterofeternity.gamepedia.com';
const EmbedColor = ['#d80f0f', '#0cf9ea', '#d67608', '#fffa00'];
const suitGrade =    [ 'C', 'B', 'A', 'S', 'S2', 'S3', 'S3+1', 'S3+2', 'S3+3', 'US', 'US+1', 'US+2', 'US+3' ];

//	suitStatInt = ['HP', 'MP', 'ATK', 'DEF', 'ACC', 'EVA'];
//	suitStatFloat = ['CRT%', 'Crit', 'CNTR', 'STNΩ', 'FRZΩ', 'SILΩ', 'ACDΩ'];
//	suitStatMisc = ['Cost', 'Height', 'Weight', 'Output'];
//	Helper function to search and return details of suit.
module.exports = (client, args) => {
	return new Promise(async function(resolve, reject) {
		const suitsClass = client.dataSuit.class;
		const suitsPrefName = client.dataSuit.pref_name;
		const suitsNonPrefName = client.dataSuit.non_pref_name;
		let classes, color, name, type, suitNames, grade;
		suitsPrefName.forEach((names, index) => {
			for(const x in names) {
				if(names[x].toLowerCase().includes(args.toLowerCase()) || args.toLowerCase().includes(names[x].toLowerCase())) {
					classes = suitsClass[index];
					color = EmbedColor[index];
					type = 'Preferred Suits';
					name = names[x];
					return true;
				}
			}
		});

		suitsNonPrefName.forEach((names) => {
			for(const x in names) {
				if(x) {
					names.forEach((elem, i) => {
						for(const y in elem) {
							if(elem[y].toLowerCase().includes(args.toLowerCase())) {
								classes = suitsClass[i - 1];
								color = EmbedColor[i - 1];
								type = 'Non-Preferred Suits';
								name = elem[y];
								return true;
							}
						}
					});
				}
			}
		});
		try {
			if(name === undefined) resolve(0);
			else {
				const url = urlMaster + `/${name}`;
				let icon, imageURL, user, suitTable, suitImageURL;
				let suitURL = [];
				//	Convert name for readability for user
				name = name.split('_').join(' ');
				const html = await rp(url);
				const $ = cheerio.load(html);
				if(type === 'Preferred Suits') {
					suitTable = $('#Stats').parent().parent().find('div').children('.tabbertab');
					icon = $('#mw-content-text').find('img')[1].attribs.src;
					//	Dynamic imageURL
					for(let i = 0; i < $('#mw-content-text').find('img').length; i++) {
						if($('#mw-content-text').find('img')[i].attribs.src.toLowerCase().includes(name.split(' ').join('_').toLowerCase())) suitURL.push($('#mw-content-text').find('img')[i].attribs.src);
					}
					suitImageURL = suitURL[0];
					suitURL = suitURL.filter(v => v.includes('icon'));
					user = $('#mw-content-text').find('a')[1].attribs.title;
					//	Temporary fix before new template
					if(!user) {
						user = $('#mw-content-text').find('a')[0].attribs.title || $('#Obtained_By').parent().next().find('a')[0].attribs.title;
						imageURL = $('#mw-content-text').find('img')[2].attribs.src;
					}
				}
				else if(type === 'Non-Preferred Suits') {
					suitTable = $('#Stats').parent().nextUntil('p');
					const image = $('#mw-content-text').find('img');
					icon = image[1].attribs.src;
					//	Dynamic imageURL
					for(let i = 0; i < $('#mw-content-text').find('img').length; i++) {
						if($('#mw-content-text').find('img')[i].attribs.src.toLowerCase().includes(name.split(' ').join('_').toLowerCase())) {
							suitURL.push($('#mw-content-text').find('img')[i].attribs.src);
						}
					}
					suitImageURL = suitURL[0];
					suitURL = suitURL.filter(v => v.includes('icon'));
					user = '-';
				}
				else {
					reject('Incorrect type of suit. Please recheck the type (Preferred / Non-Prefered)');
				}
				let manufacturer = $('#Summary').parent().nextUntil('h').find('a')[0];
				if(manufacturer) manufacturer = manufacturer.attribs.title;
				else manufacturer = '-';
				//	Table management
				const _ = cheerio.load(`<table>${suitTable}</table>`);
				cheerioTableparser(_);
				let suitStat = _('table').parsetable(false, false, true);
				for(const x in suitStat) {
					//	Regex for cleaning consecutives ,
					suitStat[x] = suitStat[x].toString().trim().split(/,[,]+/);
					suitStat[x] = suitStat[x].filter(String);
					suitStat[x] = suitStat[x].filter(v => !v.includes('Recycle'));
					for(const i in suitStat[x]) {
						suitStat[x][i] = suitStat[x][i].split(',').filter(String).join(',');
					}
				}
				//	If suitStat exists.
				if(suitStat.length) {
					//	Cleaning Data
					suitStat[1] = suitStat[1].filter(v => v.includes('('));
					for(const x in suitStat[1]) {
						suitStat[1][x] = suitStat[1][x].split(',').filter(v => v.includes('(')).toString();
					}
					suitStat[0] = suitStat[0].filter(v => v.includes('('));
					for(const x in suitStat[0]) {
						suitStat[0][x] = suitStat[0][x].split(',').filter(v => v.includes('(')).toString();
					}
					//	Suit Grade
					grade = suitStat[0].length === 0 ? suitStat[1] : suitStat[0];
					suitNames = grade.slice();
					for(const x in grade) {
						grade[x] = grade[x].match(/\([A-Z,0-9,+]+\)/g).toString().slice(1, -1);
					}
					//	console.log(suitStat[25]);
					//	Suit Stats
					suitStat = suitStat.slice(2, 7);
					suitStat[1] = suitStat[1].filter(v => v.startsWith('lv.'));
					for(const x in suitStat[4]) {
						suitStat[4][x] = suitStat[4][x].split(',').filter(String).filter(v => v !== 'MP').join(',');
					}
					if(suitStat[4]) suitStat[4] = suitStat[4].filter(String);
					else suitStat[4] = [];
					//	Special treatment for nonpref suits like Veryd.
					if(suitStat[4].length == 1) {
						suitStat[4] = suitStat[4].toString().split(',');
						const misc_1 = suitStat[4].slice(0, 8).join(',');
						const misc_2 = suitStat[4].slice(8, 16).join(',');
						const misc_3 = suitStat[4].slice(16, 24).join(',');
						const misc = [];
						misc.push(misc_1, misc_2, misc_3);
						suitStat[4] = misc;
					}
					//	For now we need to prepend additional 1 more icon.
					if(grade.includes('US+3')) {
						suitURL.unshift(suitURL[0]);
					}
				}
				else suitStat = [];
				//	Prepend necessary data
				suitStat.unshift(name, type, user, imageURL, icon, url);
				//	Sort datas based on grades
				const list = [];
				for(const x in grade) {
					list.push({ 'thumbnailURL' : suitURL[x], 'names' : suitNames[x], 'grade' : grade[x], 'statIntMin' : suitStat[6][x], 'statIntMax' : suitStat[7][x], 'statFloat' : suitStat[9][x], 'statMisc' : suitStat[10][x] });
				}
				list.sort((a, b) => {
					return suitGrade.indexOf(a.grade) - suitGrade.indexOf(b.grade);
				});
				for(const x in grade) {
					grade[x] = list[x].grade;
					suitStat[6][x] = list[x].statIntMin;
					suitStat[7][x] = list[x].statIntMax;
					suitStat[9][x] = list[x].statFloat;
					suitStat[10][x] = list[x].statMisc;
					suitNames[x] = list[x].names;
					suitURL[x] = list[x].thumbnailURL;
				}
				const suit = {
					name:				suitStat[0] || '',
					names:				suitNames || [],
					classes:			classes || '',
					color:				color,
					grade:				grade || [],
					type:				suitStat[1] || '',
					user:				suitStat[2] || '',
					manufacturer:		manufacturer,
					thumbnailURL:		suitURL || '',
					imageURL:			suitImageURL || '',
					icon:				suitStat[4] || '',
					url:				suitStat[5] || '',
					statIntMin:			suitStat[6] || [],
					statIntMax:			suitStat[7] || [],
					//	suitStatFloatText:	suitStat[8],
					statFloat:			suitStat[9] || [],
					statMisc:			suitStat[10] || [],
				};
				/*
				fs.writeFile(`./suits/${name}.json`, JSON.stringify(suit, null, 2), 'utf8', (err) => {
					if(err) throw err;
					else console.log('Pixies data updated');
				});
				*/
				//	Return a suit object
				resolve(suit);
			}
		}
		catch(err) {
			console.log(err);
			console.log('Invalid Args');
		}
	});
};