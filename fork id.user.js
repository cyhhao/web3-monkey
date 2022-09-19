// ==UserScript==
// @name         Fork Force chainId
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://*/*
// @match        http://*/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let CHAIN_ID = "0x1";
    let NET_VERSION = 1;

    // inject ethereum.request
    let request = ethereum.request
    ethereum.request = async (e) => {
        if (e.method == "eth_chainId" || e.method == "net_version") return Promise.resolve(CHAIN_ID)
        else return request(e)
    };

    let send = ethereum.send;
    let sendAsync = ethereum.sendAsync;
    ethereum.send = async (methodOrPayload, paramsOrCallback) => {
        if (methodOrPayload == "eth_chainId" || methodOrPayload.method == "eth_chainId") return Promise.resolve(CHAIN_ID)
        return send(methodOrPayload, paramsOrCallback)
    }

    ethereum.sendAsync = (methodOrPayload, paramsOrCallback) => {
        if (methodOrPayload == "eth_chainId" || methodOrPayload.method == "eth_chainId") return CHAIN_ID
        return sendAsync(methodOrPayload, paramsOrCallback)
    }

    // inject on("chainChanged") event
    let oldOn = ethereum.on
    let on = (e, t) => {
        if (e == "chainChanged") {
            t(CHAIN_ID);
            return ethereum;
        }
        else {
            //oldOn.bind(ethereum)(e, t)
        }
    }
    ethereum.on = on;

    Object.defineProperty(window.ethereum, 'chainId', {
        enumerable: true,
        configurable: true,
        set: function (newVal) {
        },
        get: function () {
            return CHAIN_ID
        }
    });

    Object.defineProperty(window.ethereum, 'networkVersion', {
        enumerable: true,
        configurable: true,
        set: function (newVal) {
        },
        get: function () {
            return CHAIN_ID
        }
    });

    // inject fetch
    const originFetch = window.fetch;
    Object.defineProperty(window, "fetch", {
        configurable: true,
        enumerable: true,
        get() {
            return (url, options) => {
                if (options && options.method && options.method.toUpperCase() == "POST" && options.body) {
                    try {
                        let body = options.body
                        if (typeof (body) != 'string') {
                            body = new TextDecoder().decode(options.body)
                        }

                        let data = JSON.parse(body)
                        if (data.method && data.jsonrpc) {
                            return new Promise((resolve, reject) => {
                                window.ethereum.request(data).then((res) => {
                                    delete data["method"]
                                    if (data.params) delete data["params"]
                                    data["result"] = res
                                    // console.log(url, body, JSON.stringify(data))
                                    resolve(new Response(JSON.stringify(data), { headers: new Headers({ "Content-Type": "application/json" }) }))
                                }).catch((err) => {
                                    console.error("fetch ethereum.request err:", err);
                                    reject(err)
                                });
                            });
                        }

                    }
                    catch (e) { console.warn("fetch inject err:", e, url, options) }
                }
                return originFetch(url, options);
            }
        },
        set() { }
    });

    // inject XHR
    var originSend = XMLHttpRequest.prototype.send
    XMLHttpRequest.prototype.send = function (data) {
        if (data) {
            try {
                data = JSON.parse(data)
                if (data.method && data.jsonrpc) {
                    window.ethereum.request(data).then((res) => {
                        delete data["method"]
                        if (data.params) delete data["params"]
                        data["result"] = res
                        Object.defineProperties(this, {
                            status: {
                                value: 200
                            },
                            responseType: { value: "json" },
                            response: { value: data },
                            responseText: { value: JSON.stringify(data) },
                            readyState: { value: 4 },
                        })
                        // console.log("res", this.status, this.responseText, this.response, this.readyState)
                        if (this.onreadystatechange) this.onreadystatechange(new ProgressEvent("loadend"))
                        if (this.onload) this.onload(new ProgressEvent("loadend"))
                        if (this.onloadend) this.onloadend(new ProgressEvent("loadend"))
                    }).catch((err) => {
                        console.error("fetch ethereum.request err:", err);
                        Object.defineProperties(this, {
                            status: {
                                value: 500
                            },
                            responseType: { value: "text" },
                            response: { value: err },
                            responseText: { value: err },
                            readyState: { value: 4 },
                        })
                        if (this.onerror) this.onerror(new ProgressEvent("error"))
                    });
                    return
                }
            }
            catch (e) {
                console.warn("XHR inject err:", e)
            }
        }
        originSend.apply(this, arguments);
    }
})();