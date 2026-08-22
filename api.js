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

// ==========================================
// Client IP & Device Network Detection Module
// ==========================================
let _cachedNetworkInfo = null;

async function getRealClientNetworkInfo() {
    if (_cachedNetworkInfo && (Date.now() - _cachedNetworkInfo.timestamp < 10 * 60 * 1000)) {
        return _cachedNetworkInfo;
    }

    try {
        const stored = sessionStorage.getItem('cmms_client_network_info');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && (Date.now() - parsed.timestamp < 10 * 60 * 1000)) {
                _cachedNetworkInfo = parsed;
                return _cachedNetworkInfo;
            }
        }
    } catch (e) {}

    let publicIp = "-";
    let isp = "";
    let city = "";
    let localIp = "";

    // 1. ดึง Local IP ภายในวง LAN ผ่าน WebRTC
    try {
        localIp = await new Promise((resolve) => {
            const RTCPeer = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
            if (!RTCPeer) return resolve("");
            const rtc = new RTCPeer({ iceServers: [] });
            rtc.createDataChannel('');
            rtc.createOffer().then(offer => rtc.setLocalDescription(offer)).catch(() => resolve(""));
            let timeout = setTimeout(() => { try { rtc.close(); } catch(e){} resolve(""); }, 1200);
            rtc.onicecandidate = (ice) => {
                if (!ice || !ice.candidate || !ice.candidate.candidate) return;
                const match = ice.candidate.candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/);
                if (match && match[1] && (match[1].startsWith('192.168.') || match[1].startsWith('10.') || match[1].startsWith('172.'))) {
                    clearTimeout(timeout);
                    try { rtc.close(); } catch(e){}
                    resolve(match[1]);
                }
            };
        });
    } catch (e) {
        localIp = "";
    }

    // 2. ดึง Public IP พร้อม Multi-Provider Fallback 4 ชั้น
    const fetchWithTimeout = (url, timeout = 2500) => {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('timeout')), timeout);
            fetch(url)
                .then(r => { clearTimeout(timer); resolve(r); })
                .catch(err => { clearTimeout(timer); reject(err); });
        });
    };

    // Provider 1: ipify (IPv4)
    try {
        const res = await fetchWithTimeout('https://api.ipify.org?format=json', 2000);
        if (res.ok) {
            const data = await res.json();
            if (data && data.ip) publicIp = data.ip;
        }
    } catch (e) {}

    // Provider 2: ipify (IPv6/IPv4)
    if (publicIp === "-" || !publicIp) {
        try {
            const res = await fetchWithTimeout('https://api64.ipify.org?format=json', 2000);
            if (res.ok) {
                const data = await res.json();
                if (data && data.ip) publicIp = data.ip;
            }
        } catch (e) {}
    }

    // Provider 3: Cloudflare Trace
    if (publicIp === "-" || !publicIp) {
        try {
            const res = await fetchWithTimeout('https://cloudflare.com/cdn-cgi/trace', 2000);
            if (res.ok) {
                const text = await res.text();
                const match = text.match(/ip=([^\n]+)/);
                if (match && match[1]) publicIp = match[1].trim();
            }
        } catch (e) {}
    }

    // Provider 4: ipapi.co (ได้ทั้ง IP, ISP, City)
    if (publicIp === "-" || !publicIp) {
        try {
            const res = await fetchWithTimeout('https://ipapi.co/json/', 2500);
            if (res.ok) {
                const data = await res.json();
                if (data && data.ip) {
                    publicIp = data.ip;
                    if (data.org) isp = data.org;
                    if (data.city) city = data.city;
                }
            }
        } catch (e) {}
    }

    // 3. ตรวจสอบข้อมูลอุปกรณ์ (Device & OS)
    const ua = navigator.userAgent || "";
    let os = "Unknown OS";
    if (ua.indexOf("Win") !== -1) os = "Windows";
    else if (ua.indexOf("iPhone") !== -1 || ua.indexOf("iPad") !== -1) os = "iOS";
    else if (ua.indexOf("Android") !== -1) os = "Android";
    else if (ua.indexOf("Mac") !== -1) os = "macOS";
    else if (ua.indexOf("Linux") !== -1) os = "Linux";

    let browser = "Browser";
    if (ua.indexOf("Line") !== -1) browser = "LINE In-App";
    else if (ua.indexOf("Edg") !== -1) browser = "Edge";
    else if (ua.indexOf("Chrome") !== -1) browser = "Chrome";
    else if (ua.indexOf("Safari") !== -1) browser = "Safari";
    else if (ua.indexOf("Firefox") !== -1) browser = "Firefox";

    const screenRes = (window.screen ? `${window.screen.width}x${window.screen.height}` : "");
    const deviceString = `${os} (${browser}) ${screenRes}`.trim();

    // รวม IP สรุป
    let fullIpString = publicIp;
    if (localIp) {
        fullIpString += ` (LAN: ${localIp})`;
    }
    if (city || isp) {
        fullIpString += ` [${[city, isp].filter(Boolean).join(', ')}]`;
    }

    _cachedNetworkInfo = {
        ip: fullIpString,
        rawPublicIp: publicIp,
        localIp: localIp,
        device: deviceString,
        userAgent: ua,
        timestamp: Date.now()
    };

    try {
        sessionStorage.setItem('cmms_client_network_info', JSON.stringify(_cachedNetworkInfo));
    } catch (e) {}

    return _cachedNetworkInfo;
}

// ฟังก์ชันสำหรับบันทึก Log อัตโนมัติพร้อม IP และ Device
async function logClientAction(action, targetTicket = "-", page = "") {
    try {
        const net = await getRealClientNetworkInfo();
        const userName = localStorage.getItem('userName') || "ไม่ระบุชื่อ";
        const userDept = localStorage.getItem('userDept') || "-";
        const userPos = localStorage.getItem('userPosition') || "-";
        const userUid = localStorage.getItem('userUid') || localStorage.getItem('userLogin') || "-";

        google.script.run.logAction({
            name: userName,
            dept: userDept,
            pos: userPos,
            action: action,
            targetTicket: targetTicket,
            page: page || (window.location.pathname.split('/').pop() || "Web"),
            uid: userUid,
            ip: net.ip,
            device: net.device
        });
    } catch (e) {
        console.warn("Could not log client action:", e);
    }
}
