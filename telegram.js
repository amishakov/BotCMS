const Telegraf = require('telegraf');
const Extra = require('telegraf/extra');
const Markup = require('telegraf/markup');
const LocalSession = require('telegraf-session-local');
const BcContext = require('./bccontext');


class Telegram {
    constructor (BC, params = {}) {
        this.BC = BC;
        this.name = 'tg';
        // console.log('TG: ');
        // console.log(params);
        this.transport = new Telegraf(params.token);
        this.transport.use((new LocalSession({ database: 'example_db.json' })).middleware());
    }

    isAvailable () {
        return typeof this.transport === 'object';
    }

    loadSchema (schema) {
        this.schema = schema;
    }

    defaultCallback (t, ctx) {
        const params = {
            context: ctx,
            bridge: t,
            bw: t.BC,
            message: {
                type: 'text',
                text: ctx.update.message.text,
                message_id: ctx.update.message.message_id,
                from: {},
                chat: {}
            },
            match: ctx.match,
            reply: (ctx, sendObject) => this.reply(ctx, sendObject),
            session: ctx.session,
        };

        let BCContext = new BcContext(params);
        return t.BC.handleUpdate(BCContext);
    }

    listen () {
        this.transport.on('message', (ctx) => {return this.defaultCallback(this, ctx)});
    }

    kbBuild (keyboard) {
        console.log(keyboard.buttons);
        if (keyboard.options.indexOf('simple') > -1) {
            let kb = Markup.keyboard(keyboard.buttons);

            // console.log(kb.removeKeyboard);
            // kb = kb.removeKeyboard();

            for (let option of keyboard.options) {
                console.log('[TG] BUILD KB. OPTION: ' + option + ', kb[option]: ', kb[option]);
                if (!this.BC.T.empty(kb[option])) {
                    console.log('[TG] BUILD KB. OPTION FOUND: ' + option);
                    kb = kb[option]();
                }
            }
            return kb;
        }
        return undefined;

    }

    kbRemove (ctx) {
        console.log('[TG] KB REMOVE');
        return Markup.removeKeyboard(true);
    }

    reply (ctx, sendObject) {
        // for (let key in sendObject) {
        //     if (sendObject.hasOwnProperty(key)) {
        //         if (this.BC.T.empty(sendObject[key])) {
        //             delete sendObject[key];
        //         }
        //     }
        // }
        console.log(sendObject);
        return ctx.reply(sendObject.message, sendObject.keyboard || {});
    }



    start (middleware, ...middlewares) {
        this.transport.start(middleware, ...middlewares);
    }

    help (middleware, ...middlewares) {
        this.transport.help(middleware, ...middlewares);
    }

    on (updateType, middleware, ...middlewares) {
        this.transport.on(updateType, middleware, ...middlewares);
    }

    command (command, middleware, ...middlewares) {
        this.transport.command(command, middleware, ...middlewares);
    }

    hear (trigger, middleware, ...middlewares) {
        this.transport.hears(trigger, middleware, ...middlewares);
    }

    launch (middleware, ...middlewares) {
        this.transport.launch(middleware, ...middlewares);
        console.log('TG started');
    }









}

module.exports = Object.assign(Telegram, {Telegraf});
module.exports.default = Object.assign(Telegram, {Telegraf});