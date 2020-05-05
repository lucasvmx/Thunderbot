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
const bot = require('./setup');
var fs = require("fs");
const { Settings, ReturnCodes } = require("./constants");
const { BotSettings } = require('./settings');
const { MessageTypes } = require("whatsapp-web.js/src/util/Constants");
var BotConfig = new BotSettings();


/**
 * 
 * @param {*} qr 
 */
async function GenerateQRCode(qr)
{
    qrcode.generate(qr, {small: true});
}

/**
 * 
 */
async function OnClientReady()
{
    // Carrega as configurações
    BotConfig.Initialize();

    // Exibe o status online, se for configurado para isso
    if(BotConfig.GetSettings().robo.exibir_status_online)
        bot._client.sendPresenceAvailable();

    // Verifica se o log está ativado
    if(BotConfig.GetSettings().robo.log_de_mensagens.ativado)
    {
        // TODO: criar arquivo de log
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
    HandleMessageReceived(msg);
}

/**
 * 
 * @param {*} state 
 */
async function OnClientStateChanged(state)
{
    if(state === "TIMEOUT")
        process.exit(0);  
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
    console.log(`A autenticação falhou: ${message}. Gerando QR code ...`);

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
    var chat = await msg.getChat();
    //var contact = await msg.getContact();
    var body = String(msg.body).toLowerCase();
    //var logActivated = BotConfig.GetSettings().robo.log_de_mensagens.ativado;
    var response = '';

    // Verifica se as mensagens de grupo devem ser ignoradas
    if((BotConfig.GetSettings().robo.responder_grupos == false) && (chat.isGroup)) {
        return;
    }

    // TODO: Verificar se a mensagem deve ser logada
    // if(logActivated)
        

    // Visualiza a mensagem
    chat.sendSeen();

    // Obtém a resposta adequada
    response = BuildMessageResponse(body, msg);

    // Responde ao contato
    msg.reply(response);
}

 /**
  * Constrói uma resposta para a mensagem recebida e a retorna
  * 
  * @param {string} messageBody Corpo da mensagem recebida no chat
  * @param {Message} msg Instância da classe Message
  */
function BuildMessageResponse(messageBody, msg)
{
    var messageResponse = "";

    // Obtém a resposta adequada
    try 
    {
        BotConfig.GetSettings().robo.mensagem.forEach((element) => {

            // Realiza a busca similar
            element.contem_texto.forEach((subelement) => 
            {
                // Verifica se a mensagem enviada contém algum dos textos
                if(messageBody.search(subelement) != -1)
                {
                    // Verifica o tipo da mensagem
                    if(msg.hasMedia) {
                        messageResponse = element.resposta_contem_img;
                    } else if(msg.type === MessageTypes.LOCATION) {
                        messageResponse = element.resposta_contem_loc;
                    } else {
                        messageResponse = element.resposta_contem_txt;
                    }

                    throw ReturnCodes.RESPONSE_FOUND;
                }
            });

            // Realiza a busca exata
            element.texto_exato.forEach((subelement) => 
            {
                // Verifica se a mensagem enviada contém algum dos textos
                if(messageBody === subelement)
                {
                    // Verifica o tipo da mensagem
                    if(msg.hasMedia) {
                        messageResponse = element.resposta_exato_img;
                    } else if(msg.type === MessageTypes.LOCATION) {
                        messageResponse = element.resposta_exato_loc;
                    } else {
                        messageResponse = element.resposta_exato_txt;
                    }
                    
                    throw ReturnCodes.RESPONSE_FOUND;
                }
            });            
        });
    } catch(code)
    {
        if(code === ReturnCodes.RESPONSE_FOUND)
        {                        
            // Responde o usuário
            if(messageResponse.length > 0)
                return messageResponse;
        }
    }

    // Verifica se uma resposta anterior já foi encontrada
    if(messageResponse.length == 0)
    {
        var isPeriodResponse = BotConfig.GetSettings().robo.resposta_padrao.resposta_por_periodo_habilitada;
        var value = BotConfig.GetSettings().robo.resposta_padrao.conteudo;

        if(isPeriodResponse)
        {
            // Responde de acordo com a hora do dia
            var dateObj = new Date(Date.now());
            var hour, minute, second;

            hour = dateObj.getHours();
            minute = dateObj.getMinutes();
            second = dateObj.getSeconds();

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
                // TODO: tratar respostas da madrugada
            }            
        } else 
        {
            // É um arquivo existente em disco?
            if(fs.existsSync(value)) {
                messageResponse = fs.readFileSync(value).toString();
            } else {
                messageResponse = value;
            }
        }
    }

    return messageResponse;
}

// Exporta as funções públicas
this.on_user_authenticated = OnUserAuthenticated;
this.on_client_state_changed = OnClientStateChanged;
this.on_message_received = OnMessageReceived;
this.on_client_ready = OnClientReady;
this.on_auth_failed = OnAuthFailed;
this.generate_qr_code = GenerateQRCode;
