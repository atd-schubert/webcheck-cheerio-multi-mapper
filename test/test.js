"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const freeport = require("freeport");
const webcheck_1 = require("webcheck");
const webcheck_cheerio_1 = require("webcheck-cheerio");
const webcheck_plugin_group_1 = require("webcheck-plugin-group");
const __1 = require("../");
describe("Cheerio Multi Mapper Plugin", () => {
    let port;
    let server;
    before((done) => {
        const app = express();
        app.get("/", (req, res) => {
            // tslint:disable-next-line:max-line-length
            res.set("Content-Type", "text/html").send(`<html><head></head><body><div class="each"><a class="a">Text from class A</a><div class="b">Text from class B</div><span class="c">Text from class C</span></div><div class="each"><a class="a">Text from class A second time</a><div class="b">Text from class B second time</div><span class="c">Text from class C second time</span></div></body></html>`);
        });
        freeport((err, p) => {
            if (err) {
                done(err);
            }
            port = p;
            server = app.listen(port);
            done();
        });
    });
    after((done) => {
        server.close(done);
    });
    describe("Get mappings", () => {
        const webcheck = new webcheck_1.Webcheck();
        const plugin = new __1.CheerioMultiMapperPlugin({
            each: ".each",
        });
        const group = new webcheck_plugin_group_1.PluginGroup({
            plugins: [new webcheck_cheerio_1.CheerioPlugin(), plugin],
        });
        before(() => {
            webcheck.addPlugin(group);
            group.enable();
        });
        it("should get a linear mapping", (done) => {
            let first;
            let second;
            plugin.onError = done;
            plugin.onData = (data) => {
                if (data.a === "Text from class A"
                    && data.b === "Text from class B"
                    && data.c === "Text from class C") {
                    first = true;
                    if (first && second) {
                        done();
                    }
                    return;
                }
                if (data.a === "Text from class A second time"
                    && data.b === "Text from class B second time"
                    && data.c === "Text from class C second time") {
                    second = true;
                    if (first && second) {
                        done();
                    }
                    return;
                }
                return done(new Error("Wrong content fetched"));
            };
            plugin.mappings = {
                a: ".a",
                b: "div.b",
                c: ".c",
            };
            webcheck.crawl({
                url: "http://localhost:" + port + "/",
            }, (err) => {
                if (err) {
                    return done(err);
                }
            });
        });
        it("should get a nested mapping", (done) => {
            let first;
            let second;
            plugin.onError = done;
            plugin.onData = (data) => {
                if (data.a === "Text from class A"
                    && data.nested.b === "Text from class B"
                    && data.nested.c === "Text from class C") {
                    first = true;
                    if (first && second) {
                        done();
                    }
                    return;
                }
                if (data.a === "Text from class A second time"
                    && data.nested.b === "Text from class B second time"
                    && data.nested.c === "Text from class C second time") {
                    second = true;
                    if (first && second) {
                        done();
                    }
                    return;
                }
                return done(new Error("Wrong content fetched"));
            };
            plugin.mappings = {
                a: ".a",
                nested: {
                    b: "div.b",
                    c: ".c",
                },
            };
            webcheck.crawl({
                url: "http://localhost:" + port + "/",
            }, (err) => {
                if (err) {
                    return done(err);
                }
            });
        });
        it("should parse with functions and nested", (done) => {
            let first;
            let second;
            plugin.onError = done;
            plugin.onData = (data) => {
                if (data.a === "Text from class A"
                    && data.nested.b === "Text from class B"
                    && data.nested.c === "Text from class C") {
                    first = true;
                    if (first && second) {
                        done();
                    }
                    return;
                }
                if (data.a === "Text from class A second time"
                    && data.nested.b === "Text from class B second time"
                    && data.nested.c === "Text from class C second time") {
                    second = true;
                    if (first && second) {
                        done();
                    }
                    return;
                }
                return done(new Error("Wrong content fetched"));
            };
            plugin.mappings = {
                a: ($, element, result) => {
                    return $(element).find(".a").text();
                },
                nested: {
                    b: ($, element, result) => {
                        return $(element).find("div.b").text();
                    },
                    c: ".c",
                },
            };
            webcheck.crawl({
                url: "http://localhost:" + port + "/",
            }, (err) => {
                if (err) {
                    return done(err);
                }
            });
        });
    });
    describe("Overwrite with force", () => {
        const webcheck = new webcheck_1.Webcheck();
        const plugin = new __1.CheerioMultiMapperPlugin({
            each: ".each",
        });
        const group = new webcheck_plugin_group_1.PluginGroup({
            plugins: [new webcheck_cheerio_1.CheerioPlugin(), plugin],
        });
        before(() => {
            webcheck.addPlugin(group);
            group.enable();
        });
        it("should get a linear mapping", (done) => {
            let first;
            let second;
            plugin.onError = done;
            plugin.onData = (data) => {
                if (data.a === "FORCE A" && data.b === "Text from class B" && data.c === "Text from class C") {
                    first = true;
                    if (first && second) {
                        done();
                    }
                    return;
                }
                if (data.a === "FORCE A"
                    && data.b === "Text from class B second time"
                    && data.c === "Text from class C second time") {
                    second = true;
                    if (first && second) {
                        done();
                    }
                    return;
                }
                return done(new Error("Wrong content fetched"));
            };
            plugin.mappings = {
                a: ".a",
                b: "div.b",
                c: ".c",
            };
            webcheck.crawl({
                parameters: {
                    forceValue: {
                        a: "FORCE A",
                    },
                },
                url: "http://localhost:" + port + "/",
            }, (err) => {
                if (err) {
                    return done(err);
                }
            });
        });
        it("should get a nested mapping", (done) => {
            let first;
            let second;
            plugin.onError = done;
            plugin.onData = (data) => {
                if (data.a === "Text from class A"
                    && data.nested.b === "FORCE B"
                    && data.nested.c === "Text from class C") {
                    first = true;
                    if (first && second) {
                        done();
                    }
                    return;
                }
                if (data.a === "Text from class A second time"
                    && data.nested.b === "FORCE B"
                    && data.nested.c === "Text from class C second time") {
                    second = true;
                    if (first && second) {
                        done();
                    }
                    return;
                }
                return done(new Error("Wrong content fetched"));
            };
            plugin.mappings = {
                a: ".a",
                nested: {
                    b: "div.b",
                    c: ".c",
                },
            };
            webcheck.crawl({
                parameters: {
                    forceValue: {
                        nested: {
                            b: "FORCE B",
                        },
                    },
                },
                url: "http://localhost:" + port + "/",
            }, (err) => {
                if (err) {
                    return done(err);
                }
            });
        });
        it("should parse with functions and nested", (done) => {
            let first;
            let second;
            plugin.onError = done;
            plugin.onData = (data) => {
                if (data.a === "Text from class A"
                    && data.nested.b === "FORCE B"
                    && data.nested.c === "Text from class C") {
                    first = true;
                    if (first && second) {
                        done();
                    }
                    return;
                }
                if (data.a === "Text from class A second time"
                    && data.nested.b === "FORCE B"
                    && data.nested.c === "Text from class C second time") {
                    second = true;
                    if (first && second) {
                        done();
                    }
                    return;
                }
                return done(new Error("Wrong content fetched"));
            };
            plugin.mappings = {
                a: ($, element, result) => {
                    return $(element).find(".a").text();
                },
                nested: {
                    b: ($, element, result) => {
                        return $(element).find("div.b").text();
                    },
                    c: ".c",
                },
            };
            webcheck.crawl({
                parameters: {
                    forceValue: {
                        nested: {
                            b: "FORCE B",
                        },
                    },
                },
                url: "http://localhost:" + port + "/",
            }, (err) => {
                if (err) {
                    return done(err);
                }
            });
        });
        it("should have the result as parameter", (done) => {
            let first;
            let second;
            plugin.onError = done;
            plugin.onData = (data, result) => {
                if (data.a === "Text from class A"
                    && data.nested.b === "FORCE B"
                    && data.nested.c === "Text from class C"
                    && result.settings.parameters.forceValue.nested.b === "FORCE B") {
                    first = true;
                    if (first && second) {
                        done();
                    }
                    return;
                }
                if (data.a === "Text from class A second time"
                    && data.nested.b === "FORCE B"
                    && data.nested.c === "Text from class C second time"
                    && result.settings.parameters.forceValue.nested.b === "FORCE B") {
                    second = true;
                    if (first && second) {
                        done();
                    }
                    return;
                }
                return done(new Error("Wrong content fetched"));
            };
            plugin.mappings = {
                a: ($, element, result) => {
                    return $(element).find(".a").text();
                },
                nested: {
                    b: ($, element, result) => {
                        return $(element).find("div.b").text();
                    },
                    c: ".c",
                },
            };
            webcheck.crawl({
                parameters: {
                    forceValue: {
                        nested: {
                            b: "FORCE B",
                        },
                    },
                },
                url: "http://localhost:" + port + "/",
            }, (err) => {
                if (err) {
                    return done(err);
                }
            });
        });
    });
});
//# sourceMappingURL=test.js.map