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

var consts = require('./constants');
var fs = require("fs");
const { Utils } = require('./utils');

/**
 * Gera o nome do arquivo de log
 */
function generateLogFilename()
{
    let LOG_FILENAME = `Messages_${Utils.buildTimeString()}.log`;
    return LOG_FILENAME;
}

class messageLogger 
{
    constructor(max_file_size)
    {
        // Abre o arquivo
        this.LOG_FILENAME = generateLogFilename();
        this.fd = -1;
        this.max_size_bytes = max_file_size;
    }

    /**
     * Inicia o logger
     */
    start_logger()
    {
        this.fd = fs.openSync(this.LOG_FILENAME, consts.FileOpenModes.APPEND_SYNC);
    }

    /**
     * 
     * @param {*} message Log a ser registrado no arquivo
     */
    register_log(message)
    {
        if(this.fd == -1) {
            console.error("O logger não foi iniciado corretamente");
            return;
        }

        let stat = fs.statSync(this.LOG_FILENAME);

        // Verifica se o tamanho máximo foi excedido
        if(stat.size > this.max_size_bytes) 
        {
            // O tamanho máximo foi atingido. Devemos criar outro arquivo e fechar o atual
            fs.closeSync(this.fd);
            
            // Gera o nome do novo arquivo
            this.LOG_FILENAME = generateLogFilename();

            // Abre o novo e atualiza o file descriptor
            this.fd = fs.openSync(this.LOG_FILENAME, consts.FileOpenModes.APPEND_SYNC);
        }

        // Escreve o log no arquivo de maneira assíncrona
        fs.writeSync(this.fd, message + "\n");
    }
}

// Exporta a classe
this.MessageLogger = messageLogger;
