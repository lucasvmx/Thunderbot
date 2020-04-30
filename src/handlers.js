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

const qrcode = require("qrcode-terminal");
const bot = require('./setup');
let fs = require("fs");
require("log-timestamp");

/**
 * 
 * @param {*} qr 
 */
function GenerateQRCode(qr)
{
    qrcode.generate(qr, {small: true});
}

/**
 * 
 */
function OnClientReady()
{
    // Exibe o status online
    bot._client.sendPresenceAvailable();

    // Avisa ao usuário que está pronto para receber mensagens
    console.log("Carregamento concluído. Aguardando mensagens ...");
}

/**
 * 
 * @param {*} msg 
 */
function OnMessageReceived(msg)
{
    let chat = msg.getChat();
    let chatId = chat.id;

    // Mensagens de grupo serão ignoradas
    if(chat.isGroup === true) {
        return;
    }

    // Responde o usuário
    msg.reply(msg.body, chatId);
}

/**
 * 
 * @param {*} state 
 */
function OnClientStateChanged(state)
{
    if(state === "TIMEOUT")
        process.exit(0);  
}

/**
 * 
 * @param {*} Session 
 */
function OnUserAuthenticated(Session)
{
    console.log(Session);
    
    // Salva a sessão
    saveSession(Session);
}

/**
 * 
 * @param {*} Session Sessão a ser salva
 */
function saveSession(Session)
{
    fs.writeFileSync(bot.SESSION_FILE, JSON.stringify(Session), function(err) {
        if(err) {
            console.log("Failed to save session");
        }
    });
}

// Exporta as funções
this.on_user_authenticated = OnUserAuthenticated;
this.on_client_state_changed = OnClientStateChanged;
this.on_message_received = OnMessageReceived;
this.on_client_ready = OnClientReady;
this.generate_qr_code = GenerateQRCode;
