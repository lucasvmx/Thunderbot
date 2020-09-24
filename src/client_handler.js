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


require("log-timestamp");
const qrcode = require("qrcode-terminal");
const bot = require('./bot_setup');
const { Settings, ReturnCodes } = require("./constants");
const { BotSettings } = require('./bot_settings');
const { MessageTypes } = require("whatsapp-web.js/src/util/Constants");
const { MessageLogger } = require('./message_logger');
const { Utils } = require('./utils');
var fs = require("fs");


var Logger = new MessageLogger();
var BotConfig = new BotSettings();

var showOnlineStatus = false;

/**
 * Tamanho do log (bytes)
 */
var logSize = 0;

/**
 * Flag para armazenar se o log foi ativado
 */
var logActivated = false;

/**
 * 
 * @param {*} qr 
 */
async function GenerateQRCode(qr)
{
    qrcode.generate(qr, {small: true}, function(qrcode) {
        console.log(`QR Code:\n${qrcode}`);
    });
}

/**
 * É chamada quando o cliente está pronto
 */
async function OnClientReady()
{
    // Carrega as configurações
    BotConfig.Initialize();

    // Exibe o status online, se for configurado para isso
    if(BotConfig.GetSettings().robo.exibir_status_online) {
        bot._client.sendPresenceAvailable();
        showOnlineStatus = true;
    }

    // Verifica se o log está ativado
    if(BotConfig.GetSettings().robo.log_de_mensagens.ativado)
    {
        console.info("O log de mensagens está ativado");
        logSize = parseInt(BotConfig.GetSettings().robo.log_de_mensagens.tam_maximo_log_bytes, 10);
        logActivated = true;
        Logger = new MessageLogger(logSize);
        Logger.start_logger();
    } else {
        Logger = undefined;
    }

    // Avisa ao usuário que está pronto para receber mensagens
    console.log("Carregamento concluído. Aguardando mensagens ...");
}

/**
 * 
 * @param {*} msg 
 */
async function OnMessageReceived(msg)
{   
    // De tempos em tempos, exibe que está online
    if(showOnlineStatus)
        bot._client.sendPresenceAvailable();

    // Exibe a mensagem recebida
    HandleMessageReceived(msg);
}

/**
 * 
 * @param {*} state 
 */
async function OnClientStateChanged(state)
{
    if(state === "TIMEOUT") {
        console.log("Timeout detectado");
        process.exit(0);
    }  
}

/**
 * 
 * @param {*} Session 
 */
async function OnUserAuthenticated(Session)
{    
    // Salva a sessão
    saveSession(Session);
}

/**
 * Callback para tratar o erro de autenticação
 * 
 * @param {*} message 
 */
async function OnAuthFailed(message)
{
    // Exibe a mensagem de erro
    console.log(`A autenticação falhou: ${message}.`);
    console.log("Gerando QR code ...");

    // Deleta a sessão antiga
    fs.unlinkSync(Settings.SESSION_FILE);
}

/**
 * Salva uma sessão do whatsapp
 * 
 * @param {object} Session Sessão a ser salva
 */
function saveSession(Session)
{
    fs.writeFileSync(Settings.SESSION_FILE, JSON.stringify(Session), function(err) {
        if(err) {
            console.error("Falha ao salvar sessão");
        }
    });
}

/**
 * É chamada assim que o BOT recebe uma mensagem
 * 
 * @param {*} msg Objeto do tipo Message
 */
async function HandleMessageReceived(msg)
{
    let chat = await msg.getChat();
    let contact = await msg.getContact();
    let profilePicUrl = await contact.getProfilePicUrl();
    let body = String(msg.body).toLowerCase();
    let response = '';

    // Verifica se as mensagens de grupo devem ser ignoradas
    if((BotConfig.GetSettings().robo.responder_grupos == false) && (chat.isGroup)) {
        return;
    }

    if(logActivated) 
    {
        if(typeof(Logger) != undefined) {
            Logger.register_log(`${Utils.GetDateTimeFromUnixTimestamp(msg.timestamp)} - ${contact.pushname}@${contact.number}: ${msg.body}`);
        } else {
            console.error("O logger não foi inicializado corretamente");
            process.exit(0);
        }
    }

    // Visualiza a mensagem
    chat.sendSeen();

    // Obtém a resposta adequada
    response = BuildMessageResponse(body, msg);

    // Responde ao contato (apenas se isso tiver que ser feito)
    // msg.reply - reponde uma mensagem em específico
    if(response.length > 0)
        chat.sendMessage(response);
}

/**
 * @brief Constrói uma resposta exata para o texto especificado
 * 
 * @param {string} messageBody Corpo da mensagem recebida
 * @param {Object} message_object Objeto da mensagem no JSON
 * @param {import("whatsapp-web.js").Message} msg Instância para a classe Message
 */
