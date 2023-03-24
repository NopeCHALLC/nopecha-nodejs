# NopeCHA Node.js Library

The NopeCHA Node.js library provides convenient access to the NopeCHA API
from applications written in the Node.js language. It includes a
pre-defined set of classes for API resources that initialize
themselves dynamically from API responses.

**Important note: this library is meant for server-side usage only, as using it in client-side browser code will expose your secret API key. [See here](https://developers.nopecha.com) for more details.**


## Supported CAPTCHA types:
- reCAPTCHA v2
- reCAPTCHA v3
- reCAPTCHA Enterprise
- hCaptcha
- hCaptcha Enterprise
- FunCAPTCHA
- AWS WAF CAPTCHA
- Text-based CAPTCHA


## Documentation

See the [NopeCHA API docs](https://developers.nopecha.com).


## Installation

```bash
$ npm install nopecha
```


## Usage

The library needs to be configured with your account's secret key which is available on the [website](https://nopecha.com/manage). Either set it as the `NOPECHA_API_KEY` environment variable before using the library:

```bash
export NOPECHA_API_KEY='...'
```

Or set `nopecha.api_key` to its value:

```javascript
const { Configuration, NopeCHAApi } = require("nopecha");

const configuration = new Configuration({
    apiKey: process.env.NOPECHA_API_KEY,
});
const nopecha = new NopeCHAApi(configuration);

// solve a recognition challenge
const clicks = await nopecha.solveRecognition({
    type: 'hcaptcha',
    task: 'Please click each image containing a cat-shaped cookie.',
    image_urls: Array.from({length: 9}, (_, i) => `https://nopecha.com/image/demo/hcaptcha/${i}.png`),
});

// print the grids to click
console.log(clicks);

// solve a token
const token = await nopecha.solveToken({
    type: 'hcaptcha',
    sitekey: 'ab803303-ac41-41aa-9be1-7b4e01b91e2c',
    url: 'https://nopecha.com/demo/hcaptcha',
});

// print the token
console.log(token);

// get the current balance
const balance = await nopecha.getBalance();

// print the current balance
console.log(balance);
```
