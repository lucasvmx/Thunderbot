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

const puppeteer = import("puppeteer");
import { Spinner } from "cli-spinner";
import { BrowserFetcher } from "puppeteer-core";

/**
 * class to handle browser operations
 */
class Browser
{
    /**
     * initialize a instance of browser class
     */
    constructor()
    {

    }

    /**
     * Gets the latest Browser revision number for the platform
     */
    async getRevisionNumber()
    {   
        let revision_number = 800071;

        return new Promise((resolve, reject) => 
        {
            resolve(revision_number);
        });
    }

    /**
     * Download the Browser with the specified revision
     * 
     * @param revision_number program revision number
     * @returns Promise<string> full path of local browser executable
     */
    async download(revision_number: number): Promise<string>
    {
        return new Promise(async(resolve, reject) => 
        {
            let fetcher: BrowserFetcher;

            // creates fetcher
            try {
                fetcher = (await puppeteer).createBrowserFetcher({path: process.cwd()});
            } catch(err) {
                console.error("failed to create browser fetcher: " + err);
                process.exit(1);
            }

            // Try to get a list of local versions
            let local_revisions = await fetcher.localRevisions();
            let browserExists = (local_revisions.length > 0) ? true : false;

            // If the browser already exists then we must resolve the promise with the path of the local browser
            if(browserExists) {
                console.log(`local version found: ${local_revisions[0]}`);
                resolve(fetcher.revisionInfo(local_revisions[0]).executablePath);
            }
            else {
                console.log(`local browser not installed yet`);
            }

            // Checks whether it is possible to download the specified version
            if(!fetcher.canDownload(revision_number.toString())) 
            {
                reject(`version ${revision_number} couldn't be downloaded`);
                return;
            }

            console.log("starting download ...");

            // configure spin progress
            let spinner: Spinner = new Spinner("");

            let start: number;
            let end: number;
            let speed: number = 0;
            let progress: number = 0;

            spinner.start();

            // Download the browser
            await fetcher.download(revision_number.toString(), (downloaded, total) => {

                // Get the number of bytes transferred
                start = total - downloaded;

                // Calculates download speed and updates operation status
                setTimeout(()=> {
                    end = total - downloaded;
                    speed = ((end - start) / 1024.0);
                    
                    if((end == start) && (progress < 100))
                        spinner.setSpinnerTitle("waiting for network connection");
                    else if((end == start) && (progress == 100))
                        spinner.setSpinnerTitle("finishing download ...");
                }, 1000);

                // Calculates progress
                progress = (100.0 * downloaded / total);

                // Updates progress
                spinner.setSpinnerTitle(`downloading ------- ${progress.toFixed(2)}% ${speed.toFixed(2)} KB/s`);
            }).catch((error) => 
            {
                spinner.stop();

                reject(error);
            });

            // stops the spinner
            spinner.stop();
            spinner.clearLine(spinner.stream);
            
            let browserLocation = fetcher.revisionInfo(revision_number.toString()).executablePath;
            
            resolve(browserLocation);
        });
    }    
}

export default Browser;
