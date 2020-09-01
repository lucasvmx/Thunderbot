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

const puppeteer = require("puppeteer-core");
var Spinner = require("cli-spinner").Spinner;

/**
 * Obtém o número de revisão do Browser mais recente da plataforma
 */
async function GetRevisionNumber()
{   
    let revision_number = 782078;

    return new Promise((resolve, reject) => 
    {
        resolve(revision_number);
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
