
exports.onMessage = function (message) {
    console.log(new Date() + "### BACKGROUND HANDLER ### - Received a MESSAGE: [" + message + "]");
    // console.log("Throwing an error...")
    // throw new Error("Intentional error");
}

exports.onError = function (error) {
    console.error(new Date() + "### BACKGROUND HANDLER ### - Received an ERROR: [" + error + "]");
}