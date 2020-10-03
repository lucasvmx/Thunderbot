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
const { Settings, Folders } = require("./constants.js");
const handler = require('./client_handler');
const filesystem = require("fs");
const downloader = require('./browser_downloader');

/**
 * Configura os callbacks
 * 
 * @param {import("whatsapp-web.js").Client} client 
 */
async function register_client_handlers(client)
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

    // É acionada quando o cliente não consegue se autenticar
    client.on('auth_failure', (message) => {
        // Trata o erro de autenticação
        handler.on_auth_failed(message);
    });

    client.on('change_state', (state) => {
        // Trata a mudança de estado
        handler.on_client_state_changed(state);
    });

    client.on('disconnected', (state) => {
        console.log(`Cliente desconectado: ${state}`);
    });

    console.info("Cliente configurado com sucesso.");
}

/**
 * Realiza as configurações iniciais do programa
 */
async function SetupClient()
{
    let sessionData;
    let puppeteer_options;
    let browserVersion;
    let client;

    console.info("Fazendo configurações iniciais ...");

    try 
    {
        // Obtém o número da versão mais recente do browser para a plataforma
        browserVersion = await downloader.GetBrowserVersion();

        // Se o browser já existe, então essa função irá apenas retornar a sua localização no disco
        await downloader.GetBrowser(browserVersion).then(value => {

            // Configura o caminho do browser
            puppeteer_options = { executablePath: value };
        });    
    } catch(error) 
    {
        console.error(error.toString().toLocaleLowerCase());
        process.exit(1);
    }

    console.info("Navegador web configurado com sucesso");

    // Verifica se já existe uma seção salva
    if(filesystem.existsSync(Settings.SESSION_FILE))
    {
        // Exibe mensagem de log
        console.log("Recarregando sessão antiga ...");

        // Carrega a sessão antiga
        sessionData = require(`${process.cwd()}/${Settings.SESSION_FILE}`);

        // Inicializa o cliente
        try {
            client = new Client({session: sessionData, restartOnAuthFail: true, puppeteer: puppeteer_options});
        } catch(error)
        {
            console.error("Falha ao inicializar cliente: " + error);
            process.exit(1);
        }
    } else 
    {
        // Inicializa o cliente
        try {
            client = new Client({restartOnAuthFail: true, puppeteer: puppeteer_options});
        } catch(error) {
            console.error("Falha ao inicializar cliente: " + error);
            process.exit(1);
        }
    }

    // Cria as pastas necessárias
    if(!filesystem.existsSync(Folders.SESSION_FOLDER))
        filesystem.mkdirSync(Folders.SESSION_FOLDER);
    
    if(!filesystem.existsSync(Folders.SETTINGS_FOLDER))
        filesystem.mkdirSync(Folders.SETTINGS_FOLDER);
    
    // Verifica se o configurações existe
    if(!filesystem.existsSync(`${Settings.SETTINGS_FILE}`)) {
        console.error("O arquivo de configurações não existe!");
        process.exit(1);
    }

    console.info("Configurando o cliente de Whatsapp ...");

    // Registra os handlers para o cliente
    await register_client_handlers(client);

    // Exporta o símbolo do cliente
    this._client = client;

    // Retorna a instância do cliente
    return client;
}

/**
 * Inicia o cliente
 * @param {import("whatsapp-web.js").Client} client_handle 
 */
async function StartClient(client_handle)
{
    if(typeof(client_handle) === undefined) {
        console.error(`parâmetro inválido: ${typeof(client_handle)}`);
        process.exit(1);
    }

    console.info(`iniciando cliente ...`);

    // Inicializa o cliente
    client_handle.initialize();
}

this.start = StartClient;
this.setup = SetupClient;
