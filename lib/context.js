/** Class for Inbound message context
 * @class
 *
 * @property {Object<string, *>} context
 * @property {import('./message.js')} Message
 * @property {Object} session
 * @property {boolean} isProcessed
 * @property {string} msg Text of inbound message
 * @property {string} language User selected language
 *
 * @property {Object} Bridge
 * @property {import('./botcms.js')} BC
 */

class Context {
    /**
     * @constructor
     * @param {import('./botcms.js')} BC
     * @param {Object} Bridge
     * @param {Object} context Update object (context) from bridge
     */
    constructor (BC, Bridge, context) {

        this.BC = BC;
        this.Bridge = Bridge;
        this.context = context;

        this.Message = new this.BC.config.classes.Message(BC);
        this.session = context.session || {};
        this.singleSession = {};

        this._processed = false;
    }

    /**
     * Send parcel from user to bot.л
     * @param Parcel
     * @return {*}
     */
    reply (Parcel) {
        if (this.BC.MT.isString(Parcel)) {
            Parcel = new this.BC.config.classes.Parcel(Parcel);
        }
        Parcel.peerId = this.Message.chat.id;
        return this.Bridge.reply(this.context, Parcel)
    }

    get isProcessed () {
        return this._processed;
    }

    get msg () {
        return this.Message.text || '';
    }

    /**
     * Set flag processed for context
     * @function
     * @param {boolean} val
     */
    setProcessed (val) {
        this._processed = val;
    }

    get language () {
        return this.session.language || this.BC.config.language;
    }

    /**
     * @function
     * @param {string} value
     */
    set language (value) {
        this.session.language = value;
    }

    /**
     * Parse key with params by Lexicon
     * @function
     * @param {string} key
     * @param {Object<string, string>}params
     * @returns {string}
     */
    lexicon (key, params = {}) {
        return this.BC.lexicon(key, params, this.language, this);
    }

    /**
     * Extract lexicon entry by key and current language
     * @function
     * @param {string} key
     * @returns {string|Object<string, string>}
     */
    lexiconExtract (key) {
        return this.BC.Lexicons.extract(this.language + '.' + key);
    }

}

module.exports = Context;
module.exports.default = Context;