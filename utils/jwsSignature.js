// const fs = require('fs');
const jose = require('jose');
// const crypto = require('crypto');

// const privateKeyPath = './keys/private.pem'; // replace with your actual private key file path
// const payload = { /* your payload goes here */ };
// const payloadPath = './keys/payload.json';
// const payload = fs.readFileSync(payloadPath);

// Load the private key
// const privateKey = fs.readFileSync(privateKeyPath);

// getJWSsign();

// async function getJWSsign() {
//   const { privateKey } = await crypto.subtle.generateKey(
//     {
//       name: 'RSASSA-PKCS1-v1_5',
//       modulusLength: 2048,
//       publicExponent: new Uint8Array([1, 0, 1]),
//       hash: { name: 'SHA-256' },
//     },
//     true,
//     ['sign', 'verify']
//   );

//jose GeneralSign

// const jws = await new jose.GeneralSign(
//     new TextEncoder().encode('It’s a dangerous business, Frodo, going out your door.'),
// )

//     .addSignature(privateKey)
//     .setProtectedHeader({ alg: 'RS256' })
//     .sign()

// console.log(jws)

//jose CompactSign

//   const jws = await new jose.CompactSign(
//     new TextEncoder().encode(payload),
//   )
//     .setProtectedHeader({
//       "alg": "RS256",
//       "kid": "f676b688-07a2-450b-abb5-57fbb98ecabe", //needs to be auto generated
//       "b64": false,
//       "crit": [
//         "b64"
//       ]
//     })
//     .sign(privateKey)

//   console.log(jws)
// }

exports.getGeneratedCompactJWSsign = function (payload, secret) {
  // let promise = new Promise( async (resolve, reject) => {
  //   try {
  //     const jws = await new jose.CompactSign(
  //       new TextEncoder().encode(payload),
  //     )
  //       .setProtectedHeader({
  //         "alg": "RS256",
  //         "kid": "f676b688-07a2-450b-abb5-57fbb98ecabe",
  //         "b64": false,
  //         "crit": [
  //           "b64"
  //         ]
  //       })
  //       .sign(secret)
  //     resolve(jws)
  //   } catch (e) {
  //     reject(e);
  //   }
  // });
  let promise = new Promise((resolve, reject) => {
    // Use an IIFE (Immediately Invoked Function Expression) to handle async logic
    (async () => {
      try {
        const jws = await new jose.CompactSign(
          new TextEncoder().encode(payload),
        )
          .setProtectedHeader({
            "alg": "RS256",
            "kid": "f676b688-07a2-450b-abb5-57fbb98ecabe",
            "b64": false,
            "crit": [
              "b64"
            ]
          })
          .sign(secret);
        resolve(jws);
      } catch (e) {
        reject(e);
      }
    })();
  });
  return promise;
}

exports.getGeneratedGeneralJWSsign = function (payload, secret) {
  // let promise = new Promise(async (resolve, reject) => {
  //   try {
  //     const jws = await new jose.GeneralSign(
  //       new TextEncoder().encode(payload),
  //     )
  //       .addSignature(secret)
  //       .setProtectedHeader({
  //         "alg": "RS256",
  //         "kid": "f676b688-07a2-450b-abb5-57fbb98ecabe",
  //         "b64": false,
  //         "crit": [
  //           "b64"
  //         ]
  //       })
  //       .sign()
  //     resolve(jws)
  //   } catch (e) {
  //     reject(e);
  //   }
  // });
  let promise = new Promise((resolve, reject) => {
    (async () => {
      try {
        const jws = await new jose.GeneralSign(
          new TextEncoder().encode(payload),
        )
          .addSignature(secret)
          .setProtectedHeader({
            "alg": "RS256",
            "kid": "f676b688-07a2-450b-abb5-57fbb98ecabe",
            "b64": false,
            "crit": [
              "b64"
            ]
          })
          .sign();
        resolve(jws);
      } catch (e) {
        reject(e);
      }
    })();
  });
  return promise;
}
