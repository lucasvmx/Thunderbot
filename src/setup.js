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

const { Client } = require('whatsapp-web.js');
const handler = require('./handlers');
const filesystem = require("fs");

// Caminho do arquivo de sessão
const SESSION_FILE_PATH = "./thunderbot.dat";
let client;

// Verifica se já exista uma seção salva
if(filesystem.existsSync(SESSION_FILE_PATH)) 
{
    // Carrega a sessão antiga
    let sessionData = filesystem.readFileSync(SESSION_FILE_PATH).toString();
    
    // Inicializa o cliente
    client = new Client({session: sessionData});
} else {
    // Inicializa o cliente
    client = new Client();
}

/**
 * Realiza as configurações iniciais do programa
 */
this.setup = function()
{
    // Chamada quando o usuário se autentica
    client.on('authenticated', (session) => {
        handler.on_user_authenticated(session);
    });

    // Handler para gerar QR code
    client.on('qr', (qr) => {
        handler.generate_qr_code(qr);
    });
    
    // Para quando o cliente estiver pronto
    client.on('ready', () => {
        handler.on_client_ready();
    });
    
    // Para lidar com as mensagens recebidas
    client.on('message', (message) => {
        handler.on_message_received(message);
    });
};

/**
 * Inicializa o cliente
 */
this.start = function()
{
    // Inicializa o cliente
    client.initialize();
};

// Símbolos exportados
this.SESSION_FILE = SESSION_FILE_PATH;
this._client = client;