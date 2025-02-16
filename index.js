import fs from 'fs';
import readline from 'readline';
import axios from 'axios';
import chalk from 'chalk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Read questions from questions.txt
const questions = fs.readFileSync('questions.txt', 'utf8').split('\n').filter(q => q.trim() !== '');

// Helper function to format the response
function formatResponse(response, maxLength = 50) {
    if (response.length <= maxLength) {
        return response;
    }
    return response.slice(0, maxLength - 3) + '...';
}

// Function to check if the response is an HTML error page
function isHtmlErrorPage(response) {
    return typeof response === 'string' && response.trim().startsWith('<!DOCTYPE html>');
}

// Function to send a request to the API
async function sendRequest(domain, apiKey, question) {
    if (!domain) {
        console.log(chalk.red.bold('Error: Domain is not set. Please set it first.'));
        return;
    }

    const url = `https://${domain}.gaia.domains/v1/chat/completions`;
    const data = {
        messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: question }
        ]
    };

    try {
        const response = await axios.post(url, data, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'accept': 'application/json',
                'Content-Type': 'application/json'
            },
            validateStatus: function (status) {
                return status < 500; // Reject only if the status code is greater than or equal to 500
            }
        });

        // Check if the response is an HTML error page
        if (isHtmlErrorPage(response.data)) {
            console.log(chalk.red.bold('Your domain is suck😡, please change it.'));
            return;
        }

        const messageContent = response.data.choices[0].message.content;
        const formattedResponse = formatResponse(messageContent);
        console.log(chalk.green.bold(`\nQuestion: ${question}`));
        console.log(chalk.blue.bold(`Response:`));
        console.log(chalk.cyan(formattedResponse));
    } catch (error) {
        if (error.response && isHtmlErrorPage(error.response.data)) {
            console.log(chalk.red.bold('Your domain is invalid, please change it.'));
        } else {
            console.error(chalk.red.bold(`Error for question "${question}":`), error.response ? error.response.data : error.message);
        }
    }
}

// Function to save environment variables to .env file
function saveEnv(key, value) {
    const envPath = '.env';
    let envContent = '';

    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
    }

    const lines = envContent.split('\n').filter(line => !line.startsWith(`${key}=`));
    lines.push(`${key}=${value}`);
    fs.writeFileSync(envPath, lines.join('\n'));
}

// Function to display menu and get user input
async function displayMenu(domain, apiKeySet) {
    console.log(chalk.yellow.bold('\n=== Gaia API BotChat ==='));
    console.log(chalk.white(`1. Set domain (current domain: ${chalk.green(domain || 'Not Set')})`));
    console.log(chalk.white(`2. Add GAIA API KEY (${apiKeySet ? chalk.green('API Key Set') : chalk.red('API Key Not Set')})`));
    console.log(chalk.white('3. Run script'));
    console.log(chalk.white('4. Exit'));

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const choice = await new Promise(resolve => {
        rl.question(chalk.yellow.bold('Choose an option: '), (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });

    return choice;
}

// Function to run the script
async function runScript() {
    let domain = process.env.DOMAIN || ''; // Read domain from .env
    let apiKey = process.env.GAIA_API_KEY || ''; // Read API key from .env
    let apiKeySet = !!apiKey;

    while (true) {
        const choice = await displayMenu(domain, apiKeySet);

        switch (choice) {
            case '1':
                domain = await new Promise(resolve => {
                    const rl = readline.createInterface({
                        input: process.stdin,
                        output: process.stdout
                    });
                    rl.question(chalk.yellow.bold('Enter custom domain (leave empty to unset): '), (answer) => {
                        rl.close();
                        resolve(answer.trim());
                    });
                });
                saveEnv('DOMAIN', domain);
                break;
            case '2':
                apiKey = await new Promise(resolve => {
                    const rl = readline.createInterface({
                        input: process.stdin,
                        output: process.stdout
                    });
                    rl.question(chalk.yellow.bold('Enter GAIA API KEY: '), (answer) => {
                        rl.close();
                        resolve(answer.trim());
                    });
                });
                apiKeySet = !!apiKey;
                if (apiKeySet) {
                    saveEnv('GAIA_API_KEY', apiKey);
                    console.log(chalk.green.bold('API Key set successfully!'));
                }
                break;
            case '3':
                if (!apiKeySet) {
                    console.log(chalk.red.bold('Error: GAIA API KEY is not set. Please add it first.'));
                    break;
                }

                if (!domain) {
                    console.log(chalk.red.bold('Error: Domain is not set. Please set it first.'));
                    break;
                }

                const interval = await new Promise(resolve => {
                    const rl = readline.createInterface({
                        input: process.stdin,
                        output: process.stdout
                    });
                    rl.question(chalk.yellow.bold('Enter interval between questions in seconds (default: 3): '), (answer) => {
                        rl.close();
                        resolve(parseInt(answer.trim()) || 3);
                    });
                });

                const iterations = await new Promise(resolve => {
                    const rl = readline.createInterface({
                        input: process.stdin,
                        output: process.stdout
                    });
                    rl.question(chalk.yellow.bold('Enter number of iterations (default: infinite): '), (answer) => {
                        rl.close();
                        resolve(answer.trim() === '' ? Infinity : parseInt(answer.trim()));
                    });
                });

                let iterationCount = 0;
                while (iterationCount < iterations) {
                    console.log(chalk.magenta.bold(`\n=== Iteration ${iterationCount + 1} ===`));
                    for (const question of questions) {
                        await sendRequest(domain, apiKey, question);
                        await new Promise(resolve => setTimeout(resolve, interval * 1000));
                    }
                    iterationCount++;
                    if (iterations === Infinity) {
                        // For infinite iterations, reset the counter
                        iterationCount = 0;
                    }
                }
                break;
            case '4':
                console.log(chalk.yellow.bold('Exiting...'));
                return;
            default:
                console.log(chalk.red.bold('Invalid option. Please try again.'));
        }
    }
}

// Run the script
runScript();