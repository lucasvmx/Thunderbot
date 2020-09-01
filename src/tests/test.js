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

const bot = require("../bot_setup");

async function doTests()
{
    bot.setup();
    bot.start();

    return 0;
}

// Realiza os testes
doTests().then((passed) => {
    console.log(`Passed: ${passed}`);
    process.exit(0);
}, (reason) => {
    console.log(`Rejected: ${reason}`);
    console.log(reason);
    process.exit(1);
});
