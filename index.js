import * as dotenv from "dotenv";
dotenv.config();
import { createRequire } from "module";
const require = createRequire(import.meta.url);
import {Configuration, OpenAIApi} from "openai";
const qrcode = require('qrcode-terminal');
const { Client } = require('whatsapp-web.js');
const client = new Client();

//adding your openAI api key to the configuration object
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

//creating openAI connection
const openai = new OpenAIApi(configuration);

//making QR code to connect with the phone that will host the bot
client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

//confirmation message after connecting phone
client.on('ready', () => {
    console.log('Client is ready!');
});

//message checking
client.on('message', message => {
    //confirmation of service availability => if the user sends /ping, answer with /pong
	if(message.body === '/ping') {
		message.reply('/pong');
	}
    //if the message starts with /gpt, the remainder of the message is sent to openAI API and the answer is sent back
    if(message.body.slice(0, 4) === "/gpt"){
        const question = message.body.slice(5);
        console.log(question);
        const promise = connectOpenai(question);
        promise.then(answer => {
            console.log(answer);
            client.sendMessage(message.from, answer);
        })
    }
});

//initialize whatsapp web API
client.initialize();

//as per the documentation over at openAI => https://platform.openai.com/docs/api-reference/chat/create
async function connectOpenai(userQuestion){
    try {
        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{"role": "user", "content": userQuestion}]
        });
        return completion.data.choices[0].message?.content;
    } catch (error) {
        console.log(error);
        return "ChatGPT is unavailable right now, please try again later.";
    }
}