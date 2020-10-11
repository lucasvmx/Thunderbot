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

import { join } from "path";

/**
 * General constants
 */
class Constants
{
    /**
     * Pasta contendo os dados da seção
     */
    static SESSION_FOLDER: string = "sessions";

    /**
     * Pasta contendo as configurações
     */
    static SETTINGS_FOLDER: string = 'settings';

    /**
     * Nome do arquivo que contém a sessão
     */
    static SESSION_FILE: string = join(process.cwd(), join(Constants.SESSION_FOLDER, "thunderbot.json"));

    /**
     * Nome do arquivo de configurações
     */
    static SETTINGS_FILE: string = join(process.cwd(), join(Constants.SETTINGS_FOLDER, "settings.json"));

    /**
     * Resposta encontrada
     */
    static RESPONSE_FOUND: number = 1;

    /**
     * Resposta não encontrada
    */
    static RESPONSE_NOT_FOUND: number = 2;

    /**
    * Canal estável
    */
    static STABLE_CHANNEL: string = "stable";

    /**
    * Canal de desenvolvimento
    */
    static DEV_CHANNEL: string = "dev";

    /**
    * Canal 'canary'
    */
    static CANARY_CHANNEL: string = "canary";

    /**
     * Open in async mode and to append data
     */
    static APPEND_SYNC: string = "as";
}

export default Constants;
