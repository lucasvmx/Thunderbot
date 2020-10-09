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

import BotSetup from '../bot_setup';
import fs from "fs";

function test_SettingsJsonSyntax(): void
{
    var file = fs.readFileSync("settings/settings.json");

    console.log("parsing JSON ...");
    JSON.parse(file.toString());
}

function test_BotConfiguration()
{
    // Test bot configuration
    let bot: BotSetup = new BotSetup();
    bot.setupClient();
}

function doTests()
{
    test_SettingsJsonSyntax();
    test_BotConfiguration();

    return 0;
}

async function Main()
{
    doTests();
}

Main().then(() => {
    console.log(`passed!`);
    process.exit(0);
}, (rejected) => {
    console.log(`rejected: ${rejected}`);
    process.exit(1);
});
