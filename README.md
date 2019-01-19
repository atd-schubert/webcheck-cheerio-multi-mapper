# webcheck-cheerio-mapper
[Webcheck](https://github.com/atd-schubert/node-webcheck) plugin map data with cheerio multiple times on same resource

## How to install

```bash
npm install --save @atd/webcheck-cheerio-mapping
```

## How to use

```js
/*jslint node:true*/

'use strict';

var MappingPlugin = require('@atd/webcheck-cheerio-multi-mapper');

var Webcheck = require('webcheck');

var PluginGroup = require('webcheck-plugin-group');
var CheerioPlugin = require('webcheck-cheerio');
var webcheck = new Webcheck();
var plugin = new MappingPlugin({
    mappings: {
        a: '.a',
        nested: {
            b: 'div.b',
            c: '.c'
        }
    },
    each: 'body .eachClass'
});

var group = new PluginGroup({
    plugins: [new CheerioPlugin(), plugin]
});

webcheck.addPlugin(group);
group.enable();


```

## Options
- `mappings`: Object of mappings.
- `each`: Query that matches each mapping root.
- `filterContentType`: Follow only in matching content-type.
- `filterStatusCode`: Follow only in matching HTTP status code (defaults to 2xx status codes).
- `filterUrl`: Follow only **in** matching url.
- `onError`: Function that get executed on errors.
- `onData`: Function that get executed when data was fetched.


### Note for filters

Filters are regular expressions, but the plugin uses only the `.test(str)` method to proof. You are able to write
your own and much complexer functions by writing the logic in the test method of an object like this:

```js
opts = {
   filterSomething: {
       test: function (val) {
           return false || true;
       }
   }
}
```
## Overwrite values with crawl parameters

```js

wbcheck.crawl({
    url: 'http://...',
    parameters: {
        forceValue: {
            a: 'This is now the value for a',
            nested: {
                b: 'This is now the value for b'
            }
        }
    }
}, function (err) {
    // go on here...
})

```

## Working with onData

onData gives you the the result of the mapped data (named as data) and the result of the crawl (named as result).
