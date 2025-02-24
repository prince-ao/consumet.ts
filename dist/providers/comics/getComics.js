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
const utils_1 = require("../../utils");
const { get } = axios_1.default;
const s = () => __awaiter(void 0, void 0, void 0, function* () { });
class getComics extends models_1.ComicParser {
    constructor() {
        super(...arguments);
        this.baseUrl = 'https://getcomics.info/';
        this.name = 'GetComics';
        this.logo = 'https://scontent-lga3-1.xx.fbcdn.net/v/t31.18172-8/10923821_1548503832063793_2041220008970231476_o.png?_nc_cat=102&ccb=1-7&_nc_sid=09cbfe&_nc_ohc=aQyuLlPZtQAAX8dJviD&_nc_ht=scontent-lga3-1.xx&oh=00_AT_yPS4uuNDGirSqXnTwl2VGS9leFv4-Ujt7l6l5_FZeLw&oe=62D00D68';
        this.classPath = 'COMICS.GetComics';
        this.search = (query, page = 1) => __awaiter(this, void 0, void 0, function* () {
            query = encodeURIComponent(query);
            const { data } = yield get(`${this.baseUrl}/page/${page ? page : 1}/?s=${query}`);
            const $ = (0, cheerio_1.load)(data);
            const lastPage = $('section section nav:eq(1) ul li:last').text();
            const res = { containers: [], pages: parseInt(lastPage) };
            $('article').each((i, el) => {
                const container = new models_1.GetComicsComicsObject();
                const vals = (0, utils_1.parsePostInfo)($(el).children('div.post-info').text());
                container.image =
                    $(el).children('div.post-header-image').children('a').children('img').attr('src') || '';
                container.title = $(el).children('div.post-info').children('h1').text();
                container.excerpt = $(el).children('div.post-info').children('p.post-excerpt').text();
                container.year = vals.year;
                container.size = vals.size;
                container.description = vals.description;
                const link = $(el).children('div.post-header-image').children('a').attr('href');
                container.ufile = link || '';
                res.containers.push(container);
            });
            for (let container of res.containers) {
                if (container.ufile != '') {
                    const { data } = yield get(container.ufile);
                    const $ = (0, cheerio_1.load)(data);
                    container.download = $('.aio-red[title="Download Now"]').attr('href') || '';
                    container.readOnline = $('.aio-red[title="Read Online"]').attr('href') || '';
                    container.ufile = $('.aio-blue').attr('href') || '';
                    container.mega = $('.aio-purple').attr('href') || '';
                    container.mediafire = $('.aio-orange').attr('href') || '';
                    container.zippyshare = $('.aio-gray').attr('href') || '';
                }
            }
            return res;
        });
    }
}
exports.default = getComics;
//# sourceMappingURL=getComics.js.map