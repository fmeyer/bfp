// A dependency graph that contains any wasm must all be imported
// asynchronously. This `bootstrap.js` file does the single async import, so
// that no one else needs to worry about it again.
import ("./index.js").catch(e => console.error("Error importing `index.js`:", e));



window.addEventListener('load', (event) => {
    console.log('page loaded hashing data');

    var data = new Uint32Array(1024);
    window.crypto.getRandomValues(data);
    var dataBuffer = new Uint8Array(data);
    data = String.fromCharCode.apply(null, data);
    crypto.subtle.digest("SHA-256", dataBuffer).then(function(hash) { console.log(hash); });
});



var publicKey;

function generateKey(password, saltBuffer, iterations, plainText) {

    var encoder = new TextEncoder('utf-8');
    var passphraseKey = encoder.encode("password");

    // You should firstly import your passphrase Uint8array into a CryptoKey
    window.crypto.subtle.importKey(
        'raw',
        passphraseKey, { name: 'PBKDF2' },
        false, ['deriveBits', 'deriveKey']
    ).then(function(key) {

        return window.crypto.subtle.deriveKey({
                "name": 'PBKDF2',
                "salt": saltBuffer,
                "iterations": iterations,
                "hash": 'SHA-256'
            },
            key, { "name": 'HMAC', hash: { name: "SHA-256" } },
            true, ["sign", "verify"]
        )
    }).then(function(webKey) {
        publicKey = webKey
        window.crypto.subtle.sign({
                    name: "HMAC"
                },
                webKey,
                asciiToUint8Array(plainText) //ArrayBuffer of data we want to sign
            )
            .then(function(signature) {
                document.getElementById("signature").value = bytesToHexString(signature)
            })
            .catch(function(err) {
                console.error(err);
            });

        return crypto.subtle.exportKey("raw", webKey);

    }).then(function(buffer) {

        document.getElementById("key").value = bytesToHexString(buffer);
        document.getElementById("salt").value = bytesToHexString(saltBuffer);
    });

}

function verify() {

    var cryptoObj = window.crypto || window.msCrypto;

    if (!cryptoObj) {
        alert("Crypto API is not supported by the Browser");
        return;
    }

    var plainText = document.getElementById("plainText").value;
    var signature = document.getElementById("signature").value;

    if (!publicKey) {
        console.log("Derive Key and Sign Message First ")
        return;
    }
    window.crypto.subtle.verify({
                name: "HMAC",
            },
            publicKey,
            hexStringToUint8Array(signature),
            asciiToUint8Array(plainText)
        )
        .then(function(decrypted) {
            console.log("Verified   " + decrypted);
        })
        .catch(function(err) {
            console.error(err);
        });

}

function asciiToUint8Array(str) {
    var chars = [];
    for (var i = 0; i < str.length; ++i)
        chars.push(str.charCodeAt(i));
    return new Uint8Array(chars);
}

function bytesToHexString(bytes) {
    if (!bytes)
        return null;

    bytes = new Uint8Array(bytes);
    var hexBytes = [];

    for (var i = 0; i < bytes.length; ++i) {
        var byteString = bytes[i].toString(16);
        if (byteString.length < 2)
            byteString = "0" + byteString;
        hexBytes.push(byteString);
    }

    return hexBytes.join("");
};

function genKey() {
    var cryptoObj = window.crypto || window.msCrypto;

    if (!cryptoObj) {
        alert("Crypto API is not supported by the Browser");
        return;
    }
    var password = document.getElementById("password").value;
    var iteration = 1000;
    var plainText = document.getElementById("plainText").value;
    var saltBuffer = crypto.getRandomValues(new Uint8Array(8));

    generateKey(password, saltBuffer, iteration, plainText);
}

function hexStringToUint8Array(hexString) {
    if (hexString.length % 2 != 0)
        throw "Invalid hexString";
    var arrayBuffer = new Uint8Array(hexString.length / 2);

    for (var i = 0; i < hexString.length; i += 2) {
        var byteValue = parseInt(hexString.substr(i, 2), 16);
        if (byteValue == NaN)
            throw "Invalid hexString";
        arrayBuffer[i / 2] = byteValue;
    }

    return arrayBuffer;
}

window.genKey = genKey;
window.verify = verify;