function BuildExactTextResponse(messageBody, message_object, msg)
{
    let messageResponse = "";

    message_object.texto_exato.forEach((exact_text) => 
    {
        if(exact_text.length > 0)
        {
            // Realiza a busca exata
            if(messageBody === exact_text)
            {    
                // Verifica o tipo da mensagem
                if(msg.hasMedia) {
                    messageResponse = message_object.resposta_exato_img;
                } else if(msg.type === MessageTypes.LOCATION) {
                    messageResponse = message_object.resposta_exato_loc;
                } else {
                    messageResponse = message_object.resposta_exato_txt;
                }

                return messageResponse;
            }
        }
    });
    
    return messageResponse;
}

/**
 * @brief Constrói uma resposta caso o texto similar seja encontrado
 * 
 * @param {string} messageBody Corpo da mensagem recebida
 * @param {Object} message_object Objeto da mensagem no JSON
 * @param {import("whatsapp-web.js").Message} msg Instância para a classe Message
 */
function BuildSimilarTextResponse(messageBody, message_object, msg)
{
    let messageResponse = "";

    message_object.contem_texto.forEach((similar_text) => 
    {
        if(similar_text.length > 0)
        {
            // Realiza a busca exata
            if(messageBody === similar_text)
            {   
                // Devolve a resposta encontrada
                messageResponse = message_object.resposta_contem_txt;
            }
        }
    });

    return messageResponse;
}

 /**
  * Constrói uma resposta para a mensagem recebida e a retorna
  * 
  * @param {string} messageBody Corpo da mensagem recebida no chat
  * @param {Message} msg Instância da classe Message
  */
function BuildMessageResponse(messageBody, msg)
{
    let messageResponse = "";

    // Obtém a resposta adequada
    try 
    {
        BotConfig.GetSettings().robo.mensagem.forEach((message_object) => {
            
            // Constrói as responstas. Uma exceção será lançada caso a resposta seja encontrada
            messageResponse = BuildExactTextResponse(messageBody, message_object, msg);
            if(messageResponse.length > 0) 
                throw ReturnCodes.RESPONSE_FOUND;

            messageResponse = BuildSimilarTextResponse(messageBody, message_object, msg);
            if(messageResponse.length > 0) 
                throw ReturnCodes.RESPONSE_FOUND;
        });
    } catch(code)
    {
        if(code === ReturnCodes.RESPONSE_FOUND)
        {                        
            // Retorna a resposta (se ela não for vazia)
            if(messageResponse.length > 0)
                return messageResponse;
        }
    }

    // Verifica se uma resposta anterior já foi encontrada
    if(messageResponse.length == 0)
    {
        let isPeriodResponse = BotConfig.GetSettings().robo.resposta_padrao.resposta_por_periodo_habilitada;
        let value = BotConfig.GetSettings().robo.resposta_padrao.conteudo;

        // O bot não deverá ignorar a mensagem
        if(value == undefined) {
            console.log(`Ignorando mensagem de ${msg.from}`);
            return "";
        } else if((typeof(value) == "string") && (value.length == 0)) {
            console.log(`Ignorando mensagem de ${msg.from}`);
            return ""; 
        }
        
        if(isPeriodResponse)
        {
            // Responde de acordo com a hora do dia
            let dateObj = new Date(Date.now());
            let hour;

            hour = dateObj.getHours();

            // Obtém o valor contido na chave da resposta padrão, porém de acordo com o turno do dia
            if(((hour >= 6) && (hour <= 11))) 
            {
                value = BotConfig.GetSettings().robo.resposta_padrao.resposta_periodo.manha;
            } else if((hour >= 12) && (hour <= 17))
            {
                value = BotConfig.GetSettings().robo.resposta_padrao.resposta_periodo.tarde;
            } else if((hour >= 18) && (hour <= 23))
            {
                value = BotConfig.GetSettings().robo.resposta_padrao.resposta_periodo.noite;
            } else {
                value = BotConfig.GetSettings().robo.resposta_padrao.resposta_periodo.madrugada;
            }      
            
            // Configura a resposta
            messageResponse = value;
        } else 
        {
            // É um arquivo existente em disco?
            if(fs.existsSync(value)) {
                messageResponse = fs.readFileSync(value).toString();
            } else {
                if(value.length > 0) {
                    messageResponse = value;
                }
            }
        }
    }

    return messageResponse;
}

async function OnClientDisconnected(state)
{
    console.log("Perdemos a conexão! Motivo: " + state);
}

// Exporta as funções públicas
this.on_user_authenticated = OnUserAuthenticated;
this.on_client_state_changed = OnClientStateChanged;
this.on_message_received = OnMessageReceived;
this.on_client_ready = OnClientReady;
this.on_auth_failed = OnAuthFailed;
this.generate_qr_code = GenerateQRCode;
this.on_client_disconnected = OnClientDisconnected;
