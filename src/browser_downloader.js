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
function GetOSName()
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
 * Obtém o número de revisão do Browser mais recente da plataforma
 */
async function GetRevisionNumber()
{   
    let revision_number = -1;
    var our_os = GetOSName();
    let can_print = false;

    return new Promise((resolve, reject) => 
    {
        // Envia a request HTTP
        const req = http_client.request("http://omahaproxy.appspot.com/all.json", (Incoming) => 
        {
            // Armazena os dados
            let json_data = "";
            
            // Recebe os dados e salva num arquivo
            Incoming.on('data', (chunk) => {
                json_data += chunk;
            });
            
            // Faz o processamento do JSON
            Incoming.on('end', () => 
            {
                // Analisa o JSON devolvido
                JSON.parse(json_data, (key, value) => 
                {
                    if (key === "os" && value === our_os)
                        can_print = true;
                    
                    if (key === "branch_base_position" && can_print) 
                    {                    
                        if (!have_revision && typeof(value) != undefined) {
                            have_revision = true;
                            revision_number = value;
                            
                            // Número de revisão extraído
                            resolve(revision_number);
                        }
                    }
                });
            });
        });

        req.on("error", (err) => {
            console.log("Erro ao obter número de revisão");
            console.log("Certifique-se de que você possui conexão com a internet");
            console.log("Se o problema persistir, verifique as configurações do seu firewall");
            reject(err);
        });

        // Finaliza a request
        req.end();
    });
}

/**
 * Faz o download do Browser com a revisão especificada
 * 
 * @param {*} revision_number Número de revisão do programa
 */
async function DownloadBrowser(revision_number)
{
    return new Promise(async(resolve, reject) => 
    {
        // Cria um fetcher
        var fetcher = puppeteer.createBrowserFetcher({path: process.cwd()});
        
        // Tenta obter uma lista com as revisões locais
        let local_revisions = await fetcher.localRevisions();
        let browserExists = (local_revisions.length > 0) ? true : false;

        // Se o browser já existe então devemos resolver a promise com o caminho do browser local
        if(browserExists)
            resolve(fetcher.revisionInfo(local_revisions[0]).executablePath);

        console.log(`O Browser já existe`);
    
        // Verifica se é possível baixar a versão especificada
        if(!fetcher.canDownload(revision_number)) 
        {
            reject(`A versão ${revision_number} não pode ser baixada`);
            return;
        }

        console.log("Iniciando download ...");

        // Configura o spin progress
        let spinner = new Spinner("");
        spinner.start();

        let start, end, speed = 0, progress = 0;

        // Baixa o browser
        let browser = fetcher.download(revision_number, (downloaded, total) => {

            // Pega o número de bytes transferido
            start = total - downloaded;

            // Calcula a velocidade de download e atualiza o status da operação
            setTimeout(()=> {
                end = total - downloaded;
                speed = ((end - start) / 1024.0).toFixed(2);

                if((end == start) && (progress < 100))
                    spinner.setSpinnerTitle("Aguardando conexão de rede ...");
                else if((end == start) && (progress == 100))
                    spinner.setSpinnerTitle("Finalizando o download ...");
            }, 1000);

            // Calcula o progresso
            progress = (100.0 * downloaded / total).toFixed(2);

            // Atualiza o progresso
            spinner.setSpinnerTitle(`Baixando ---------------- ${progress}% ${speed} KB/s`);
        }).catch((error) => 
        {
            // Para o spinner
            spinner.stop();

            // Chama a função reject
            reject(error);

        }).finally(() => 
        {
            let exePath;

            // Para o spinner
            spinner.stop();

            // Se dá como resolvida no término do download e passa o caminho do browser baixado
            resolve(exePath);
        });
    });
}

this.GetBrowser = DownloadBrowser;
this.GetBrowserVersion = GetRevisionNumber;
