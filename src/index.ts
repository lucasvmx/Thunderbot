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

import BotSetup from './bot_setup';

/**
 * installs handlers to the main process
 */
function setupProcessHandlers(): void
{
    // Handler to handle program output
    process.on('exit', (code: number) => 
    {
        if(code != 0)
            console.log("something was wrong. Please restart the program");
        else
            console.info("bot finished");
    });

    process.on('unhandledRejection', (reason: {}, promise: Promise<any>) => {
        console.error("we have a unhandled rejection: " + reason);
        console.error("promise: " + promise);
        process.exit(1);
    });
}

/**
 * main function
 */
async function main()
{
    var bot: BotSetup = new BotSetup();

    setupProcessHandlers();

    // makes the initial setup
    bot.setupClient();
}

main();
