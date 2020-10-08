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
const { Settings, ReturnCodes } = require("./constants.js");
const { BotSettings } = require('./bot_settings');
const { MessageTypes } = require("whatsapp-web.js/src/util/Constants");
const { MessageLogger } = require('./message_logger');
const { Utils } = require('./utils');
var fs = require("fs");

var Logger = new MessageLogger();
var BotConfig = new BotSettings();

/**
 * Flag para saber se o status de 'online' deverá ser exibido
 */
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
    let settings;

    // Carrega as configurações
    BotConfig.Initialize();
    settings = BotConfig.GetSettings();

    // Exibe o status online, se for configurado para isso
    if(settings.bot.show_online_status) {
        bot._client.sendPresenceAvailable();
        showOnlineStatus = true;
    }

    // Verifica se o log está ativado
    if(settings.bot.log_messages.activated)
    {
        console.info("O log de mensagens está ativado");
        logSize = parseInt(settings.bot.log_messages.maximum_logsize_bytes, 10);
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
 * Callback para lidar com as mensagens recebidas
 * @param {import("whatsapp-web.js").Message} msg 
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
 * @param {import("whatsapp-web.js").WAState} state 
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
 * @param {import("whatsapp-web.js").Message} msg Objeto do tipo Message
 */
async function HandleMessageReceived(msg)
{
    let chat = await msg.getChat();
    let contact = await msg.getContact();
    //let profilePicUrl = await contact.getProfilePicUrl();
    let body = String(msg.body).toLowerCase();
    let response = '';
    let settings = BotConfig.GetSettings();

    // Verifica se as mensagens de grupo devem ser ignoradas
    if((settings.bot.answer_groups == false) && (chat.isGroup)) {
        return;
    }

    if(logActivated) 
    {
        if(typeof(Logger) != undefined) {
            Logger.register_log(`${Utils.GetDateTimeFromUnixTimestamp(msg.timestamp)} - ${contact.pushname}@${contact.number}: ${msg.body}`);
        } else {
            console.error("O logger não foi inicializado corretamente");
            process.exit(1);
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
 * Constrói uma resposta de acordo com a hora do dia
 *
 * @returns {string} resposta de acordo com a hora do dia
 */
function BuildResponseByTimeofday()
{
    let dateObj = new Date(Date.now());
    let hour;
    let settings = BotConfig.GetSettings();
    let value = "";

    // Obtém as horas
    hour = dateObj.getHours();

    // Verifica a hora do dia
    if(((hour >= 6) && (hour <= 11))) 
    {
        value = settings.bot.default_answer.answers.morning;
    } else if((hour >= 12) && (hour <= 17))
    {
        value = settings.bot.default_answer.answers.afternoon;
    } else if((hour >= 18) && (hour <= 23))
    {
        value = settings.bot.default_answer.answers.night;
    } else {
        value = settings.bot.default_answer.answers.dawn;
    }
    
    return value;
}

/**
 * Verifica se a mensagem recebida deve ser ignorada
 * @param {boolean} value 
 */
function CanIgnoreMessage(value)
{
    let v = "";

    // Valores que não sejam do tipo string não serão considerados
    if(typeof(value) != "string") {
        return true;
    } else {
        v = value;
        if(v.length == 0) {
            return true;
        }
    }

    return false;
}

 /**
  * Constrói uma resposta para a mensagem recebida e a retorna
  * 
  * @param {string} messageBody Corpo da mensagem recebida no chat
  * @param {import("whatsapp-web.js").Message} msg Instância da classe Message
  */
function BuildMessageResponse(messageBody, msg)
{
    let messageResponse = "";
    var settings = BotConfig.GetSettings();

    // Obtém a resposta adequada
    settings.bot.events.on_message_received.every(function(message_object)
    {
        let bCaseSensitive = message_object.case_sensitivity;

        // Realiza uma busca pelo texto exato na lista de mensagens
        message_object.message_exact_text.every(function(message) 
        {
            if(message.length > 0)
            {
                // Realiza a busca exata
                let found = false;

                if(bCaseSensitive) {
                    found = (messageBody === message);
                } else {
                    found = ((messageBody.toLowerCase() == message.toLowerCase()));
                }

                if(found)
                {    
                    // Verifica o tipo da mensagem
                    messageResponse = message_object.answer_to_exact_text;
                    
                    if(messageResponse.length > 0) {
                        return false;
                    }
                }
            }

            return true;
        });
        
        // Se a resposta foi encontrada, o loop deve ser finalizado
        if(messageResponse.length > 0)
            return false;

        return true;
    });

    // Se a resposta para o texto exato não for encontrada
    if(messageResponse.length == 0) 
    {
        // Realiza uma busca pelo texto similar em cada mensagem
        settings.bot.events.on_message_received.every(function(message_object)
        {
            let bCaseSensitive = message_object.case_sensitivity;

            message_object.message_contains_text.every(function(message) 
            {
                if(message.length > 0)
                {
                    let found = false;

                    if(bCaseSensitive) {
                        found = (messageBody === message);
                    } else {
                        found = (messageBody.toLowerCase() == message.toLowerCase());
                    }

                    // Realiza a busca exata
                    if(found)
                    {
                        // Devolve a resposta encontrada
                        messageResponse = message_object.answer_to_contains_text;
                    }

                    if(messageResponse.length > 0) {
                        return false;
                    }
                }
            });

            if(messageResponse.length > 0)
                return false;

            return true;
        });
    }
  
    // Retorna a resposta (se ela não for vazia)
    if(messageResponse.length > 0) 
    {
        return messageResponse;
    } else 
    {
        let isPeriodResponse = settings.bot.default_answer.answer_by_timeofday_enabled;
        let default_answer = settings.bot.default_answer.answer;

        // Configura a resposta padrão
        messageResponse = default_answer;
        
        // Verifica se O bot deverá ignorar a mensagem
        if(CanIgnoreMessage(default_answer)) {
            console.log(`ignorando mensagem de ${msg.from} ...`);
            return "";
        }

        if(isPeriodResponse)
        {
            // Obtém o valor contido na chave da resposta padrão, porém de acordo com o turno do dia
            messageResponse = BuildResponseByTimeofday();      
        } else 
        {
            // É um arquivo existente em disco?
            if(fs.existsSync(default_answer)) {
                messageResponse = fs.readFileSync(default_answer).toString();
            } else {
                if(default_answer.length > 0) {
                    messageResponse = default_answer;
                }
            }
        }
    }

    return messageResponse;
}

/**
 * Callback chamado quando o cliente perde a conexão
 * @param {import("whatsapp-web.js").WAState} state 
 */
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
