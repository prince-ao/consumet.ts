"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const cheerio_1 = require("cheerio");
const models_1 = require("../../models");
class MangaHere extends models_1.MangaParser {
    constructor() {
        super(...arguments);
        this.name = 'MangaHere';
        this.baseUrl = 'http://www.mangahere.cc';
        this.logo = 'https://i.pinimg.com/564x/51/08/62/51086247ed16ff8abae2df0bb06448e4.jpg';
        this.classPath = 'MANGA.MangaHere';
        this.fetchMangaInfo = (mangaId) => __awaiter(this, void 0, void 0, function* () {
            const mangaInfo = {
                id: mangaId,
                title: '',
            };
            try {
                const { data } = yield axios_1.default.get(`${this.baseUrl}/manga/${mangaId}`, {
                    headers: {
                        cookie: 'isAdult=1',
                    },
                });
                const $ = (0, cheerio_1.load)(data);
                mangaInfo.title = $('span.detail-info-right-title-font').text();
                mangaInfo.description = $('div.detail-info-right > p.fullcontent').text();
                mangaInfo.headerForImage = { Referer: this.baseUrl };
                mangaInfo.image = $('div.detail-info-cover > img').attr('src');
                mangaInfo.genres = $('p.detail-info-right-tag-list > a')
                    .map((i, el) => { var _a; return (_a = $(el).attr('title')) === null || _a === void 0 ? void 0 : _a.trim(); })
                    .get();
                switch ($('span.detail-info-right-title-tip').text()) {
                    case 'Ongoing':
                        mangaInfo.status = models_1.MediaStatus.ONGOING;
                        break;
                    case 'Completed':
                        mangaInfo.status = models_1.MediaStatus.COMPLETED;
                        break;
                    default:
                        mangaInfo.status = models_1.MediaStatus.UNKNOWN;
                        break;
                }
                mangaInfo.rating = parseFloat($('span.detail-info-right-title-star > span').last().text());
                mangaInfo.authors = $('p.detail-info-right-say > a')
                    .map((i, el) => $(el).attr('title'))
                    .get();
                mangaInfo.chapters = $('ul.detail-main-list > li')
                    .map((i, el) => {
                    var _a;
                    return ({
                        id: (_a = $(el).find('a').attr('href')) === null || _a === void 0 ? void 0 : _a.split('/manga/')[1].slice(0, -7),
                        title: $(el).find('a > div > p.title3').text(),
                        releasedDate: $(el).find('a > div > p.title2').text(),
                    });
                })
                    .get();
                return mangaInfo;
            }
            catch (err) {
                throw new Error(err.message);
            }
        });
        this.fetchChapterPages = (chapterId) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const chapterPages = [];
            const url = `${this.baseUrl}/manga/${chapterId}/1.html`;
            try {
                const { data } = yield axios_1.default.get(url, {
                    headers: {
                        cookie: 'isAdult=1',
                    },
                });
                const $ = (0, cheerio_1.load)(data);
                const bar = $('script[src*=chapter_bar]').data();
                const html = $.html();
                if (typeof bar !== 'undefined') {
                    const ss = html.indexOf('eval(function(p,a,c,k,e,d)');
                    const se = html.indexOf('</script>', ss);
                    const s = html.substring(ss, se).replace('eval', '');
                    const ds = eval(s);
                    const urls = ds.split("['")[1].split("']")[0].split("','");
                    urls.map((url, i) => chapterPages.push({ page: i, img: `https:${url}`, headerForImage: { Referer: url } }));
                }
                else {
                    let sKey = this.extractKey(html);
                    const chapterIdsl = html.indexOf('chapterid');
                    const chapterId = html.substring(chapterIdsl + 11, html.indexOf(';', chapterIdsl)).trim();
                    const chapterPagesElmnt = $('body > div:nth-child(6) > div > span').children('a');
                    const pages = parseInt((_a = chapterPagesElmnt.last().prev().attr('data-page')) !== null && _a !== void 0 ? _a : '0');
                    const pageBase = url.substring(0, url.lastIndexOf('/'));
                    let resText = '';
                    for (let i = 1; i <= pages; i++) {
                        const pageLink = `${pageBase}/chapterfun.ashx?cid=${chapterId}&page=${i}&key=${sKey}`;
                        for (let j = 1; j <= 3; j++) {
                            const { data } = yield axios_1.default.get(pageLink, {
                                headers: {
                                    Referer: url,
                                    'X-Requested-With': 'XMLHttpRequest',
                                },
                            });
                            resText = data;
                            if (resText)
                                break;
                            else
                                sKey = '';
                        }
                        const ds = eval(resText.replace('eval', ''));
                        const baseLinksp = ds.indexOf('pix=') + 5;
                        const baseLinkes = ds.indexOf(';', baseLinksp) - 1;
                        const baseLink = ds.substring(baseLinksp, baseLinkes);
                        const imageLinksp = ds.indexOf('pvalue=') + 9;
                        const imageLinkes = ds.indexOf('"', imageLinksp) - 1;
                        const imageLink = ds.substring(imageLinksp, imageLinkes);
                        chapterPages.push({
                            page: i - 1,
                            img: `https:${baseLink}${imageLink}`,
                            headerForImage: { Referer: url },
                        });
                    }
                }
                return chapterPages;
            }
            catch (err) {
                throw new Error(err.message);
            }
        });
        this.search = (query, page = 1) => __awaiter(this, void 0, void 0, function* () {
            const searchRes = {
                currentPage: page,
                results: [],
            };
            try {
                const { data } = yield axios_1.default.get(`${this.baseUrl}/search?title=${query}&page=${page}`);
                const $ = (0, cheerio_1.load)(data);
                searchRes.hasNextPage = $('div.pager-list-left > a.active').next().text() !== '>';
                searchRes.results = $('div.container > div > div > ul > li')
                    .map((i, el) => {
                    var _a;
                    return ({
                        id: (_a = $(el).find('a').attr('href')) === null || _a === void 0 ? void 0 : _a.split('/')[2],
                        title: $(el).find('p.manga-list-4-item-title > a').text(),
                        headerForImage: { Referer: this.baseUrl },
                        image: $(el).find('a > img').attr('src'),
                        description: $(el).find('p').last().text(),
                        status: $(el).find('p.manga-list-4-show-tag-list-2 > a').text() === 'Ongoing'
                            ? models_1.MediaStatus.ONGOING
                            : $(el).find('p.manga-list-4-show-tag-list-2 > a').text() === 'Completed'
                                ? models_1.MediaStatus.COMPLETED
                                : models_1.MediaStatus.UNKNOWN,
                    });
                })
                    .get();
                return searchRes;
            }
            catch (err) {
                throw new Error(err.message);
            }
        });
        /**
         *  credit: [tachiyomi-extensions](https://github.com/tachiyomiorg/tachiyomi-extensions/blob/master/src/en/mangahere/src/eu/kanade/tachiyomi/extension/en/mangahere/Mangahere.kt)
         */
        this.extractKey = (html) => {
            const skss = html.indexOf('eval(function(p,a,c,k,e,d)');
            const skse = html.indexOf('</script>', skss);
            const sks = html.substring(skss, skse).replace('eval', '');
            const skds = eval(sks);
            const sksl = skds.indexOf("'");
            const skel = skds.indexOf(';');
            const skrs = skds.substring(sksl, skel);
            return eval(skrs);
        };
    }
}
exports.default = MangaHere;
//# sourceMappingURL=mangahere.js.map