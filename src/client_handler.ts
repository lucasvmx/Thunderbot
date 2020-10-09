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
import qrcode from "qrcode-terminal";
import { Client, Message, WAState } from "whatsapp-web.js";
import * as fs from "fs";

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
    settings;
    
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
        this.settings = this.settingsInstance.getSettings();
        this.client = whatsappClient;
    }

    /**
     * called when QR code is generated
     * @param {*} qr 
     */
    async generateQRCode(qr)
    {
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
            if(this.settings.bot.show_online_status) {
                this.client.sendPresenceAvailable();
                this.showOnlineStatus = true;
            }

            // checks if log has been activated
            if(this.settings.bot.log_messages.activated)
            {
                console.info("message logging activated");
                this.logSize = parseInt(this.settings.bot.log_messages.maximum_logsize_bytes, 10);
                this.logActivated = true;
                this.logger = new MessageLogger(this.logSize);
                this.logger.startLogger();
            } else {
                this.logger = undefined;
            }

            // Avisa ao usuário que está pronto para receber mensagens
            console.log("loading completed. Waiting for messages ...");
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
     * @param {any} Session 
     */
    async onUserAuthenticated(Session: any)
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
     * @param {object} Session session to be saved
     */
    saveSession(Session)
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
    async handleMessageReceived(msg: Message)
    {
        let chat = await msg.getChat();
        let contact = await msg.getContact();
        let body = String(msg.body).toLowerCase();
        let response = '';

        // we need to ignore group messages?
        if((this.settings.bot.answer_groups == false) && (chat.isGroup)) {
            return;
        }

        if(this.logActivated) 
        {
            if(typeof(this.logger) != undefined) {
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
        if(response.length > 0)
            chat.sendMessage(response);
    }

    /**
     * Builds a response according to the time of day
     *
     * @returns {string} response
     */
    buildResponseByTimeOfDay()
    {
        let dateObj = new Date(Date.now());
        let hour: number;
        let value: string = "";

        // get hour
        hour = dateObj.getHours();

        if(((hour >= 6) && (hour <= 11))) 
        {
            value = this.settings.bot.default_answer.answers.morning;
        } else if((hour >= 12) && (hour <= 17))
        {
            value = this.settings.bot.default_answer.answers.afternoon;
        } else if((hour >= 18) && (hour <= 23))
        {
            value = this.settings.bot.default_answer.answers.night;
        } else {
            value = this.settings.bot.default_answer.answers.dawn;
        }
        
        return value;
    }

    /**
     * Checks whether the received message should be ignored
     * @param {*} value 
     */
    canIgnoreMessage(value: any)
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
    buildMessageResponse(messageBody, msg)
    {
        let messageResponse = "";

        // Get the right answer
        this.settings.bot.events.on_message_received.every(function(message_object)
        {
            let bCaseSensitive = message_object.case_sensitivity;

            // performs a search for the exact text in the message list
            message_object.message_exact_text.every(function(message) 
            {
                if(message.length > 0)
                {
                    // Performs the exact search
                    let found = false;

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
            if(messageResponse.length > 0)
                return false;

            return true;
        });

        // If the answer to the exact text is not found
        if(messageResponse.length == 0) 
        {
            // Performs a search for similar text in each message
            this.settings.bot.events.on_message_received.every(function(message_object)
            {
                let bCaseSensitive = message_object.case_sensitivity;

                message_object.message_contains_text.every(function(message) 
                {
                    if(message.length > 0)
                    {
                        let found = false;

                        if(bCaseSensitive) {
                            found = (messageBody === message);
                        } else {
                            found = (messageBody.toLowerCase() == message.toLowerCase());
                        }

                        // Performs the exact search
                        if(found)
                        {
                            // Returns the found answer
                            messageResponse = message_object.answer_to_contains_text;
                        }

                        if(messageResponse.length > 0) {
                            return false;
                        }
                    }
                });

                if(messageResponse.length > 0)
                    return false;

                return true;
            });
        }
    
        // Returns the answer (if it is not empty)
        if(messageResponse.length > 0) 
        {
            return messageResponse;
        } else 
        {
            let isPeriodResponse = this.settings.bot.default_answer.answer_by_timeofday_enabled;
            let default_answer = this.settings.bot.default_answer.answer;

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