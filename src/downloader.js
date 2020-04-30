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

const os = require("os");
const http_client = require("http");
const puppeteer = require("puppeteer-core");
var Spinner = require("cli-spinner").Spinner;

// Usada para verificar se a revisão foi baixada
let have_revision = false;

/**
 * Obtém o sistema operacional atualmente em execução
 */
function get_os()
{
    let system = "";

    switch(os.platform)
    {
        case "win32":
            system = "win";
        break;

        case "darwin":
        break;

        default:
            system= "linux";
    }

    return system;
}

/**
 * 
 * @param {*} haveRevision Obtém o número de revisão do Browser mais recente da plataforma
 */
async function get_revision_number(haveRevision)
{
    let revision_number = 0;
    var our_os = get_os();

    http_client.request("http://omahaproxy.appspot.com/all.json", (Incoming) => {
        
    // Armazena os dados
        let json_data = "";
        
        // Recebe os dados e salva num arquivo
        Incoming.on('data', (chunk) => {
            json_data += chunk;
        });

        let can_print = false;

        // Faz o processamento do JSON
        Incoming.on('end', () => {
           
            JSON.parse(json_data, (key, value) => 
            {
                if (key === "os" && value === our_os)
                    can_print = true;
                
                if (key === "branch_base_position" && can_print) 
                {                    
                    if(!have_revision && typeof(value) != undefined) {
                        have_revision = true;
                        haveRevision(value);
                        return;
                    }
                }
            });
        });
    }).end();
}

/**
 * Faz o download do Browser com a revisão especificada
 * 
 * @param {*} revision_number Número de revisão do programa
 */
async function download_browser(revision_number)
{
    // Cria um fetcher
    var fetcher = puppeteer.createBrowserFetcher({path: process.cwd()});

    if(!fetcher.canDownload(revision_number)) 
    {
        console.error(`A versão ${revision_number} não pode ser baixada`);
        return;
    }

    // Configura o spin progress
    let spinner = new Spinner("");
    spinner.start();

    console.log("Instalando dependências ...");

    // Baixa o browser
    const br = await fetcher.download(revision_number, (downloaded, total) => {

        // Atualiza o progresso
        spinner.setSpinnerTitle(`Baixando ---------------- ${(100 * downloaded / total).toFixed(2)}%`);
    }).catch((error) => {
        console.log("Falha ao baixar dependência: " + error);
    }).finally(()=>{
        spinner.stop();
    });
}

/**
 * É chamada assim que o número de revisão é obtido
 * 
 * @param {*} revision Contém o número de revisão obtido
 */
async function on_revision_obtained(revision)
{
    await download_browser(revision);
}

/**
 * Faz o download do Browser
 */
this.getDependencies = async function()
{
    await get_revision_number(on_revision_obtained);
}
