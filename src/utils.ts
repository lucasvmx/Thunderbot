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
 * general utilities
 */
class Utils
{
    /**
     * gets a datetime string in a proper format to be used while generating filenames
     * 
     * @returns string full string containing date and time
     */
    static getFullDateTime() : string
    {
        let dt = new Date();
        let day, month, year, hour, minute, second, ms;

        day = ("0" + dt.getDate()).substr(-2);
        month = ("0" + (dt.getMonth() + 1)).substr(-2);
        year = (dt.getFullYear().toString()).substr(-2);
        hour = ("0" + dt.getHours()).substr(-2);
        minute = ("0" + dt.getMinutes()).substr(-2);
        second = ("0" + dt.getSeconds()).substr(-2);
        ms = dt.getMilliseconds().toString().substr(-2);
        
        return `${day}${month}${year}_${hour}${minute}${second}${ms}`;
    }

    /**
     * uses a unix timestamp to build a datetime string
     * 
     * @param unix_timestamp 
     * @returns string full string containing date and time
     */
    static getDateTimeFromTimestamp(unix_timestamp: number): string
    {
        let dt = new Date(unix_timestamp * 1000);
        let day, month, year, hour, minute, second, ms;

        day = ("0" + dt.getDate()).substr(-2);
        month = ("0" + (dt.getMonth() + 1)).substr(-2);
        year = (dt.getFullYear().toString()).substr(-2);
        hour = ("0" + dt.getHours()).substr(-2);
        minute = ("0" + dt.getMinutes()).substr(-2);
        second = ("0" + dt.getSeconds()).substr(-2);
        ms = dt.getMilliseconds().toString().substr(-2);
        
        return `${day}${month}${year}_${hour}${minute}${second}${ms}`;
    }
}

export default Utils;

