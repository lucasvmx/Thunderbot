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
let fs = require("fs");
const { Settings, ReturnCodes } = require("./constants");
const { BotSettings } = require('./settings');
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

    // Exibe o status online
    bot._client.sendPresenceAvailable();

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
 * 
 * @param {*} Session 
 */
async function OnAuthFailed(Session)
{

}

/**
 * 
 * @param {*} Session Sessão a ser salva
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
    var contact = await msg.getContact();
    var messageBody = String(msg.body).toLowerCase();
    var messageResponse = '';

    // Mensagens de grupo serão ignoradas
    if(chat.isGroup === true) {
        return;
    }

    // Visualiza a mensagem
    chat.sendSeen();

    // Obtém a resposta adequada
    try 
    {
        BotConfig.GetSettings().robo.mensagem.forEach((element) => {

            // Verifica se deve procurar pela correspondência exata ou pela busca similar
            let exact_match = (element.contem_texto.length > 0) ? false:true;
            
            if(exact_match) 
            {
                // Realiza a busca exata
                element.texto_exato.forEach((subelement) => 
                {
                    // Verifica se a mensagem enviada contém algum dos textos
                    if(messageBody === subelement)
                    {
                        messageResponse = element.resposta_exato_txt;
                        throw ReturnCodes.RESPONSE_FOUND;
                    }
                });             
            } else 
            {
                // Realiza a busca similar
                element.contem_texto.forEach((subelement) => 
                {

                    // Verifica se a mensagem enviada contém algum dos textos
                    if(messageBody.search(subelement) != -1)
                    {
                        messageResponse = element.resposta_contem_txt;
                        throw ReturnCodes.RESPONSE_FOUND;
                    }
                });
            }
        });
    } catch(code)
    {
        if(code === ReturnCodes.RESPONSE_FOUND)
        {            
            // Resposta localizada
            console.log(`${e}: ${messageResponse}`);
            
            // Responde o usuário
            if(messageResponse.length > 0)
                msg.reply(messageResponse);
        } else 
        {
            // Response com o texto padrão
        }
    }
}

// Exporta as funções públicas
this.on_user_authenticated = OnUserAuthenticated;
this.on_client_state_changed = OnClientStateChanged;
this.on_message_received = OnMessageReceived;
this.on_client_ready = OnClientReady;
this.on_auth_failed = OnAuthFailed;
this.generate_qr_code = GenerateQRCode;
