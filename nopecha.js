"use strict";


const fetch = (...args) => import("node-fetch").then(({default: fetch}) => fetch(...args));


function sleep(t) {
    return new Promise(resolve => setTimeout(resolve, t));
}


class NopeCHAError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}


class InvalidRequestError extends NopeCHAError {
    constructor(message) {
        super(message);
    }
}


class IncompleteJobError extends NopeCHAError {
    constructor(message) {
        super(message);
    }
}


class RateLimitError extends NopeCHAError {
    constructor(message) {
        super(message);
    }
}


class AuthenticationError extends NopeCHAError {
    constructor(message) {
        super(message);
    }
}


class InsufficientCreditError extends NopeCHAError {
    constructor(message) {
        super(message);
    }
}


class UnknownError extends NopeCHAError {
    constructor(message) {
        super(message);
    }
}


class Timeout extends NopeCHAError {
    constructor(message) {
        super(message);
    }
}


class APIError extends NopeCHAError {
    constructor(message) {
        super(message);
    }
}


class ServiceUnavailableError extends NopeCHAError {
    constructor(message) {
        super(message);
    }
}


class Configuration {
    constructor({apiKey, apiBase}) {
        this.apiKey = apiKey;
        this.apiBase = apiBase;

        if (!this.apiKey) {
            throw new Error("Invalid api key");
        }
        if (!this.apiBase) {
            this.apiBase = "https://api.nopecha.com";
        }
    }
}


class NopeCHAApi {
    constructor(configuration) {
        this.apiKey = configuration.apiKey;
        this.apiBase = configuration.apiBase;
    }

    default_headers() {
        const user_agent = "NopeCHA NodeBindings";
        const ua = {
            "httplib": "node-fetch",
            "lang": "node",
            "lang_version": process.version,
            "platform": process.platform,
            "publisher": "nopecha",
        };
        return {
            "Authorization": `Bearer ${this.apiKey}`,
            "X-NopeCHA-Client-User-Agent": JSON.stringify(ua),
            "User-Agent": user_agent,
        };
    }

    get_headers() {
        return this.default_headers();
    }

    post_headers() {
        const headers = this.default_headers();
        headers["Content-Type"] = "application/json";
        return headers;
    }

    handle_error_response(rcode, resp) {
        const error_data = "message" in resp ? resp.message : resp.error;
        if (rcode === 429) {
            return new RateLimitError(error_data);
        }
        else if (rcode === 400) {
            return new InvalidRequestError(error_data);
        }
        else if (rcode === 401) {
            return new AuthenticationError(error_data);
        }
        else if (rcode === 403) {
            return new InsufficientCreditError(error_data);
        }
        else if (rcode === 409) {
            return new IncompleteJobError(error_data);
        }
        else {
            return new UnknownError(error_data);
        }
    }

    async get(endpoint, data, retries, interval) {
        const params = new URLSearchParams(data).toString();

        for (let i = 0; i < retries; i++) {
            await sleep(interval*1000);

            const r = await fetch(`${this.apiBase}${endpoint}?${params}`, {
                headers: this.get_headers(),
            });
            const status = r.status;
            let response;
            if (status === 503) {
                response = ServiceUnavailableError("The server is overloaded or not ready yet.");
            }
            else {
                response = await r.json();
                if ("error" in response) {
                    response = this.handle_error_response(status, response);
                    if (response instanceof IncompleteJobError) {
                        continue;
                    }
                }
            }
            return response;
        }
        throw new Timeout('Failed to get results');
    }

    async post(endpoint, data) {
        const r = await fetch(`${this.apiBase}${endpoint}`, {
            method: "POST",
            headers: this.post_headers(),
            body: JSON.stringify(data),
        });
        const status = r.status;
        let response;
        if (status === 503) {
            response = ServiceUnavailableError("The server is overloaded or not ready yet.");
        }
        else {
            response = await r.json();
            if ("error" in response) {
                response = this.handle_error_response(status, response);
            }
        }
        return response;
    }

    async solve(endpoint, data, retries, interval) {
        let r = await this.post(endpoint, data);
        if (r instanceof NopeCHAError) {
            throw r;
        }
        // console.log('POST', r);
        r = await this.get(endpoint, {id: r.data}, retries, interval);
        if (r instanceof NopeCHAError) {
            throw r;
        }
        // console.log('GET', r);
        return r.data;
    }

    async solveRecognition(data) {
        return await this.solve('/', data, 120, 1);
    }

    async solveToken(data) {
        return await this.solve('/token', data, 180, 1);
    }

    async getBalance() {
        const r = await fetch(`${this.apiBase}/status`, {
            headers: this.get_headers(),
        });
        const status = r.status;
        let response;
        if (status === 503) {
            response = ServiceUnavailableError("The server is overloaded or not ready yet.");
        }
        else {
            response = await r.json();
            if ("error" in response) {
                throw this.handle_error_response(status, response);
            }
        }
        return response;
    }
}


module.exports = {
    Configuration,
    NopeCHAApi,
    NopeCHAError,
    InvalidRequestError,
    IncompleteJobError,
    RateLimitError,
    AuthenticationError,
    InsufficientCreditError,
    UnknownError,
    Timeout,
    APIError,
    ServiceUnavailableError,
};
