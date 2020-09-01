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

var bot = require('./bot_setup');

/**
 * Instala os handlers para o processo principal
 */
function setup_process_handlers()
{
    // Handler para tratar a saída do programa
    process.on('exit', (code) => 
    {
        if(code != 0)
            console.log("Algo deu errado. Reinicie o programa");
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
    await bot.setup();
    
    // Inicia o bot
    await bot.start();
}

// Executa as tarefas
Main();
