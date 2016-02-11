
/**
 * ThePlatformContent Object Constructor
 *
 * This function initializes the object and sets the message 
 * listener function.
 */
function ThePlatformContent() {
    var P = this;

    document.addEventListener('RoutedMessageCS', function(e) {
        // Extract message parameters
        var dst = e.detail.destination;
        var data = e.detail.data;

        if (dst != "") {
            if (typeof P[dst] == "function") {
                P[dst](data);
            } else {
                // Error: Unknown callback
                console.log("Unknown callback function: " + dst.toString() );
            }
        }
    });
}

    ThePlatformContent.prototype.locale = 'en';
    ThePlatformContent.prototype.localizedStrings = {};

    ThePlatformContent.prototype.baseDataURL = '';


    /**
     * Send Routed Message
     * 
     * This function routes a message from the main page script
     * to the main content script.
     */
    ThePlatformContent.prototype.sendMessage = function(dst, data, callback) {
        var d = {detail: {
            destination: dst,
            data: data,
            callback: callback
        }};
        
        var ev = new CustomEvent('RoutedMessagePS', d);
        
        document.dispatchEvent(ev);
    };


    /**
     * Get Localized String Text
     *
     * This function retrieve the translated text for a given
     * localized key name.
     */
    ThePlatformContent.prototype.getLocalizedString = function(key) {
        if (this.localizedStrings[key]) {
            return this.localizedStrings[key];
        } else {
            return '__' + key + '__';
        }
    };


    /**
     * Get Content Template
     *
     * This function retrieves the text of a content template file
     * and sends the text to the specified callback function.
     *
     * The returned text is already processed for localized strings.
     */
    ThePlatformContent.prototype.getContent = function(name, callback) {
        this.sendMessage(
            "getContent",
            { name: name },
            callback
        );
    };


