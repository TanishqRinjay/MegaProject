const { asyncLocalStorage } = require("./asyncLocalStorage"); // Import from the correct file

// Middleware to access asyncLocalStorage store in routes
exports.asyncLocalStorageMiddleware = (req, res, next) => {
    const store = asyncLocalStorage.getStore(); // Retrieve the context
    // if (store) {
    //     console.log(
    //         `[Request] Correlation ID: ${store.correlationId}, User ID: ${store.userId}`
    //     );
    // } else {
    //     console.log("[Request] No AsyncLocalStorage context available.");
    // }
    if (!store) {
        console.log("[Request] No AsyncLocalStorage context available.");
    }
    next();
};
