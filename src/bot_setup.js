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
const { Settings, Folders } = require("./constants");
const handler = require('./client_handler');
const filesystem = require("fs");

let client;

/**
 * Realiza as configurações iniciais do programa
 */
this.setup = function()
{
    let sessionData;

    // Verifica se já existe uma seção salva
    if(filesystem.existsSync(Settings.SESSION_FILE))
    {
        // Carrega a sessão antiga
        sessionData = require(`${Settings.SESSION_FILE}`);

        // Inicializa o cliente
        client = new Client({session: sessionData, restartOnAuthFail: true});
    } else {
        // Inicializa o cliente
        client = new Client({restartOnAuthFail: true});
    }

    // Cria as pastas necessárias
    if(!filesystem.existsSync(Folders.SESSION_FOLDER))
        filesystem.mkdirSync(Folders.SESSION_FOLDER);
    
    if(!filesystem.existsSync(Folders.SETTINGS_FOLDER))
        filesystem.mkdirSync(Folders.SETTINGS_FOLDER);
    
    // Chamada quando o usuário se autentica
    client.on('authenticated', (session) => {
        handler.on_user_authenticated(session);
    });

    // Handler para gerar QR code
    client.on('qr', (qr) => {
        console.log(`QR code obtido: ${qr}`);
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

    // É acionada quando o cliente não consegue se autenticar
    client.on('auth_failure', (message) => {

        // Trata o erro de autenticação
        handler.on_auth_failed(message);
    });

    client.on('change_state', (state) => {
        // Trata a mudança de estado
        handler.on_client_state_changed(state);
    });

    // Símbolos exportados
    this._client = client;
};

/**
 * Inicializa o cliente
 */
this.start = function()
{
    // Inicializa o cliente
    client.initialize();
};
