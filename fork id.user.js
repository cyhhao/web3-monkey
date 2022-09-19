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
        return send(methodOrPayload, paramsOrCallback)
    }


    let oldOn = ethereum.on
    let on = (e, t) => {
        if (e == "chainChanged") {
            t("0x1");
            return ethereum;
        }
        else {
            console.log(e)
        }
    }

    ethereum.on = on;

    Object.defineProperty(window.ethereum, 'chainId', {
        enumerable: true,
        configurable: true,
        set: function (newVal) {
            this._name = "0x1"
            //console.log('set: ' + this._name)
        },
        get: function () {
            //console.log('get: ' + this._name)
            return this._name
        }
    });

    Object.defineProperty(window.ethereum, 'networkVersion', {
        enumerable: true,
        configurable: true,
        set: function (newVal) {
            this._name = 1
            //console.log('set: ' + this._name)
        },
        get: function () {
            //console.log('get: ' + this._name)
            return this._name
        }
    });

    const originFetch = window.fetch;
    Object.defineProperty(window, "fetch", {
        configurable: true,
        enumerable: true,
        get() {
            return (url, options) => {
                if (options && options.body) {
                    try {
                        let body = options.body
                        if (typeof (body) != 'string') {
                            body = new TextDecoder().decode(options.body)
                        }

                        let data = JSON.parse(body)
                        if (data.method) {
                            return new Promise((resolve, reject) => {
                                window.ethereum.request(data).then((res) => {
                                    delete data["method"]
                                    if (data.params) delete data["params"]
                                    data["result"] = res
                                    // console.log(url, body, JSON.stringify(data))
                                    resolve(new Response(JSON.stringify(data), { headers: new Headers({ "Content-Type": "application/json" }) }))
                                }).catch((err) => {
                                    console.error("window.ethereum err:", err);
                                    reject(err)
                                });;
                            });
                        }

                    }
                    catch (e) { console.warn("fetch hook err:", e, url, options) }
                }
                return originFetch(url, options);
            }
        }
    });




})();