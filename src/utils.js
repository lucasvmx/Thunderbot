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
 * Utilidades em geral
 */
class utils 
{
    static GetDateTimeFromUnixTimestamp(unix_timestamp)
    {
        // Obtém a data e transforma em milissegundos
        let dt = new Date(unix_timestamp * 1000);
        let day, month, year, hour, minute, second;

        day = "0" + dt.getDate();
        month = "0" + dt.getMonth();
        year = dt.getFullYear();
        hour = "0" + dt.getHours();
        minute = "0" + dt.getMinutes();
        second = "0" + dt.getSeconds();

        day = day.substr(-2);
        month = month.substr(-2);
        hour = hour.substr(-2);
        minute = minute.substr(-2);
        second = second.substr(-2);

        return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
    }

    /**
    * Constrói a data e retorna em formato de string
    */
    static buildTimeString()
    {
        let dt = new Date();
        let day, month, year, hour, minute, second, ms;

        day = "0" + dt.getDate();
        month = "0" + (dt.getMonth() + 1);
        year = dt.getFullYear();
        hour = "0" + dt.getHours();
        minute = "0" + dt.getMinutes();
        second = "0" + dt.getSeconds();
        ms = dt.getMilliseconds();

        day = day.substr(-2);
        month = month.substr(-2);
        hour = hour.substr(-2);
        minute = minute.substr(-2);
        second = second.substr(-2);
        
        return `${day}${month}${year}_${hour}${minute}${second}${ms}`;
    }
}

this.Utils = utils;
