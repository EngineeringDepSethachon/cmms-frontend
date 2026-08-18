/**
 * CMMS Universal API Client & google.script.run Polyfill
 * ช่วยให้ Frontend บน GitHub Pages / Web Hosting เรียกใช้งาน Google Apps Script ได้โดยตรง
 */

// ฟังก์ชันดึง Query Parameters จาก URL
function getUrlParams() {
    const params = {};
    const queryString = window.location.search;
    if (queryString) {
        const urlParams = new URLSearchParams(queryString);
        for (const [key, value] of urlParams.entries()) {
            params[key] = value;
        }
    }
    return params;
}

// ฟังก์ชันนำทางไปยังหน้าต่างๆ
function navigateTo(page, params = {}) {
    let target = page;
    if (!target.toLowerCase().endsWith('.html')) {
        target += '.html';
    }
    
    const searchParams = new URLSearchParams();
    for (const key in params) {
        if (params.hasOwnProperty(key) && params[key] !== undefined && params[key] !== null) {
            searchParams.append(key, params[key]);
        }
    }
    
    const query = searchParams.toString();
    const url = target + (query ? '?' + query : '');
    window.location.href = url;
}

// ฟังก์ชันเรียก API ไปยัง Google Apps Script (Promise-based)
async function callApi(action, ...args) {
    if (typeof CONFIG === 'undefined' || !CONFIG.GAS_API_URL) {
        console.error("CONFIG.GAS_API_URL is missing.");
        throw new Error("กรุณากำหนดค่า CONFIG.GAS_API_URL ในไฟล์ config.js");
    }

    try {
        const payload = JSON.stringify({
            action: action,
            args: args
        });

        // ส่งแบบ text/plain เพื่อป้องกัน CORS Preflight OPTIONS (GAS ไม่รองรับ OPTIONS)
        const response = await fetch(CONFIG.GAS_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },
            body: payload,
            redirect: "follow"
        });

        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`API Error [${action}]:`, error);
        throw error;
    }
}

// สร้าง Drop-in Polyfill สำหรับ google.script.run
(function() {
    function createRunner(successHandler, failureHandler, userObject) {
        return new Proxy({}, {
            get: function(target, prop) {
                if (prop === 'withSuccessHandler') {
                    return function(callback) {
                        return createRunner(callback, failureHandler, userObject);
                    };
                }
                if (prop === 'withFailureHandler') {
                    return function(callback) {
                        return createRunner(successHandler, callback, userObject);
                    };
                }
                if (prop === 'withUserObject') {
                    return function(obj) {
                        return createRunner(successHandler, failureHandler, obj);
                    };
                }

                // กรณีเรียกชื่อฟังก์ชันหลังบ้าน เช่น .verifyUserLogin(u, p)
                return function(...args) {
                    callApi(prop, ...args)
                        .then(result => {
                            if (typeof successHandler === 'function') {
                                successHandler(result, userObject);
                            }
                        })
                        .catch(err => {
                            if (typeof failureHandler === 'function') {
                                failureHandler(err, userObject);
                            } else {
                                console.error(`Unhandled error calling ${prop}:`, err);
                            }
                        });
                };
            }
        });
    }

    window.google = window.google || {};
    window.google.script = window.google.script || {};
    window.google.script.run = createRunner();
    window.google.script.host = window.google.script.host || {
        close: function() { window.close(); },
        setHeight: function() {},
        setWidth: function() {}
    };
    window.google.script.url = window.google.script.url || {
        getLocation: function(callback) {
            callback({
                hash: window.location.hash,
                parameter: getUrlParams(),
                parameters: getUrlParams()
            });
        }
    };
})();
