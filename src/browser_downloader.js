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

//const os = require("os");
//const http_client = require("http");
const puppeteer = require("puppeteer-core");
//const { win32 } = require("path");
//const { BrowserChannels } = require("./constants");
var Spinner = require("cli-spinner").Spinner;

// Usada para verificar se a revisão foi baixada
//let have_revision = false;

/**
 * Obtém o sistema operacional atualmente em execução
 */
/*
function GetOSName()
{
    let system = "";
    let arch = "";

    // Obtém a plataforma atual
    system = os.platform();
    arch = os.arch();

    switch(system)
    {
        case "win32":
            if(arch === "x64")
                system = "win64";
            else
                system = "win";
        break;

        case "linux":
        break;

        case "darwin":
            system = "macos";
        break;

        default:
            system = "unrecognized";
    }

    return system;
}
*/

/**
 * Obtém o número de revisão do Browser mais recente da plataforma
 */
async function GetRevisionNumber()
{   
    let revision_number = 782078;
    //var our_os = "win";//GetOSName();
    //var sel_channel = BrowserChannels.CANARY_CHANNEL;
    //var request_url = `http://omahaproxy.appspot.com/all.json?os=${our_os}&channel=${sel_channel}`;

    //console.log(request_url);

    return new Promise((resolve, reject) => 
    {
        resolve(revision_number);

        /*
        // Envia a request HTTP
        const req = http_client.request(request_url, (Incoming) => 
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
                var operating_systems = JSON.parse(json_data);
                let limit = operating_systems.length;

                for(let i = 0; i < limit; i++) 
                {
                    // Se não for a nossa plataforma, vá para a próxima iteração
                    if(operating_systems[i].os != our_os)
                        continue;

                    let versions_limit = operating_systems[i].versions.length;

                    for(let j = 0; j < versions_limit; j++) {

                        // Obtém o nome do canal
                        let channel_name = operating_systems[i].versions[j].channel;
                        
                        // Se o canal for estável, então podemos pegar o número de revisão e sair
                        if(channel_name === sel_channel) {
                            revision_number = operating_systems[i].versions[j].branch_base_position;
                            have_revision = true;
                            break;
                        }
                    }
                }

                if(!have_revision)
                    reject("Número de revisão não localizado");
                else
                    resolve(`${revision_number}`);
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
        */
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
        if(browserExists) {
            console.log(`Versão local encontrada: ${local_revisions[0]}`);
            resolve(fetcher.revisionInfo(local_revisions[0]).executablePath);
        }
		else {
            console.log(`O Browser local não foi localizado`);
        }

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
