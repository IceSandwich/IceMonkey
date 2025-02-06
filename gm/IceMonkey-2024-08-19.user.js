// ==UserScript==
// @name         IceMonkey
// @namespace    http://tampermonkey.net/
// @version      2024-08-13
// @description  try to take over the world!
// @author       gh Corgice @IceSandwich
// @require      https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js#sha512-Qlv6VSKh1gDKGoJbnyA5RMXYcvnpIqhO++MhIM2fStMcGT9i2T//tSwYFlcyoRRDcDZ+TYHpH8azBBCyhpSeqw==
// @require      https://cdn.jsdelivr.net/npm/jszip@3.6.0/dist/jszip.min.js#sha512-uVSVjE7zYsGz4ag0HEzfugJ78oHCI1KhdkivjQro8ABL/PRiEO4ROwvrolYAcZnky0Fl/baWKYilQfWvESliRA==
// @run-at       document-start
// @grant        GM_registerMenuCommand
// @connect      *
// ==/UserScript==

(() =>{
    'use strict';

    ////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////// User config of IceMonkey  //////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////  You really need to change this   ///////////////////////////////////
    //////////////////////////////////////   //////////////////////   //////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
    ** Server path: ./js/index or ./js/index.js
    ** Module name: js/index
    **/
    const IM_entryPoint = "js/index";

    /**
    ** In dev/online mode, the script will keep watch this page and update when page is updating.
    ** In release/offline mode, leave it empty string and parse your modules in IM_predefinedModules below.
    **/
    const IM_refreshNotifyPage = "http://localhost:3000/bsrefresh.html";
    //const IM_refreshNotifyPage = "";

    /**
    ** Usually use in release mode. copy your module code and use encodeURIComponent encode it.
    ** Tips: you can use online website to encode it, for example: https://www.bejson.com/enc/urlencode/
    ** When conflict with dev/online modules, **prefer dev/online** modules.
    **/
    const IM_predefinedModules = {
        /** example:
        "./js/index": "%22use%20strict%22%3B%0AObject.defineProperty(exports%2C%20%22__esModule%22%2C%20%7B%20value%3A%20true%20%7D)%3B%0Aexports.main%20%3D%20main%3B%0Afunction%20main()%20%7B%0A%20%20%20%20console.log(%22Hello%20world!%22)%3B%0A%7D%0A%2F%2F%23%20sourceMappingURL%3Dindex.js.map"
        **/
    };
    const IM_context = {
        /* define your variables here that are available in your ts script globally */
        "JSZip": JSZip,
        "saveAs": saveAs,
    };





    ////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////// Internal code of IceMonkey  /////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////  DONOT CHANGE UNLESS U KNOW WHAT U R DOING //////////////////////////////
    //////////////////////////////////////   //////////////////////   //////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////

    const IM_locationOrigin = (IM_refreshNotifyPage == "" ? "" : /https?:\/\/[^\/]+/g.exec(IM_refreshNotifyPage)[0]);

    class Queue {
        constructor() {
            this.m_queue = [];
        }
        Enqueue(...element) {
            this.m_queue.push(...element);
        }
        Dequeue() {
            return this.m_queue.shift();
        }
        Front() {
            return this.m_queue[0];
        }
        IsEmpty() {
            return this.m_queue.length === 0;
        }
        Size() {
            return this.m_queue.length;
        }
        Clear() {
            this.m_queue = [];
        }
    }

    class Logging {
        constructor(moduleName) {
            this.m_moduleName = moduleName;
        }
        Info(...data) {
            console.debug(`${this.m_moduleName}]`, ...data);
        }
        Alert(message) {
            alert(`${this.m_moduleName}] ${message}`);
        }
        Error(message) {
            console.error(`${this.m_moduleName}]`, message);
            this.Alert(message);
        }
        Fatal(message) {
            this.Error(`${this.m_moduleName}] ${message}`);
            throw new Error(message);
        }
    }

    let requestSyncGetLogging = new Logging("IM_RequestSyncGet");
    function RequestSyncGet(url) {
        let request = new XMLHttpRequest();
        request.open('GET', url, false);
        request.send();
        if (request.status != 200) {
            requestSyncGetLogging.Error(`Got ${request.status} from ${url}`);
        }
        return request;
    }

    class WebpackModuleManager {
        constructor() {
            this.m_logging = new Logging("IM_WebpackModuleManager");
            this.m_cachedModules = { };
            this.m_moduleDB = { };

            let that = this;
            this.require = function (moduleName) {
                if (that.m_cachedModules[moduleName]) return that.m_cachedModules[moduleName].exports;
                if (!that.m_moduleDB[moduleName]) {
                    that.m_logging.Error(`Require ${moduleName} but cannot be found in database.`);
                    that.m_logging.Info("module database:", that.m_moduleDB);
                    return null;
                }
                let module = that.m_cachedModules[moduleName] = {
                    i: moduleName,
                    l: false, // is init
                    exports: { }
                };
                that.m_moduleDB[moduleName].call(module.exports, module, module.exports, that.require);
                module.l = true; // init done
                return module.exports;
            };
            this.require.prototype.o = function (t, e) { // hasOwnProperty, t: exports, e: name(string)
                return Object.prototype.hasOwnProperty.call(t, e);
            };
            this.require.prototype.d = function (t, e, i) { // defineProperty, t: exports, [ e: name, i: value ] or [ e: { name: value }, i: undefined ]
                let defineProperty = (name, value) => {
                    if (!this.o(name, value)) return;

                    Object.defineProperty(t, name, {
                        enumerable: true,
                        get: value
                    })
                };

                if (typeof e === "string") {
                    defineProperty(e, i);
                } else { // e: { name: value }
                    for (const [k, v] of e) {
                        defineProperty(k, v);
                    }
                }
            }
            this.require.prototype.r = function (t) { // t: exports
                if ('undefined' != typeof Symbol && Symbol.toStringTag) {
                    Object.defineProperty(t, Symbol.toStringTag, {
                        value: 'Module'
                    });
                }

                Object.defineProperty(t, '__esModule', {
                    value: true
                })
            }
        }
        Append(modules) {
            Object.assign(this.m_moduleDB, modules);
        }
    }

    class FetchRequiredModules {
        // prefixUrl: http://localhost:3000
        constructor(prefixUrl) {
            this.m_logging = new Logging("IM_FetchRequiredModules");

            this.m_prefixUrl = prefixUrl.endsWith("/") ? prefixUrl.substr(prefixUrl.length - 1) : prefixUrl;
            this.m_queue = new Queue();
            this.m_packs = { };
        }
        static ExtractRequiredModulesAndReplaceToAbsolotePath(basepath, moduleName, code, prefixUrl) {
            var simplfied = code.replace(/\/\*[\s\S]*?\*\//g, ""); // delete comments like /*...*/
            simplfied = simplfied.replace(/\/\/.*/g, ""); // delete coments like //...

            if (basepath != "") {
                // this step is easy for pattern: ${basepath}${moduleName}, assumed moduleName="index"
                // when basepath is empty: index
                // when basepath is not empty: js/index
                basepath = basepath + "/";
            }

            prefixUrl = prefixUrl || "";
            if (prefixUrl != "") {
                // this step is easy for pattern ${prefixUrl}${basepath}
                prefixUrl = prefixUrl + "/";
            }

            let ret = [];
            let matchgroups = [];
            simplfied.replace(/require\("([^\"]+)\"\)/g, (match, modulePath, offset, string) => {
                matchgroups.push(match);
                if (modulePath.startsWith('./')) {
                    ret.push(`${basepath}${modulePath.substr(2)}`);
                } else {
                    ret.push(modulePath);
                }
                return match;
            });
            for (var i = 0; i < ret.length; i++) {
                code = code.replace(matchgroups[i], `require("${ret[i]}")`);
            }
            code = code.replace(`//# sourceMappingURL=${moduleName}.js.map`, `//# sourceMappingURL=${prefixUrl}${basepath}${moduleName}.js.map`);
            return [ret, code];
        }
        static PackModule(code) {
            let sandbox = { // Global defination for module, types defined in IceMonkey.d.ts
                /* global variables */
                "IM_locationOrigin": IM_locationOrigin,
                "IM_entryPoint": IM_entryPoint,

                /* greasymonkey use proxy for window in script by default, but sometimes we need the native window (which can be obtained from document) */
                "IM_window": document.defaultView,
                "window": window,

                /* Greasemonkey variables */
                "GM_info": GM_info,
                "GM_registerMenuCommand": GM_registerMenuCommand,

                /* functions */
                "IM_RequestSyncGet": RequestSyncGet,

                /* classes */
                "IM_Queue": Queue,
                "IM_Logging": Logging,
                "IM_WebpackModuleManager": WebpackModuleManager,
            };
            Object.assign(sandbox, IM_context);

            return new Function("im_sandbox", `return (function(t, r, e) { /* t: this */
                with(im_sandbox) {
                    // the following can compatible with debug-mode webpack module.
                    var exports = r; /* r: exports */
                    var require = e; /* e: require */
                    eval(decodeURIComponent("${encodeURIComponent(code)}")); // use eval to run the internal code so that sourcemap can locate more accuratly.
                }
            });`)(sandbox);
        }
        static ServerPathToModulePath(path) {
            if (path.endsWith('.js')) path = path.substr(0, path.length - 3);
            if (path.startsWith("./")) path = path.substr(2);
            return path;
        }
        static SplitBasepathAndModuleNameFromModulePath(path) {
            let basepath = (path.lastIndexOf('/') != -1 ? path.substr(0, path.lastIndexOf('/')) : "");
            let moduleName = (path.lastIndexOf('/') != -1 ? path.substr(path.lastIndexOf('/')+1) : path);
            return [basepath, moduleName];
        }
        Load(entryPoint) {
            this.m_queue.Clear();
            this.m_queue.Enqueue(entryPoint);

            while (!this.m_queue.IsEmpty()) {
                var modulePath = FetchRequiredModules.ServerPathToModulePath(this.m_queue.Dequeue());
                if (this.m_packs[modulePath]) continue; // skip already loaded modules

                let [basepath, moduleName] = FetchRequiredModules.SplitBasepathAndModuleNameFromModulePath(modulePath);
                let url = `${this.m_prefixUrl}/${modulePath}.js`;
                this.m_logging.Info(`load ${moduleName} module(id: ${modulePath}) from ${url}`);

                var jscode = RequestSyncGet(url).responseText;
                var [requiredModules, finalcode] = FetchRequiredModules.ExtractRequiredModulesAndReplaceToAbsolotePath(basepath, moduleName, jscode, this.m_prefixUrl);
                this.m_logging.Info("require ", requiredModules, ` from ${modulePath}`);

                this.m_packs[modulePath] = FetchRequiredModules.PackModule(finalcode);

                this.m_queue.Enqueue(...requiredModules);
            }
        }
        GetWebpack() {
            return this.m_packs;
        }
    }


    let webpack = new WebpackModuleManager();
    let mainLogging = new Logging("IM_Main");

    function loadPredefinedModules(webpack) {
        let predefinedModules = { };
        for (const [serverPath, encodedCode] of Object.entries(IM_predefinedModules)) {
            var modulePath = FetchRequiredModules.ServerPathToModulePath(serverPath);
            if (predefinedModules[modulePath]) {
                mainLogging.Error(`module ${modulePath} for ${serverPath} have already in predefinedModules. Duplicated keys. Maybe internal error.`);
                break;
            }

            let [basepath, moduleName] = FetchRequiredModules.SplitBasepathAndModuleNameFromModulePath(modulePath);
            mainLogging.Info(`load ${moduleName} module(id: ${modulePath}) from predefined modules ${serverPath}`);

            var jscode = decodeURIComponent(encodedCode);
            var [requiredModules, finalcode] = FetchRequiredModules.ExtractRequiredModulesAndReplaceToAbsolotePath(basepath, moduleName, jscode, "");

            predefinedModules[modulePath] = FetchRequiredModules.PackModule(finalcode);
        }
        webpack.Append(predefinedModules);
    }


    loadPredefinedModules(webpack);
    if (IM_locationOrigin != "") { // release mode don't need to fetch
        let fetcher = new FetchRequiredModules(IM_locationOrigin);
        fetcher.Load(IM_entryPoint);
        webpack.Append(fetcher.GetWebpack());
    }

    const main_module = webpack.require(IM_entryPoint)

    mainLogging.Info(`initialization done. start running main() in ${IM_entryPoint}`);
    main_module.main(); // call main function


    if (IM_locationOrigin != "") { // release mode don't need to watch & refresh page
        window.addEventListener('load', function() {
            var iframe = document.createElement('iframe');
            iframe.setAttribute("id", "bsframe");
            iframe.src = IM_refreshNotifyPage;
            document.body.appendChild(iframe);
        });

        const iframeMessageHandlers = {
            initialized() {
                mainLogging.Info(`starting litening ${IM_refreshNotifyPage} for refreshing notify...`);
            },
            packet(data) {
                if (data.length > 0 && data[0] == "browser:reload") {
                    mainLogging.Info("received a packet to reload browser");
                    window.location.reload();
                    return;
                }
                mainLogging.Info("received a packet that cannot recognize!");
                mainLogging.Info("the packet:", data);
            }
        };

        window.addEventListener('message', function(event) {
            if (event.origin != IM_locationOrigin) return;

            Object.keys(event.data).forEach(eventType => {
                if (eventType in iframeMessageHandlers) {
                    iframeMessageHandlers[eventType].call(null, event.data[eventType]);
                } else {
                    mainLogging.Error(`receive a message with ${eventType} type from ${IM_refreshNotifyPage} but don't have such handler.`);
                }
            });
        });
    }
})();