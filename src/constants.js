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

/**
 * Definições de pasta
 */
exports.Folders = {
    
    /**
     * Pasta contendo os dados da seção
     */
    SESSION_FOLDER: 'sessions',

    /**
     * Pasta contendo as configurações
     */
    SETTINGS_FOLDER: 'settings'
};

/**
 * Configurações
 */
exports.Settings = {

    /**
     * Nome do arquivo que contém a sessão
     */
    SESSION_FILE: `${this.Folders.SESSION_FOLDER}/thunderbot.json`,

    /**
     * Nome do arquivo de configurações
     */
    SETTINGS_FILE: `${this.Folders.SETTINGS_FOLDER}/settings.json`
};

/**
 * Códigos de retorno
 */
exports.ReturnCodes = {

    /**
     * Resposta encontrada
     */
    RESPONSE_FOUND: 1
};