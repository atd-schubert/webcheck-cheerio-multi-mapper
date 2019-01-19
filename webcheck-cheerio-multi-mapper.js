"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const webcheck_1 = require("webcheck");
const pkg = require("./package.json");
/**
 * A helper function for empty regular expressions
 * @private
 * @type {{test: Function}}
 */
const emptyFilter = {
    test: () => {
        return true;
    },
};
function mapper(mapping, result, $, element, force) {
    const data = {};
    for (const hash in mapping) {
        if (mapping.hasOwnProperty(hash)) {
            if (force.hasOwnProperty(hash) && typeof force[hash] !== "object") {
                data[hash] = force[hash];
            }
            else {
                if (typeof mapping[hash] === "string") {
                    data[hash] = $(element).find(mapping[hash]).text();
                }
                if (typeof mapping[hash] === "function") {
                    data[hash] = mapping[hash]($, element, result);
                }
                if (typeof mapping[hash] === "object") {
                    data[hash] = mapper(mapping[hash], result, $, element, force[hash] || {});
                }
            }
        }
    }
    return data;
}
/**
 * Cheerio multi mapping plugin for webcheck.
 * @author Arne Schubert <atd.schubert@gmail.com>
 * @param {{}} [opts] - Options for this plugin
 * @param {{}} [opts.mappings] - Mappings
 * @param {string} [opts.each="body"] - Query that matches each mapping root
 * @param {RegExp|{test:Function}} [opts.filterContentType] - Follow only in matching content-type
 * @param {RegExp|{test:Function}} [opts.filterStatusCode] - Follow only in matching HTTP status code
 * @param {RegExp|{test:Function}} [opts.filterUrl] - Follow only in matching url
 * @param {Function} [opts.onError] - Function that get executed on errors
 * @param {Function} [opts.onData] - Function that get executed when data was fetched
 * @augments Webcheck.Plugin
 * @constructor
 */
class CheerioMultiMapperPlugin extends webcheck_1.Plugin {
    constructor(opts) {
        super();
        this.package = pkg;
        const contentTypeFilter = opts.filterContentType || /html|\+xml/;
        const statusCodeFilter = opts.filterStatusCode || /^2/;
        const urlFilter = opts.filterUrl || emptyFilter;
        // tslint:disable-next-line:no-console
        const fallbackLogging = (err) => console.error(err);
        this.onError = opts.onError || fallbackLogging;
        this.onData = opts.onData;
        this.mappings = opts.mappings;
        this.each = opts.each || "body";
        this.on = {
            result: (result) => {
                if (!result.response.headers["content-type"]) {
                    result.response.headers["content-type"] = "application/octet-stream";
                }
                if (!urlFilter.test(result.url) ||
                    !contentTypeFilter.test(result.response.headers["content-type"]) ||
                    !statusCodeFilter.test(result.response.statusCode.toString())) {
                    return;
                }
                if (typeof result.getCheerio !== "function") {
                    this.onError(new Error("CheerioPluginResult was not available. Did you activate the cheerio plugin?"), result);
                    return;
                }
                result.getCheerio((err, $) => {
                    if (err) {
                        return this.onError(err, result);
                    }
                    try {
                        $(this.each).each((i, elem) => {
                            this.onData(mapper(this.mappings, result, $, elem, (result.settings.parameters && result.settings.parameters.forceValue) || {}), result);
                        });
                    }
                    catch (error) {
                        this.onError(error, result);
                    }
                });
                result.settings.parameters = result.settings.parameters || {};
            },
        };
    }
}
exports.CheerioMultiMapperPlugin = CheerioMultiMapperPlugin;
//# sourceMappingURL=webcheck-cheerio-multi-mapper.js.map