/*
    Copyright 2020 Lucas Vieira de Jesus

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

import Constants from './constants';
import BotSettings from './bot_settings';
import MessageLogger from './message_logger';
import Utils from './utils';
import("log-timestamp");
import { Chat, Client, ClientSession, Contact, Message, WAState } from "whatsapp-web.js";
import * as fs from "fs";
import * as qrcode from "qrcode-terminal";

/**
 * class to handle whatsapp web client
 */
class ClientHandler
{
    /**
     * instance of settings class
     */
    settingsInstance: BotSettings;

    /**
     * settings of bot
     */
    static settings: any;

    /**
     * status needs to be showed?
     */
    showOnlineStatus: boolean = false;

    /**
     * log size in bytes
     */
    logSize: number = 0;

    /**
     * log has been activated?
     */
    logActivated: boolean = false;

    /**
     * handle to whatsapp client
     */
    client: Client;

    /**
     * handle to message logger
     */
    logger: MessageLogger;

    /**
     * Initializes the client
     *
     * @param whatsappClient handle to a initialized whatsapp client
     */
    constructor(whatsappClient: Client)
    {
        this.settingsInstance = new BotSettings();
        this.settingsInstance.initialize();
        ClientHandler.settings = this.settingsInstance.getSettings();
        this.client = whatsappClient;
    }

    /**
     * called when QR code is generated
     *
     * @param qr qr code data
     */
    async generateQRCode(qr: string)
    {
        if(typeof(qrcode) == "undefined") {
            console.log("qrcode is undefined");
            process.exit(1);
        }

        qrcode.generate(qr, {small: true}, function(qrcode) {
            console.log(`QR Code:\n${qrcode}`);
        });
    }

    /**
     * called when client is ready
     */
    async onClientReady(): Promise<void>
    {
        return new Promise<void>((resolve, reject) =>
        {
            // show status
            if(ClientHandler.settings.bot.show_online_status) {
                this.client.sendPresenceAvailable();
                this.showOnlineStatus = true;
            }

            // checks if log has been activated
            if(ClientHandler.settings.bot.log_messages.activated)
            {
                console.info("message logging activated");
                this.logSize = parseInt(ClientHandler.settings.bot.log_messages.maximum_logsize_bytes, 10);
                this.logActivated = true;
                this.logger = new MessageLogger(this.logSize);
                this.logger.startLogger();
            } else {
                this.logger = undefined;
            }

            // Avisa ao usuário que está pronto para receber mensagens
            console.log("loading completed. Waiting for messages ...");
            resolve();
        });
    }

    /**
     * called when a message is received
     * @param {Message} msg
     */
    async onMessageReceived(msg: Message)
    {
        // handles the received message
        this.handleMessageReceived(msg);
    }

    /**
     * called when client state changes
     * @param {WAState} state
     */
    async onClientStateChanged(state: WAState)
    {
        if(state === "TIMEOUT") {
            console.log("timeout detected");
            process.exit(0);
        }
    }

    /**
     * called when user is authenticated
     *
     * @param {ClientSession} Session handle to a saved session (if any)
     */
    async onUserAuthenticated(Session: ClientSession)
    {
        // saves the session
        this.saveSession(Session);
    }

    /**
     * called when authentication fails
     *
     * @param {string} message error message
     */
    async onAuthFailed(message: string)
    {
        // show error message
        console.log(`auth failed: ${message}.`);
        console.log("generating qr code ...");

        // delete previous session
        fs.unlinkSync(Constants.SESSION_FILE);
    }

    /**
     * saves a whatsapp session
     *
     * @param {ClientSession} Session session to be saved
     */
    private saveSession(Session: ClientSession)
    {
        fs.writeFile(Constants.SESSION_FILE, JSON.stringify(Session), (err) => {
            if(err) {
                console.error(`failed to save session: ${err}`);
            }
        });
    }

    /**
     * called when bot receives a message
     *
     * @param {Message} msg A message object
     */
    private async handleMessageReceived(msg: Message)
    {
        let chat: Chat;
        let contact: Contact;
        let body: string = String(msg.body).toLowerCase();
        let response = '';
        let settings = ClientHandler.settings;
        let bAnswerGroups: boolean;

        try {
            chat = await msg.getChat();
        } catch(err) {
            console.error("failed to get chat instance: " + err);
            return;
        }

        // get contact instance
        contact = await chat.getContact();

        if(typeof(settings.bot.answer_groups) == "undefined") {
            console.warn("answer groups setting is undefined! Assuming false");
            bAnswerGroups = false;
        }

        // we need to ignore group messages?
        if((bAnswerGroups == false) && (chat.isGroup)) {
            return;
        }

        if(this.logActivated)
        {
            if(typeof(this.logger) != "undefined") {
                this.logger.registerLog(`${Utils.getDateTimeFromTimestamp(msg.timestamp)} - ${contact.pushname}@${contact.number}: ${msg.body}`);
            } else {
                console.error("logger was not started correctly");
                process.exit(1);
            }
        }

        // see the message
        chat.sendSeen();

        // gets the best response
        response = this.buildMessageResponse(body, msg);

        // reply message (if needed)
        if(response.length > 0) {
            chat.sendMessage(response);
        }
    }

