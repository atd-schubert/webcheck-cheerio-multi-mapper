import { IResult, Plugin } from "webcheck";
import { ICheerioPluginResult } from "webcheck-cheerio";

import pkg = require("./package.json");

export interface ISimplifiedRegExpr {
    test(txt: string): boolean;
}

export interface INestedDictionary {
    [name: string]: INestedDictionary | string;
}
export interface INestedDictionaryWithFunctions {
    [name: string]: INestedDictionaryWithFunctions
    | (($: CheerioStatic, element: CheerioElement, result: ICheerioPluginResult) => string)
    | string;
}

export interface ICheerioMapperPluginOptions {
    filterStatusCode?: ISimplifiedRegExpr;
    filterContentType?: ISimplifiedRegExpr;
    filterUrl?: ISimplifiedRegExpr;
    mappings: INestedDictionaryWithFunctions;
    onError?: (err: Error, result: IResult) => void;
    onData: (data: INestedDictionary, result: IResult) => void;
    each?: string;
}

/**
 * A helper function for empty regular expressions
 * @private
 * @type {{test: Function}}
 */
const emptyFilter: ISimplifiedRegExpr = { // a spoofed RegExpr...
    test: (): boolean => {
        return true;
    },
};

function mapper(
    mapping: INestedDictionaryWithFunctions,
    result: ICheerioPluginResult,
    $: CheerioStatic,
    element: CheerioElement,
    force: INestedDictionary,
): INestedDictionary {
    const data: INestedDictionary = {};
    for (const hash in mapping) {
        if (mapping.hasOwnProperty(hash)) {
            if (force.hasOwnProperty(hash) && typeof force[hash] !== "object") {
                data[hash] = force[hash];
            } else {
                if (typeof mapping[hash] === "string") {
                    data[hash] = $(element).find(mapping[hash] as string).text();
                }
                if (typeof mapping[hash] === "function") {
                    data[hash] = (mapping[hash] as (
                        $: CheerioStatic,
                        element: CheerioElement,
                        result: ICheerioPluginResult,
                    ) => string)($, element, result);
                }
                if (typeof mapping[hash] === "object") {
                    data[hash] = mapper(
                        mapping[hash] as INestedDictionaryWithFunctions,
                        result,
                        $,
                        element,
                        force[hash] as INestedDictionary || {} ,
                    );
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
export class CheerioMultiMapperPlugin extends Plugin {
    public onError: (err: Error, result: IResult) => void;
    public onData: (data: INestedDictionary, result: IResult) => void;
    public mappings: INestedDictionaryWithFunctions;
    public each: string;

    public package = pkg;

    constructor(opts: ICheerioMapperPluginOptions) {
        super();

        const contentTypeFilter = opts.filterContentType || /html|\+xml/;
        const statusCodeFilter = opts.filterStatusCode || /^2/;
        const urlFilter = opts.filterUrl || emptyFilter;

        // tslint:disable-next-line:no-console
        const fallbackLogging = (err: Error) => console.error(err);

        this.onError = opts.onError || fallbackLogging;
        this.onData = opts.onData;
        this.mappings = opts.mappings;
        this.each = opts.each || "body";

        this.on = {
            result: (result: IResult) => {
                if (!result.response.headers["content-type"]) {
                    result.response.headers["content-type"] = "application/octet-stream";
                }
                if (!urlFilter.test(result.url) ||
                    !contentTypeFilter.test(result.response.headers["content-type"]!) ||
                    !statusCodeFilter.test(result.response.statusCode.toString())) {
                    return;
                }
                if (typeof (result as ICheerioPluginResult).getCheerio !== "function") {
                    this.onError(
                        new Error(
                            "CheerioPluginResult was not available. Did you activate the cheerio plugin?",
                        ),
                        result,
                    );
                    return;
                }
                (result as ICheerioPluginResult).getCheerio((err, $) => {
                    if (err) {
                        return this.onError(err, result);
                    }

                    try {
                        $(this.each).each((i, elem) => {

                            this.onData(
                                mapper(
                                    this.mappings,
                                    result as ICheerioPluginResult,
                                    $,
                                    elem,
                                    (result.settings.parameters && result.settings.parameters.forceValue) || {},
                                ),
                                result,
                            );
                        });
                    } catch (error) {
                        this.onError(error, result);
                    }

                });
                result.settings.parameters = result.settings.parameters || {};
            },
        };
    }
}
