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

var bot = require('./setup');

/**
 * 
 */
function setup_process_handlers()
{
    // Instala os handlers para o processo principal
    process.on('unhandledRejection', (reason, promise) => {
        console.log(`Rejeição não tratada: ${reason}: ${promise}`);
    });
}

/**
 * 
 */
async function Main()
{
    // Configura os handlers para tratar os erros ocorridos no event loop
    setup_process_handlers();

    // Realiza toda a configuração inicial do programa
    bot.setup();
    
    // Inicia o bot
    bot.start();
}

// Executa as tarefas
Main();
