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

import { Client } from "whatsapp-web.js";
import Constants from './constants';
import ClientHandler from './client_handler';
import * as filesystem from "fs";
import Browser from './browser_downloader';

/**
 *
 */
class BotSetup
{
    /**
     * instance to client handler
     */
    private handler: ClientHandler;

    /**
     * instance to browser class
     */
    private browser: Browser;

    /**
     * instance to whatsapp web client
     */
    private client: Client;

    /**
     * initializes a instance of bot setup
     */
    constructor()
    {
        this.browser = new Browser();
    }

    /**
     * configures the client handlers
     *
     */
    private registerClientHandlers(): void
    {
        // initializes client handler
        this.handler = new ClientHandler(this.client);

        // called when client is authenticated
        this.client.on('authenticated', (session) => {
            this.handler.onUserAuthenticated(session);
        });

        // called when qr code is received
        this.client.on('qr', (qr) => {
            this.handler.generateQRCode(qr);
        });

        // called when client is ready to handle incoming messages
        this.client.on('ready', () => {
            this.handler.onClientReady();
        });

        // called when a message is received
        this.client.on('message', (message) => {
            this.handler.onMessageReceived(message);
        });

        // called when client can't be authenticated
        this.client.on('auth_failure', (message) => {
            // handles the authentication error
            this.handler.onAuthFailed(message);
        });

        // called when state is changed
        this.client.on('change_state', (state) => {
            this.handler.onClientStateChanged(state);
        });

        // called when client is disconnected
        this.client.on('disconnected', (state) => {
            console.log(`client disconnected: ${state}`);
        });

        console.info("client configured successfully");
    }

    /**
     * makes the initial program settings
     */
    async setupClient(): Promise<Client>
    {
        let sessionData;
        let puppeteer_options;
        let browserVersion;

        console.info("configuring client ...");

        try
        {
            // gets the browser version
            browserVersion = await this.browser.getRevisionNumber();

            console.info("browser version: " + browserVersion);

            await this.browser.download(browserVersion).then(function(path: string)
            {
                // configures browser path
                puppeteer_options = { executablePath: path };
            }).catch((reason) => {
                console.error(`failed to download browser: ${reason}`);
                process.exit(1);
            });
        } catch(error)
        {
            console.error(error.toString().toLocaleLowerCase());
            process.exit(1);
        }

        console.info("web browser configured successfully");

        if(typeof(puppeteer_options) == "undefined") {
            console.error("puppeteer options are undefined");
            process.exit(1);
        }

        console.info("browser location: " + puppeteer_options.executablePath);

        // Checks if a saved session already exists
        if(filesystem.existsSync(Constants.SESSION_FILE))
        {
            console.log("loading previous session ...");

            // load previous session
            sessionData = require(Constants.SESSION_FILE);

            // initializes the client
            try {
                this.client = new Client({session: sessionData, restartOnAuthFail: true, puppeteer: puppeteer_options});
            } catch(error)
            {
                console.error("failed to initialize client: " + error);
                process.exit(1);
            }
        } else
        {
            // initializes the client
            try {
                this.client = new Client({restartOnAuthFail: true, puppeteer: puppeteer_options});
            } catch(error) {
                console.error("failed to initialize client: " + error);
                process.exit(1);
            }
        }

        console.info("client initialized");

        // creates necessary folders
        if(!filesystem.existsSync(Constants.SESSION_FOLDER)) {
            filesystem.mkdirSync(Constants.SESSION_FOLDER);
        }

        if(!filesystem.existsSync(Constants.SETTINGS_FOLDER)) {
            filesystem.mkdirSync(Constants.SETTINGS_FOLDER);
        }

        // checks if settings file exists
        if(!filesystem.existsSync(`${Constants.SETTINGS_FILE}`)) {
            console.error("the settings file couldn't be found!");
            process.exit(1);
        }

        // registers client handlers
        try {
            this.registerClientHandlers();
        } catch(err) {
            console.log("failed to register client handlers: " + err);
            process.exit(1);
        }

        console.info(`starting client ...`);

        // initializes the client
        this.client.initialize().catch((err) => {
            console.error("failed to initialize client: " + err);
            process.exit(1);
        });

        // returns a instance for client
        return this.client;
    }
}

export default BotSetup;
