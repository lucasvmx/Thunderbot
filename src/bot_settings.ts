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

import Constants from "./constants";
import "log-timestamp";
import * as fs from "fs";
import * as path from "path";
import ClientHandler from './client_handler';

/**
 * class to handle bot settings (functions and methods)
 */
class BotSettings
{
    /**
     * settings in JSON format
     */
    botSettingsObject: any;

    /**
     *path to settings file
     *
     * @type {string}
     * @memberof BotSettings
     */
    botSettingsFilePath: string;

    constructor() 
    {
        this.botSettingsFilePath = path.join(process.cwd(), "settings/settings.json");
        console.info(`loading settings file: ${this.botSettingsFilePath}`);
    }

    /**
     * gets the current bot settings
     */
    getSettings(): any
    {
        return this.botSettingsObject;
    }

    /**
     * initializes the program settings and install a filesystem watcher to monitor settings files
     */
    initialize()
    {
        // load settings from disk
        this.botSettingsObject = this.load();

        // install watcher
        this.installWatcher();
    }

    /**
     * Installs a filesystem watcher
     */
    private installWatcher()
    {
        // timeout to reload file from disk
        const timeout = 5000;

        // initialize the fs watcher
        fs.watch(Constants.SETTINGS_FILE, (eventType: string) => 
        {
            if(eventType === 'change')
            {
                // reload settings information
                setTimeout(() => {
                    this.botSettingsObject = this.load();
                    ClientHandler.settings = this.botSettingsObject;
                }, timeout);
            } 
            else if(eventType == 'rename')
            {
                process.emitWarning("the settings file was renamed!!!");
                
                // this is a critical error
                process.exit(1);
            }
        });
    }

    /**
     * load bot settings
     */
    private load(): any
    {
        // read settings file
        let json_obj = fs.readFileSync(this.botSettingsFilePath);
        let json: any;

        try {
            json = JSON.parse(json_obj.toString());
        } catch(err) {
            console.error("failed to parse json: " + err);
            process.exit(1);
        }

        return json;
    }
}

export default BotSettings;
