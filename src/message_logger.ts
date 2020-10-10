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

import constants from './constants';
import Utils from './utils';
import * as fs from "fs";

/**
 * generates the logfilename
 */
function generateLogFilename()
{
    let LOG_FILENAME = `messages_${Utils.getFullDateTime()}.log`;
    return LOG_FILENAME;
}

class MessageLogger 
{
    /**
     * name of the logfile
     */
    logFilename: string;

    /**
     * a file descriptor that represents the file
     */
    fd: number;

    /**
     * max number of bytes per log file
     */
    maxSizeBytes: number;

    /**
     * Creates a new instance of messageLogger
     * 
     * @param maxFileSize max number of bytes per log file
     */
    constructor(maxFileSize: number)
    {
        this.logFilename = generateLogFilename();
        this.fd = -1;
        this.maxSizeBytes = maxFileSize;
    }

    /**
     * starts the message logger
     */
    startLogger(): void
    {
        this.fd = fs.openSync(this.logFilename, constants.APPEND_SYNC);
    }

    /**
     * register a new log on file
     * 
     * @param message message to be registered 
     */
    registerLog(message: string): void
    {
        if(this.fd == -1) {
            console.error("logger was not started correctly");
            return;
        }

        let stat = fs.statSync(this.logFilename);

        // checks if maximum size was reached
        if(stat.size > this.maxSizeBytes) 
        {
            // closes current file and open another
            fs.closeSync(this.fd);
            
            // generates a new filename
            this.logFilename = generateLogFilename();

            // opens the new file
            this.fd = fs.openSync(this.logFilename, constants.APPEND_SYNC);
        }

        // Escreve o log no arquivo de maneira assíncrona
        fs.writeSync(this.fd, message + "\n");
    }
}

// Exporta a classe
export default MessageLogger;
