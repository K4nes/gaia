# Gaianet BotChat

Gaianet BotChat is a command-line tool that interacts with the GAIA API to send chat messages and receive responses. It allows users to set a custom domain, add an API key, and run the script to send questions from a `questions.txt` file.

## Features

- Set custom domain for the API
- Add GAIA API key
- Send chat messages to the GAIA API
- Display responses in a formatted manner
- Handle HTML error pages
- Save environment variables to `.env` file

## Prerequisites

- Node.js 
- npm 

## Installation

1. Clone the repository:

    ```sh
    git clone https://github.com/K4nes/gaia
    cd gaia
    ```

2. Install dependencies:

    ```sh
    npm install
    ```

3. Create a `.env` file in the gaia directory with the following content:

    ```env
    DOMAIN=put_only_your_domain_name_here
    GAIA_API_KEY=your_api_key_here
    ```

4. Create a `questions.txt` file in the gaia directory with your questions, one per line.

## Usage

To run the script, use the following command:

```sh
node index.js
```