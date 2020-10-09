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

/**
 * class to handle bot settings (functions and methods)
 */
class BotSettings
{
    /**
     * settings in JSON format
     */
    bot_settings_object: any;

    constructor() 
    {
        this.bot_settings_object = require('../settings/settings.json');
    }

    getSettings()
    {
        return this.bot_settings_object;
    }

    /**
     * initializes the program settings
     */
    initialize()
    {
        // load settings from disk
        this.bot_settings_object = this.load();

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
                setTimeout(function() {
                    this.bot_settings_object = this.load();
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
    private load()
    {
        // deletes cached module
        delete require.cache[require.resolve('../settings/settings.json')];

        // reloads the module
        var json_obj = require('../settings/settings.json');

        return json_obj;
    }
}

export default BotSettings;
