import * as express from "express";
import * as freeport from "freeport";
import { Server } from "http";
import { Webcheck } from "webcheck";
import { CheerioPlugin } from "webcheck-cheerio";
import { PluginGroup } from "webcheck-plugin-group";
import { CheerioMultiMapperPlugin, INestedDictionary } from "../";

describe("Cheerio Multi Mapper Plugin", () => {
    let port: number;
    let server: Server;
    before((done: Mocha.Done) => {
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
        const webcheck = new Webcheck();
        const plugin = new CheerioMultiMapperPlugin({
            each: ".each",
        } as any);
        const group = new PluginGroup({
            plugins: [new CheerioPlugin(), plugin],
        });

        before(() => {
            webcheck.addPlugin(group);
            group.enable();
        });

        it("should get a linear mapping", (done: Mocha.Done) => {
            let first: boolean;
            let second: boolean;
            plugin.onError = done;
            plugin.onData = (data) => {
                if (data.a === "Text from class A"
                    && data.b === "Text from class B"
                    && data.c === "Text from class C"
                ) {
                    first = true;
                    if (first && second) {
                        done();
                    }
                    return;
                }
                if (data.a === "Text from class A second time"
                    && data.b === "Text from class B second time"
                    && data.c === "Text from class C second time"
                ) {
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
            }, (err?: Error | null) => {
                if (err) {
                    return done(err);
                }
            });
        });
        it("should get a nested mapping", (done: Mocha.Done) => {
            let first: boolean;
            let second: boolean;
            plugin.onError = done;
            plugin.onData = (data) => {
                if (data.a === "Text from class A"
                    && (data.nested as INestedDictionary).b === "Text from class B"
                    && (data.nested as INestedDictionary).c === "Text from class C"
                ) {
                    first = true;
                    if (first && second) {
                        done();
                    }
                    return;
                }
                if (data.a === "Text from class A second time"
                    && (data.nested as INestedDictionary).b === "Text from class B second time"
                    && (data.nested as INestedDictionary).c === "Text from class C second time"
                ) {
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
            }, (err?: Error | null) => {
                if (err) {
                    return done(err);
                }
            });
        });
        it("should parse with functions and nested", (done: Mocha.Done) => {
            let first: boolean;
            let second: boolean;
            plugin.onError = done;
            plugin.onData = (data) => {
                if (data.a === "Text from class A"
                    && (data.nested as INestedDictionary).b === "Text from class B"
                    && (data.nested as INestedDictionary).c === "Text from class C"
                ) {
                    first = true;
                    if (first && second) {
                        done();
                    }
                    return;
                }
                if (data.a === "Text from class A second time"
                    && (data.nested as INestedDictionary).b === "Text from class B second time"
                    && (data.nested as INestedDictionary).c === "Text from class C second time"
                ) {
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
            }, (err?: Error | null) => {
                if (err) {
                    return done(err);
                }
            });
        });
    });

    describe("Overwrite with force", () => {
        const webcheck = new Webcheck();
        const plugin = new CheerioMultiMapperPlugin({
            each: ".each",
        } as any);
        const group = new PluginGroup({
            plugins: [new CheerioPlugin(), plugin],
        });

        before(() => {
            webcheck.addPlugin(group);
            group.enable();
        });

        it("should get a linear mapping", (done: Mocha.Done) => {
            let first: boolean;
            let second: boolean;
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
                    && data.c === "Text from class C second time"
                ) {
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
            }, (err?: Error | null) => {
                if (err) {
                    return done(err);
                }
            });
        });
        it("should get a nested mapping", (done: Mocha.Done) => {
            let first: boolean;
            let second: boolean;
            plugin.onError = done;
            plugin.onData = (data) => {
                if (data.a === "Text from class A"
                    && (data.nested as INestedDictionary).b === "FORCE B"
                    && (data.nested as INestedDictionary).c === "Text from class C"
                ) {
                    first = true;
                    if (first && second) {
                        done();
                    }
                    return;
                }
                if (data.a === "Text from class A second time"
                    && (data.nested as INestedDictionary).b === "FORCE B"
                    && (data.nested as INestedDictionary).c === "Text from class C second time"
                ) {
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
            }, (err?: Error | null) => {
                if (err) {
                    return done(err);
                }
            });
        });
        it("should parse with functions and nested", (done: Mocha.Done) => {
            let first: boolean;
            let second: boolean;
            plugin.onError = done;
            plugin.onData = (data) => {
                if (data.a === "Text from class A"
                    && (data.nested as INestedDictionary).b === "FORCE B"
                    && (data.nested as INestedDictionary).c === "Text from class C"
                ) {
                    first = true;
                    if (first && second) {
                        done();
                    }
                    return;
                }
                if (data.a === "Text from class A second time"
                    && (data.nested as INestedDictionary).b === "FORCE B"
                    && (data.nested as INestedDictionary).c === "Text from class C second time"
                ) {
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
            }, (err?: Error | null) => {
                if (err) {
                    return done(err);
                }
            });
        });
        it("should have the result as parameter", (done: Mocha.Done) => {
            let first: boolean;
            let second: boolean;
            plugin.onError = done;
            plugin.onData = (data, result) => {
                if (data.a === "Text from class A"
                    && (data.nested as INestedDictionary).b === "FORCE B"
                    && (data.nested as INestedDictionary).c === "Text from class C"
                    && result.settings.parameters!.forceValue.nested.b === "FORCE B"
                ) {
                    first = true;
                    if (first && second) {
                        done();
                    }
                    return;
                }
                if (data.a === "Text from class A second time"
                    && (data.nested as INestedDictionary).b === "FORCE B"
                    && (data.nested as INestedDictionary).c === "Text from class C second time"
                    && result.settings.parameters!.forceValue.nested.b === "FORCE B"
                ) {
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
            }, (err?: Error | null) => {
                if (err) {
                    return done(err);
                }
            });
        });
    });
});
