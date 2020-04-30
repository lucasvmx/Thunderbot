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

const qrcode = require('qrcode-terminal');

/**
 * 
 * @param {*} qr 
 */
this.generate_qr_code = function (qr)
{
    qrcode.generate(qr, {small: true});
};

/**
 * 
 */
this.on_client_ready = function()
{
    console.log("Cliente configurado");
};

/**
 * 
 * @param {*} msg 
 */
this.on_message_received = function(msg)
{
    // Mensagens de grupo serão ignoradas
    if(msg.getChat().isGroup === true) {
        return;
    }
};