    /**
     * Builds a response according to the time of day
     *
     * @returns {string} response
     */
    private buildResponseByTimeOfDay(): string
    {
        let dateObj = new Date(Date.now());
        let hour: number;
        let value: string = "";
        let settings: any = ClientHandler.settings;

        // get hour
        hour = dateObj.getHours();

        if(((hour >= 6) && (hour <= 11)))
        {
            value = settings.bot.default_answer.answers.morning;
        } else if((hour >= 12) && (hour <= 17))
        {
            value = settings.bot.default_answer.answers.afternoon;
        } else if((hour >= 18) && (hour <= 23))
        {
            value = settings.bot.default_answer.answers.night;
        } else {
            value = settings.bot.default_answer.answers.dawn;
        }

        return value;
    }

    /**
     * Checks whether the received message should be ignored
     *
     * @param {string} value message text
     */
    private canIgnoreMessage(value: string)
    {
        let v = "";

        // Values ​​!= string will not be considered
        if(typeof(value) != "string") {
            return true;
        } else {
            v = value;
            if(v.length == 0) {
                return true;
            }
        }

        return false;
    }

    /**
     * Constructs a response to the received message and returns it
     *
     * @param {string} messageBody body of received message
     * @param {Message} msg handle to the Message
     */
    private buildMessageResponse(messageBody: string, msg: Message)
    {
        let messageResponse:string = "";
        let settings = ClientHandler.settings;

        // Get the right answer
        settings.bot.events.on_message_received.every(function(message_object)
        {
            let bCaseSensitive: boolean;

            if(typeof(message_object.case_sensitivity) == "undefined") {
                console.error("warn: case sensitivity could not be extracted");
                bCaseSensitive = false;
            } else {
                bCaseSensitive = message_object.case_sensitivity;
            }

            // performs a search for the exact text in the message list
            message_object.message_exact_text.every(function(message: string)
            {
                if(message.length > 0)
                {
                    // Performs the exact search
                    let found: boolean = false;

                    if(bCaseSensitive) {
                        found = (messageBody === message);
                    } else {
                        found = ((messageBody.toLowerCase() == message.toLowerCase()));
                    }

                    if(found)
                    {
                        // Checks the message type
                        messageResponse = message_object.answer_to_exact_text;

                        if(messageResponse.length > 0) {
                            return false;
                        }
                    }
                }

                return true;
            });

            // If the answer was found, the loop must be terminated
            if(messageResponse.length > 0) {
                return false;
            }

            return true;
        });

        // If the answer to the exact text is not found
        if(messageResponse.length == 0)
        {
            // Performs a search for similar text in each message
            ClientHandler.settings.bot.events.on_message_received.every(function(message_object)
            {
                let bCaseSensitive: boolean;

                if(typeof(message_object.case_sensitivity) == "undefined") {
                    console.error("warn: case sensitivity could not be extracted");
                    bCaseSensitive = false;
                } else {
                    bCaseSensitive = message_object.case_sensitivity;
                }

                message_object.message_contains_text.every(function(message: string)
                {
                    if(message.length > 0)
                    {
                        let found: boolean = false;

                        if(bCaseSensitive) {
                            found = messageBody.indexOf(message) >= 0;
                        } else {
                            messageBody = messageBody.toLowerCase();
                            found = messageBody.indexOf(message.toLowerCase()) >= 0;
                        }

                        // Performs the exact search
                        if(found)
                        {
                            // Returns the found answer
                            if(typeof(message_object.answer_to_contains_text) == "undefined") {
                                messageResponse = "";
                            } else {
                                messageResponse = message_object.answer_to_contains_text;
                            }
                        }

                        if(messageResponse.length > 0) {
                            return false;
                        }
                    }
                });

                if(messageResponse.length > 0) {
                    return false;
                }

                return true;
            });
        }

        // Returns the answer (if it is not empty)
        if(messageResponse.length > 0)
        {
            return messageResponse;
        } else
        {
            let isPeriodResponse = ClientHandler.settings.bot.default_answer.answer_by_timeofday_enabled;
            let default_answer: string = ClientHandler.settings.bot.default_answer.answer;

            // Sets the default response
            messageResponse = default_answer;

            // Checks whether the bot should ignore the message
            if(this.canIgnoreMessage(default_answer)) {
                console.log(`ignoring message from: ${msg.from}`);
                return "";
            }

            if(isPeriodResponse)
            {
                // Gets the value contained in the standard response key, but according to time of day
                messageResponse = this.buildResponseByTimeOfDay();
            } else
            {
                // the file exists?
                if(fs.existsSync(default_answer)) {
                    messageResponse = fs.readFileSync(default_answer).toString();
                } else {
                    if(default_answer.length > 0) {
                        messageResponse = default_answer;
                    }
                }
            }
        }

        return messageResponse;
    }

    /**
     * called when client is disconnected
     *
     * @param {WAState} state whatsapp state
     */
    async onClientDisconnected(state: WAState)
    {
        console.log("connection lost: " + state.toString());
    }
}

export default ClientHandler;
