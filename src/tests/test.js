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

const bot = require('../bot_setup.js');
const fs = require("fs");

async function test_SettingsJsonSyntax()
{
    var file = fs.readFileSync("settings/settings.json");

    console.log("parsing JSON ...");
    JSON.parse(file);
}

async function test_BotConfiguration()
{
    // Test bot configuration
    let client = await bot.setup();
    await bot.start(client);
}

async function doTests()
{
    await test_SettingsJsonSyntax();
    await test_BotConfiguration();

    return 0;
}

async function Main()
{
    await doTests();
}

Main().then(() => {
    console.log(`passed!`);
    process.exit(0);
}, (rejected) => {
    console.log(`rejected: ${rejected}`);
    process.exit(1);
});
