// ==UserScript==
// @name         Etherscan Tx Highlight
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Add a quick locate transaction location to etherscan, highlight tx
// @author       cyh
// @match        https://*.etherscan.io/tx*
// @match        https://bscscan.com/tx*
// @match        https://polygonscan.com/tx*
// @match        https://ftmscan.com/tx*
// @match        https://snowtrace.io/tx*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let selectors = {
        "etherscan.io": {
            block: "#ContentPlaceHolder1_maintable > div:nth-child(3) > div.col-md-9"
        },
        "bscscan.com": {
            block: "#ContentPlaceHolder1_maintable > div:nth-child(5) > div.col-md-9"
        },
        "polygonscan.com": {
            block: "#ContentPlaceHolder1_maintable > div:nth-child(5) > div.col-md-9"
        },
        "rinkeby.etherscan.io": {
            block: "#ContentPlaceHolder1_maintable > div:nth-child(5) > div.col-md-9"
        },
        "ropsten.etherscan.io": {
            block: "#ContentPlaceHolder1_maintable > div:nth-child(5) > div.col-md-9"
        },
        "ftmscan.com": {
            block: "#ContentPlaceHolder1_maintable > div:nth-child(5) > div.col-md-9"
        },
        "snowtrace.io": {
            block: "#ContentPlaceHolder1_maintable > div:nth-child(5) > div.col-md-9"
        }

    }

    if (location.pathname.indexOf("/tx/") >= 0) {

        let blockNum = $(selectors[location.host].block + " > a").text();
        if (!blockNum) {
            let bn = $(selectors[location.host].block).text().trim()
            if (bn.indexOf("Pending") > 0) {
                setTimeout(() => location.href = location.href, 1000)
            } else if (bn.length > 0) {
                setTimeout(() => location.href = location.href, 100)
            }
        }
        let txHash = $("#spanTxHash").text()

        let txUrl = `/txs?block=${blockNum}&ps=100&p=1#${txHash}`
        if (location.search.indexOf("auto=1") >= 0) location.href = txUrl
        $(selectors[location.host].block).append(`<a href='${txUrl}' target='_blank'>Transactions</a>`)
    }
    else if (location.pathname.indexOf("/txs") >= 0) {
        if (location.hash.length >= 67) {
            let tx = location.hash.slice(1)
            let found = false;
            for (let tr of $("#paywall_mask > table > tbody > tr")) {
                let it = $(tr)
                if (it.text().indexOf(tx) >= 0) {
                    it.css("background-color", "yellow")
                    tr.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    })
                    found = true;
                }
            }

            if (!found) {
                console.log("not found next page")
                let params = new URLSearchParams(window.location.search)
                params.set("p", params.get("p") - 0 + 1)
                location.search = params.toString()
            }
        }
        let checkbox = $("<input type='checkbox'/>")
        checkbox.change(function () {
            if (this.checked) {
                $(this).parent().parent().css("background-color", "rgb(255 192 0)")
            }
            else {
                $(this).parent().parent().css("background-color", "")
            }
        })
        $("tr").prepend($("<td></td>").append(checkbox))

    }

})();